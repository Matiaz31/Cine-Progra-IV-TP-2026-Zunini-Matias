import {
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { supabase } from '../../../core/supabase';
import { AdminPermissionSet, AdminPermissionsService } from '../../../core/admin-permissions.service';

interface MovieOption {
  id: string;
  title: string;
  duration_minutes: number;
}

interface RoomOption {
  id: string;
  name: string;
}

interface WaitlistAdminEntry {
  waitlist_id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  status: string;
  created_at: string;
  offer_expires_at: string | null;
}

interface ScreeningCancellationPreview {
  screening_id: string;
  movie_title: string | null;
  room_name: string | null;
  start_time: string;
  affected_orders: number;
  affected_tickets: number;
  total_paid: number;
  anonymous_orders: number;
  anonymous_orders_without_email: number;
  orders_with_multiple_screenings: number;
}

interface Screening {
  id: string;
  movie_id: string;
  room_id: string;
  start_time: string;
  end_time: string;
  format: '2D' | '3D' | '4D' | '5D';
  language: 'castellano' | 'subtitulada';
  price: number;
  status: 'scheduled' | 'cancelled';
  movie: { title: string }[] | null;
  room: { name: string }[] | null;
}

@Component({
  selector: 'app-funciones',
  imports: [FormsModule, DatePipe],
  templateUrl: './funciones.html',
  styleUrl: './funciones.scss',
})
export class Funciones {
  private changeDetector = inject(ChangeDetectorRef);
  private permissionsService = inject(AdminPermissionsService);
  permisos: AdminPermissionSet = { view: false, create: false, update: false, delete: false };
  get puedeCrear(): boolean { return this.permisos.create; }
  get puedeModificar(): boolean { return this.permisos.update; }
  get puedeEliminar(): boolean { return this.permisos.delete; }

  get funcionesProximas(): Screening[] {
    const ahora = Date.now();
    return this.funciones.filter(
      (funcion) =>
        funcion.status === 'scheduled' &&
        new Date(funcion.end_time).getTime() > ahora,
    );
  }

  get funcionesHistorial(): Screening[] {
    const ahora = Date.now();
    return this.funciones.filter(
      (funcion) =>
        funcion.status === 'cancelled' ||
        new Date(funcion.end_time).getTime() <= ahora,
    );
  }

  peliculas: MovieOption[] = [];
  salas: RoomOption[] = [];
  funciones: Screening[] = [];
  baseTicketPrice = 0;
  waitlistCounts: Record<string, number> = {};
  waitlistDetails: WaitlistAdminEntry[] = [];
  expandedWaitlistScreeningId: string | null = null;
  loadingWaitlist = false;

  loading = true;
  guardando = false;
  error = '';
  mensaje = '';

  mostrarFormulario = false;
  mostrarModalCancelacion = false;
  funcionACancelar: Screening | null = null;
  vistaPreviaCancelacion: ScreeningCancellationPreview | null = null;
  motivoCancelacion = '';
  editando = false;
  funcionEditandoId: string | null = null;

  nuevaFuncion = {
    movie_id: '',
    room_id: '',
    fecha: '',
    hora: '',
    format: '2D' as Screening['format'],
    language: 'castellano' as Screening['language'],
    price: 0,
  };

  async ngOnInit() {
    this.permisos = await this.permissionsService.obtenerPermisos('screenings');
    if (!this.permisos.view) { this.error = 'No tenés permisos para consultar las funciones.'; this.loading = false; return; }
    await this.cargarDatos();
  }

  async cargarDatos() {
    if (!this.permisos.view) return;
    this.loading = true;
    this.error = '';

    try {
      const [peliculasResult, salasResult, funcionesResult, precioResult] =
        await Promise.all([
          supabase
            .from('movies')
            .select('id, title, duration_minutes')
            .eq('is_active', true)
            .order('title'),

          supabase
            .from('rooms')
            .select('id, name')
            .eq('is_active', true)
            .order('name'),

          supabase
            .from('screenings')
            .select(`
              id,
              movie_id,
              room_id,
              start_time,
              end_time,
              format,
              language,
              price,
              status,
              movie:movies!screenings_movie_id_fkey(title),
              room:rooms!screenings_room_id_fkey(name)
            `)
            .order('start_time', { ascending: true }),

          supabase
            .from('ticket_pricing_settings')
            .select('base_price')
            .eq('id', true)
            .single(),
        ]);

      if (peliculasResult.error) throw peliculasResult.error;
      if (salasResult.error) throw salasResult.error;
      if (funcionesResult.error) throw funcionesResult.error;
      if (precioResult.error) throw precioResult.error;

      const { data: waitlistRows, error: waitlistError } = await supabase
        .from('screening_waitlist')
        .select('screening_id, status')
        .in('status', ['waiting', 'offered']);
      if (waitlistError) throw waitlistError;
      this.waitlistCounts = {};
      for (const entry of waitlistRows ?? []) {
        this.waitlistCounts[entry.screening_id] =
          (this.waitlistCounts[entry.screening_id] ?? 0) + 1;
      }

      this.peliculas = (peliculasResult.data ?? []) as MovieOption[];
      this.baseTicketPrice = Number(precioResult.data.base_price);
      this.salas = (salasResult.data ?? []) as RoomOption[];
      this.funciones = (funcionesResult.data ?? []).map((funcion: any) => ({...funcion,
      movie: funcion.movie
        ? Array.isArray(funcion.movie)
          ? funcion.movie
          : [funcion.movie]
        : null,
      room: funcion.room
        ? Array.isArray(funcion.room)
          ? funcion.room
          : [funcion.room]
        : null,
    })) as Screening[];

    } catch (error) {
      console.error('ERROR AL CARGAR FUNCIONES:', error);
      this.error = 'No se pudieron cargar las películas, salas o funciones.';
    } finally {
      this.loading = false;
      this.changeDetector.detectChanges();
    }
  }

  async toggleWaitlist(funcion: Screening) {
    if (this.expandedWaitlistScreeningId === funcion.id) {
      this.expandedWaitlistScreeningId = null;
      this.waitlistDetails = [];
      return;
    }
    this.expandedWaitlistScreeningId = funcion.id;
    this.waitlistDetails = [];
    this.loadingWaitlist = true;
    try {
      const { data, error } = await supabase.rpc('get_screening_waitlist_admin', {
        p_screening_id: funcion.id,
      });
      if (error) throw error;
      this.waitlistDetails = (data ?? []) as WaitlistAdminEntry[];
    } catch (error: any) {
      this.error = error?.message ?? 'No se pudo cargar el detalle de la lista de espera.';
      this.expandedWaitlistScreeningId = null;
    } finally {
      this.loadingWaitlist = false;
      this.changeDetector.detectChanges();
    }
  }

  nombreEstadoEspera(status: string): string {
    const estados: Record<string, string> = {
      waiting: 'En espera',
      offered: 'Oferta enviada',
      accepted: 'Aceptada',
      expired: 'Vencida',
      cancelled: 'Cancelada',
    };
    return estados[status] ?? status;
  }

  get horaFinCalculada(): string {
    const pelicula = this.peliculas.find(
      (p) => p.id === this.nuevaFuncion.movie_id,
    );

    if (!pelicula || !this.nuevaFuncion.fecha || !this.nuevaFuncion.hora) {
      return '';
    }

    const inicio = new Date(
      `${this.nuevaFuncion.fecha}T${this.nuevaFuncion.hora}`,
    );

    if (Number.isNaN(inicio.getTime())) return '';

    const fin = new Date(
      inicio.getTime() + pelicula.duration_minutes * 60_000,
    );

    return fin.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  abrirFormulario() {
    if (!this.puedeCrear) return;
    if (this.guardando) return;

    this.editando = false;
    this.funcionEditandoId = null;
    this.limpiarFormulario();
    this.error = '';
    this.mensaje = '';
    this.mostrarFormulario = true;

    this.changeDetector.detectChanges();
  }

  editarFuncion(funcion: Screening) {
    if (!this.puedeModificar || funcion.status !== 'scheduled' || !this.esFutura(funcion)) return;
    if (this.guardando) return;

    const inicio = new Date(funcion.start_time);

    const fecha = [
      inicio.getFullYear(),
      String(inicio.getMonth() + 1).padStart(2, '0'),
      String(inicio.getDate()).padStart(2, '0'),
    ].join('-');

    const hora = [
      String(inicio.getHours()).padStart(2, '0'),
      String(inicio.getMinutes()).padStart(2, '0'),
    ].join(':');

    this.editando = true;
    this.funcionEditandoId = funcion.id;

    this.nuevaFuncion = {
      movie_id: funcion.movie_id,
      room_id: funcion.room_id,
      fecha,
      hora,
      format: funcion.format,
      language: funcion.language,
      price: this.baseTicketPrice,
    };

    this.error = '';
    this.mensaje = '';
    this.mostrarFormulario = true;

    this.changeDetector.detectChanges();
  }

  esFutura(funcion: Screening): boolean {
    return new Date(funcion.start_time).getTime() > Date.now();
  }

  puedeEditarFuncion(funcion: Screening): boolean {
    return this.puedeModificar && funcion.status === 'scheduled' && this.esFutura(funcion);
  }

  puedeCancelarFuncion(funcion: Screening): boolean {
    return this.puedeEliminar && funcion.status === 'scheduled' && this.esFutura(funcion);
  }

  formatearImporte(valor: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2,
    }).format(Number(valor) || 0);
  }

  obtenerEstadoVisual(funcion: Screening): string {
    if (funcion.status === 'cancelled') return 'Cancelada';
    if (new Date(funcion.end_time).getTime() <= Date.now()) return 'Finalizada';
    if (new Date(funcion.start_time).getTime() <= Date.now()) return 'En curso';
    return 'Programada';
  }

  async abrirCancelacion(funcion: Screening) {
    if (!this.puedeCancelarFuncion(funcion) || this.guardando) return;

    this.error = '';
    this.mensaje = '';
    this.guardando = true;
    this.funcionACancelar = funcion;
    this.vistaPreviaCancelacion = null;
    this.motivoCancelacion = '';
    this.changeDetector.detectChanges();

    try {
      const { data, error } = await supabase.rpc(
        'get_screening_cancellation_preview',
        { p_screening_id: funcion.id },
      );

      if (error) throw error;

      this.vistaPreviaCancelacion = data as ScreeningCancellationPreview;
      this.mostrarModalCancelacion = true;
    } catch (error: any) {
      console.error('ERROR AL PREVISUALIZAR CANCELACIÓN:', error);
      this.error = error?.message ?? 'No se pudo consultar el resumen de la cancelación.';
      this.funcionACancelar = null;
    } finally {
      this.guardando = false;
      this.changeDetector.detectChanges();
    }
  }

  cerrarModalCancelacion() {
    if (this.guardando) return;
    this.mostrarModalCancelacion = false;
    this.funcionACancelar = null;
    this.vistaPreviaCancelacion = null;
    this.motivoCancelacion = '';
    this.changeDetector.detectChanges();
  }

  async confirmarCancelacion() {
    if (!this.puedeEliminar) {
      this.error = 'No tenés permisos para cancelar funciones.';
      return;
    }
    if (this.guardando || !this.funcionACancelar || !this.vistaPreviaCancelacion) return;

    const motivo = this.motivoCancelacion.trim();
    if (!motivo) {
      this.error = 'Ingresá el motivo de la cancelación.';
      return;
    }

    this.error = '';
    this.mensaje = '';
    this.guardando = true;
    this.changeDetector.detectChanges();

    try {
      const { data, error } = await supabase.rpc('cancel_screening', {
        p_screening_id: this.funcionACancelar.id,
        p_reason: motivo,
      });

      if (error) throw error;

      const resultado = data as { affected_orders?: number; credits_created?: number };
      this.mostrarModalCancelacion = false;
      this.funcionACancelar = null;
      this.vistaPreviaCancelacion = null;
      this.motivoCancelacion = '';
      this.mensaje = `Función cancelada correctamente. Compras afectadas: ${resultado?.affected_orders ?? 0}. Créditos generados: ${resultado?.credits_created ?? 0}.`;
      await this.cargarDatos();
    } catch (error: any) {
      console.error('ERROR AL CANCELAR FUNCIÓN:', error);
      this.error = error?.message ?? 'No se pudo cancelar la función.';
    } finally {
      this.guardando = false;
      this.changeDetector.detectChanges();
    }
  }

  cerrarFormulario() {
    if (this.guardando) return;

    this.mostrarFormulario = false;
    this.editando = false;
    this.funcionEditandoId = null;
    this.limpiarFormulario();
    this.error = '';

    this.changeDetector.detectChanges();
  }

  private limpiarFormulario() {
    this.nuevaFuncion = {
      movie_id: '',
      room_id: '',
      fecha: '',
      hora: '',
      format: '2D',
      language: 'castellano',
      price: this.baseTicketPrice,
    };
  }

  async guardarFuncion() {
    if (this.editando ? !this.puedeModificar : !this.puedeCrear) { this.error = 'No tenés permisos para realizar esta operación.'; return; }
    if (this.guardando) return;

    this.error = '';
    this.mensaje = '';

    const pelicula = this.peliculas.find(
      (p) => p.id === this.nuevaFuncion.movie_id,
    );

    if (!pelicula) {
      this.error = 'Seleccioná una película activa.';
      return;
    }

    if (this.editando && !this.salas.some((s) => s.id === this.nuevaFuncion.room_id)) {
      this.error = 'Seleccioná una sala activa para la función.';
      return;
    }

    if (!this.nuevaFuncion.fecha || !this.nuevaFuncion.hora) {
      this.error = 'La fecha y la hora de inicio son obligatorias.';
      return;
    }

    const inicio = new Date(
      `${this.nuevaFuncion.fecha}T${this.nuevaFuncion.hora}`,
    );

    if (Number.isNaN(inicio.getTime())) {
      this.error = 'Ingresá una fecha y hora válidas.';
      return;
    }

    const fin = new Date(
      inicio.getTime() + pelicula.duration_minutes * 60_000,
    );

    const precio = Number(this.baseTicketPrice);

    if (!Number.isFinite(precio) || precio < 0) {
      this.error = 'El precio base configurado en Butacas no es válido.';
      return;
    }

    if (this.editando && !this.funcionEditandoId) {
      this.error = 'No se pudo identificar la función que querés editar.';
      return;
    }

    const estabaEditando = this.editando;
    const roomId = this.nuevaFuncion.room_id;

    this.guardando = true;
    this.changeDetector.detectChanges();

    const datos = {
      movie_id: pelicula.id,
      room_id: roomId,
      start_time: inicio.toISOString(),
      end_time: fin.toISOString(),
      format: this.nuevaFuncion.format,
      language: this.nuevaFuncion.language,
      price: precio,
    };

    try {
      let salaAsignada = '';
      if (this.editando && this.funcionEditandoId) {
        const { error } = await supabase.rpc('update_screening_with_seat_migration', {
          p_screening_id: this.funcionEditandoId,
          p_movie_id: datos.movie_id,
          p_room_id: datos.room_id,
          p_start_time: datos.start_time,
          p_end_time: datos.end_time,
          p_format: datos.format,
          p_language: datos.language,
          p_price: datos.price,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.rpc('create_screening_auto_room', {
          p_movie_id: datos.movie_id,
          p_start_time: datos.start_time,
          p_end_time: datos.end_time,
          p_format: datos.format,
          p_language: datos.language,
          p_price: datos.price,
        });
        if (error) throw error;
        const asignacion = Array.isArray(data) ? data[0] : data;
        salaAsignada = asignacion?.room_name ?? '';
      }

      this.mostrarFormulario = false;
      this.editando = false;
      this.funcionEditandoId = null;
      this.limpiarFormulario();

      this.mensaje = estabaEditando
        ? 'Función actualizada correctamente.'
        : `Función creada correctamente${salaAsignada ? ` en ${salaAsignada}` : ''}.`;

      await this.cargarDatos();
    } catch (error: any) {
      console.error('ERROR AL GUARDAR FUNCIÓN:', error);

      const detalle = [
        error?.message,
        error?.details,
        error?.hint,
      ]
        .filter(Boolean)
        .join(' ');

      if (
        detalle.includes('La sala ya tiene una función demasiado cercana') ||
        detalle.includes('screening_time') ||
        detalle.includes('30 minutos')
      ) {
        this.error =
          'No se puede crear la función: debe haber al menos 30 minutos entre una función y la siguiente en la misma sala.';
      } else {
        this.error =
          error?.message ||
          'No se pudo guardar la función. Intentá nuevamente.';
      }
    } finally {
      this.guardando = false;
      this.changeDetector.detectChanges();
    }
  }
}