
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { supabase } from '../../../core/supabase';

interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  usuario?: string;
}

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './logs.html',
  styleUrl: './logs.scss',
})
export class Logs implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  registros: ActivityLog[] = [];
  cargando = false;
  error = '';

  async ngOnInit(): Promise<void> {
    await this.cargarLogs();
  }

  async cargarLogs(): Promise<void> {
    this.cargando = true;
    this.error = '';

    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const logs = (data ?? []) as ActivityLog[];
      const userIds = [
        ...new Set(
          logs
            .map(log => log.user_id)
            .filter((id): id is string => !!id)
        ),
      ];

      let perfiles: Profile[] = [];

      if (userIds.length > 0) {
        const { data: perfilesData, error: perfilesError } =
          await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .in('id', userIds);

        if (perfilesError) throw perfilesError;

        perfiles = (perfilesData ?? []) as Profile[];
      }

      this.registros = logs.map(log => {
        const perfil = perfiles.find(p => p.id === log.user_id);
        const nombre = [perfil?.first_name, perfil?.last_name]
          .filter(Boolean)
          .join(' ');

        return {
          ...log,
          usuario: nombre || perfil?.email || log.user_id || 'Sin usuario',
        };
      });
    } catch (err: any) {
      console.error('Error al cargar logs:', err);
      this.error =
        'No se pudieron cargar los registros: ' +
        (err?.message ?? 'Error desconocido');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  nombreAccion(action: string): string {
    const acciones: Record<string, string> = {
      create: 'Creación',
      update: 'Modificación',
      delete: 'Eliminación',
      activate: 'Activación',
      deactivate: 'Desactivación',
      validate_qr: 'Validación de QR',
      redeem_candy_bar: 'Canje de Candy Bar',
    };

    return acciones[action] ?? action;
  }

  nombreEntidad(entity: string | null): string {
    if (!entity) return 'General';

    const entidades: Record<string, string> = {
      reward: 'Recompensa',
      ticket: 'Entrada',
      movie: 'Película',
      product: 'Producto',
      combo: 'Combo',
      coupon: 'Cupón',
      screening: 'Función',
      room: 'Sala',
      seat: 'Butaca',
      order: 'Compra',
      profile: 'Perfil',
    };

    return entidades[entity] ?? entity;
  }

  
  contarUsuarios(): number {
    return new Set(
      this.registros
        .map(registro => registro.user_id)
        .filter((id): id is string => !!id)
    ).size;
  }

  nombreElemento(registro: ActivityLog): string {
    const detalles = registro.details;

    if (!detalles) return '';

    const nombre = detalles['name'];

    if (typeof nombre === 'string' && nombre.trim()) {
      return nombre;
    }

    const titulo = detalles['title'];

    if (typeof titulo === 'string' && titulo.trim()) {
      return titulo;
    }

    return '';
  }

  descripcionAccion(registro: ActivityLog): string {
    const nombre = this.nombreElemento(registro);
    const elemento = this.nombreEntidad(registro.entity_type).toLowerCase();

    const descripciones: Record<string, string> = {
      create: `Se creó ${elemento}`,
      update: `Se modificó ${elemento}`,
      delete: `Se eliminó ${elemento}`,
      activate: `Se activó ${elemento}`,
      deactivate: `Se desactivó ${elemento}`,
      validate_qr: 'Se validó un código QR',
      redeem_candy_bar: 'Se realizó un canje de Candy Bar',
    };

    const descripcion = descripciones[registro.action]
      ?? `Actividad: ${registro.action}`;

    return nombre ? `${descripcion}: ${nombre}` : descripcion;
  }

  iconoAccion(action: string): string {
    const iconos: Record<string, string> = {
      create: '➕',
      update: '✏️',
      delete: '🗑️',
      activate: '✅',
      deactivate: '⏸️',
      validate_qr: '🎟️',
      redeem_candy_bar: '🍿',
    };

    return iconos[action] ?? '📌';
  }

  claseAccion(action: string): string {
    const clases: Record<string, string> = {
      create: 'action-create',
      update: 'action-update',
      delete: 'action-delete',
      activate: 'action-activate',
      deactivate: 'action-deactivate',
      validate_qr: 'action-validate',
      redeem_candy_bar: 'action-redeem',
    };

    return clases[action] ?? 'action-default';
  }

  tieneDetalles(registro: ActivityLog): boolean {
    return !!(
      registro.entity_id ||
      (registro.details && Object.keys(registro.details).length > 0)
    );
  }

  detallesLegibles(
    registro: ActivityLog
  ): { label: string; value: string }[] {
    const detalles = registro.details;

    if (!detalles) return [];

    const etiquetas: Record<string, string> = {
      name: 'Nombre',
      title: 'Título',
      points_cost: 'Costo en puntos',
      product_id: 'Producto asociado',
      seat_type: 'Tipo de butaca',
      previous_status: 'Estado anterior',
      new_status: 'Estado actual',
      is_active: 'Activo',
      price: 'Precio',
      quantity: 'Cantidad',
      stock: 'Stock',
      payment_method: 'Método de pago',
    };

    return Object.entries(detalles)
      .filter(([clave, valor]) =>
        etiquetas[clave] &&
        valor !== null &&
        valor !== undefined &&
        clave !== 'product_id'
      )
      .map(([clave, valor]) => ({
        label: etiquetas[clave],
        value: this.formatearDetalle(clave, valor),
      }));
  }

  private formatearDetalle(clave: string, valor: unknown): string {
    if (clave === 'previous_status' || clave === 'new_status' || clave === 'is_active') {
      return valor === true ? 'Activo' : valor === false ? 'Inactivo' : String(valor);
    }

    if (clave === 'seat_type') {
      return valor === 'normal' ? 'Normal' : String(valor);
    }

    if (clave === 'points_cost') {
      return `${valor} puntos`;
    }

    return typeof valor === 'object'
      ? JSON.stringify(valor)
      : String(valor);
  }

}
