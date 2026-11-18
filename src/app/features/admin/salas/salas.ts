import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { supabase } from '../../../core/supabase';
import { AdminPermissionSet, AdminPermissionsService } from '../../../core/admin-permissions.service';

interface Room {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

@Component({
  selector: 'app-salas',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './salas.html',
  styleUrl: './salas.scss',
})
export class Salas implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private permissionsService = inject(AdminPermissionsService);
  permisos: AdminPermissionSet = { view: false, create: false, update: false, delete: false };
  get puedeCrear(): boolean { return this.permisos.create; }
  get puedeModificar(): boolean { return this.permisos.update; }

  rooms: Room[] = [];

  loading = false;
  saving = false;
  error = '';
  success = '';

  mostrarFormulario = false;
  editando = false;
  salaEditandoId: string | null = null;
  nombreSala = '';
  estadoSala = true;

  async ngOnInit(): Promise<void> {
    this.permisos = await this.permissionsService.obtenerPermisos('rooms');
    if (!this.permisos.view) { this.error = 'No tenés permisos para consultar las salas.'; return; }
    await this.cargarSalas();
  }

  async cargarSalas(): Promise<void> {
    if (!this.permisos.view) return;
    this.loading = true;
    this.error = '';

    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, is_active, created_at')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      this.rooms = data ?? [];
    } catch (error) {
      console.error('Error al cargar salas:', error);
      this.error = 'No se pudieron cargar las salas.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  abrirFormulario(): void {
    if (!this.puedeCrear) return;
    this.editando = false;
    this.salaEditandoId = null;
    this.nombreSala = '';
    this.estadoSala = true;
    this.error = '';
    this.success = '';
    this.mostrarFormulario = true;
  }

  editarSala(room: Room): void {
    if (!this.puedeModificar) return;
    this.editando = true;
    this.salaEditandoId = room.id;
    this.nombreSala = room.name;
    this.estadoSala = room.is_active;
    this.error = '';
    this.success = '';
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    if (this.saving) {
      return;
    }

    this.mostrarFormulario = false;
    this.editando = false;
    this.salaEditandoId = null;
    this.nombreSala = '';
    this.estadoSala = true;
    this.error = '';
  }

  async guardarSala(): Promise<void> {
    if (this.saving) {
      return;
    }

    if (this.editando ? !this.puedeModificar : !this.puedeCrear) { this.error = 'No tenés permisos para realizar esta operación.'; return; }
    const nombre = this.nombreSala.trim();

    this.error = '';
    this.success = '';

    if (!nombre) {
      this.error = 'El nombre de la sala es obligatorio.';
      return;
    }

    const duplicada = this.rooms.some(
      (room) =>
        room.name.trim().toLocaleLowerCase() ===
          nombre.toLocaleLowerCase() &&
        room.id !== this.salaEditandoId,
    );

    if (duplicada) {
      this.error = 'Ya existe una sala con ese nombre.';
      return;
    }

    this.saving = true;
    this.cdr.detectChanges();

    try {
      if (this.editando && this.salaEditandoId) {
        const { error } = await supabase
          .from('rooms')
          .update({
            name: nombre,
            is_active: this.estadoSala,
          })
          .eq('id', this.salaEditandoId);

        if (error) {
          throw error;
        }

        this.success = 'Sala actualizada correctamente.';
      } else {
        const { error } = await supabase.from('rooms').insert({
          name: nombre,
          is_active: this.estadoSala,
        });

        if (error) {
          throw error;
        }

        this.success = 'Sala creada correctamente.';
      }

      this.mostrarFormulario = false;
      this.editando = false;
      this.salaEditandoId = null;
      this.nombreSala = '';
      this.estadoSala = true;

      await this.cargarSalas();
    } catch (error) {
      console.error('Error al guardar sala:', error);
      this.error =
        'No se pudo guardar la sala. Revisá los permisos de Supabase.';
      this.success = '';
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  async cambiarEstadoSala(room: Room): Promise<void> {
    if (!this.puedeModificar) { this.error = 'No tenés permisos para modificar salas.'; return; }
    this.error = '';
    this.success = '';

    const nuevoEstado = !room.is_active;

    try {
      const { error } = await supabase
        .from('rooms')
        .update({ is_active: nuevoEstado })
        .eq('id', room.id);

      if (error) {
        throw error;
      }

      this.success = nuevoEstado
        ? 'Sala activada correctamente.'
        : 'Sala desactivada correctamente.';

      await this.cargarSalas();
    } catch (error) {
      console.error('Error al cambiar estado de sala:', error);
      this.error = 'No se pudo cambiar el estado de la sala.';
    } finally {
      this.cdr.detectChanges();
    }
  }
}