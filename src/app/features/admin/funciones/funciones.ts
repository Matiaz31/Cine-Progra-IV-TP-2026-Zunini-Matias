import {
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { supabase } from '../../../core/supabase';

interface MovieOption {
  id: string;
  title: string;
  duration_minutes: number;
}

interface RoomOption {
  id: string;
  name: string;
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

  peliculas: MovieOption[] = [];
  salas: RoomOption[] = [];
  funciones: Screening[] = [];
  baseTicketPrice = 0;

  loading = true;
  guardando = false;
  error = '';
  mensaje = '';

  mostrarFormulario = false;
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
    await this.cargarDatos();
  }

  async cargarDatos() {
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

  async eliminarFuncion(funcion: Screening) {
    if (this.guardando) return;

    const confirmar = confirm(
      `¿Seguro que querés eliminar la función de "${funcion.movie?.[0]?.title ?? 'esta película'}"?`,
    );

    if (!confirmar) return;

    this.error = '';
    this.mensaje = '';
    this.guardando = true;
    this.changeDetector.detectChanges();

    try {
      const { error } = await supabase
        .from('screenings')
        .delete()
        .eq('id', funcion.id);

      if (error) throw error;

      this.mensaje = 'Función eliminada correctamente.';
      await this.cargarDatos();
    } catch (error: any) {
      console.error('ERROR AL ELIMINAR FUNCIÓN:', error);

      this.error =
        error?.message ??
        'No se pudo eliminar la función.';
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

    if (!this.salas.some((s) => s.id === this.nuevaFuncion.room_id)) {
      this.error = 'Seleccioná una sala activa.';
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

    this.guardando = true;
    this.changeDetector.detectChanges();

    const datos = {
      movie_id: pelicula.id,
      room_id: this.nuevaFuncion.room_id,
      start_time: inicio.toISOString(),
      end_time: fin.toISOString(),
      format: this.nuevaFuncion.format,
      language: this.nuevaFuncion.language,
      price: precio,
    };

    try {
      const resultado = this.editando && this.funcionEditandoId
        ? await supabase
            .from('screenings')
            .update(datos)
            .eq('id', this.funcionEditandoId)
            .select('id')
            .single()
        : await supabase
            .from('screenings')
            .insert(datos)
            .select('id')
            .single();

      if (resultado.error) throw resultado.error;

      this.mostrarFormulario = false;
      this.editando = false;
      this.funcionEditandoId = null;
      this.limpiarFormulario();

      this.mensaje = estabaEditando
        ? 'Función actualizada correctamente.'
        : 'Función creada correctamente.';

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