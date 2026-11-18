import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../../core/supabase';

type AdminAction = 'view' | 'create' | 'update' | 'delete';

interface AdminRole {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
}

interface RolePermission {
  admin_role_id: string;
  section: string;
  action: AdminAction;
}

interface ProfileOption {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'customer' | 'employee' | 'admin';
  admin_role_id: string | null;
}

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './roles.html',
  styleUrl: './roles.scss',
})
export class AdminRoles implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  readonly actions: { key: AdminAction; label: string }[] = [
    { key: 'view', label: 'Consultar' },
    { key: 'create', label: 'Crear' },
    { key: 'update', label: 'Modificar' },
    { key: 'delete', label: 'Eliminar' },
  ];

  readonly sections = [
    { key: 'movies', label: 'Películas' },
    { key: 'genres', label: 'Géneros' },
    { key: 'movie_proposals', label: 'Propuestas de películas' },
    { key: 'rooms', label: 'Salas' },
    { key: 'seats', label: 'Butacas' },
    { key: 'screenings', label: 'Funciones' },
    { key: 'products', label: 'Productos' },
    { key: 'product_categories', label: 'Categorías de productos' },
    { key: 'combos', label: 'Combos' },
    { key: 'coupons', label: 'Cupones' },
    { key: 'rewards', label: 'Recompensas' },
    { key: 'ticket_pricing', label: 'Precios de entradas' },
    { key: 'reports', label: 'Reportes' },
    { key: 'activity_logs', label: 'Historial de actividad' },
  ];

  roles: AdminRole[] = [];
  permisosRoles: RolePermission[] = [];
  usuarios: ProfileOption[] = [];

  rolEditandoId: string | null = null;
  nombreRol = '';
  descripcionRol = '';
  permisosSeleccionados: Record<string, Record<AdminAction, boolean>> = {};

  usuarioSeleccionadoId = '';
  rolSeleccionadoId = '';

  cargando = true;
  guardando = false;
  error = '';
  mensaje = '';

  async ngOnInit(): Promise<void> {
    await this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.cargando = true;
    this.error = '';

    try {
      const userResult = await supabase.auth.getUser();
      if (userResult.error || !userResult.data.user) {
        throw new Error('No se pudo validar la sesión del administrador.');
      }

      const [rolesResult, permissionsResult, usersResult] = await Promise.all([
        supabase.from('admin_roles').select('id, name, description, is_system').order('name'),
        supabase.from('admin_role_permissions').select('admin_role_id, section, action'),
        supabase
          .from('profiles')
          .select('id, email, first_name, last_name, role, admin_role_id')
          .neq('id', userResult.data.user.id)
          .order('first_name'),
      ]);

      if (rolesResult.error) throw rolesResult.error;
      if (permissionsResult.error) throw permissionsResult.error;
      if (usersResult.error) throw usersResult.error;

      this.roles = (rolesResult.data ?? []) as AdminRole[];
      this.permisosRoles = (permissionsResult.data ?? []) as RolePermission[];
      this.usuarios = (usersResult.data ?? []) as ProfileOption[];
    } catch (err: any) {
      console.error('Error al cargar la gestión de roles:', err);
      this.error = err?.message ?? 'No se pudieron cargar los roles y usuarios.';
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  nuevoRol(): void {
    this.rolEditandoId = null;
    this.nombreRol = '';
    this.descripcionRol = '';
    this.permisosSeleccionados = {};
    this.sections.forEach(section => {
      this.permisosSeleccionados[section.key] = {
        view: false,
        create: false,
        update: false,
        delete: false,
      };
    });
    this.error = '';
    this.mensaje = '';
  }

  editarRol(rol: AdminRole): void {
    if (rol.is_system) {
      this.error = 'Los roles del sistema no se pueden modificar.';
      return;
    }

    this.rolEditandoId = rol.id;
    this.nombreRol = rol.name;
    this.descripcionRol = rol.description ?? '';
    this.permisosSeleccionados = {};

    this.sections.forEach(section => {
      this.permisosSeleccionados[section.key] = {
        view: false,
        create: false,
        update: false,
        delete: false,
      };
    });

    this.permisosRoles
      .filter(permission => permission.admin_role_id === rol.id)
      .forEach(permission => {
        if (this.permisosSeleccionados[permission.section]) {
          this.permisosSeleccionados[permission.section][permission.action] = true;
        }
      });

    this.error = '';
    this.mensaje = '';
  }

  cancelarEdicion(): void {
    this.rolEditandoId = null;
    this.nombreRol = '';
    this.descripcionRol = '';
    this.permisosSeleccionados = {};
    this.error = '';
  }

  cambiarPermiso(section: string, action: AdminAction, checked: boolean): void {
    if (!this.permisosSeleccionados[section]) {
      this.permisosSeleccionados[section] = {
        view: false,
        create: false,
        update: false,
        delete: false,
      };
    }
    this.permisosSeleccionados[section][action] = checked;
  }

  tienePermiso(section: string, action: AdminAction): boolean {
    return this.permisosSeleccionados[section]?.[action] === true;
  }

  private obtenerPermisosSeleccionados(): { section: string; action: AdminAction }[] {
    const result: { section: string; action: AdminAction }[] = [];
    this.sections.forEach(section => {
      this.actions.forEach(action => {
        if (this.permisosSeleccionados[section.key]?.[action.key]) {
          result.push({ section: section.key, action: action.key });
        }
      });
    });
    return result;
  }

  async guardarRol(): Promise<void> {
    if (this.guardando) return;

    const name = this.nombreRol.trim();
    if (!name) {
      this.error = 'Ingresá un nombre para el rol.';
      return;
    }

    if (name.length > 60) {
      this.error = 'El nombre del rol no puede superar los 60 caracteres.';
      return;
    }

    const permissions = this.obtenerPermisosSeleccionados();
    const previousPermissions = this.rolEditandoId
      ? this.permisosRoles.filter(item => item.admin_role_id === this.rolEditandoId)
      : [];

    this.guardando = true;
    this.error = '';
    this.mensaje = '';
    this.cdr.detectChanges();

    try {
      if (!this.rolEditandoId) {
        const auth = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from('admin_roles')
          .insert({
            name,
            description: this.descripcionRol.trim() || null,
            created_by: auth.data.user?.id ?? null,
          })
          .select('id')
          .single();

        if (error) throw error;

        if (permissions.length) {
          const { error: permissionError } = await supabase
            .from('admin_role_permissions')
            .insert(permissions.map(permission => ({
              ...permission,
              admin_role_id: data.id,
            })));

          if (permissionError) {
            await supabase.from('admin_roles').delete().eq('id', data.id);
            throw permissionError;
          }
        }

        this.mensaje = 'Rol creado correctamente.';
      } else {
        const roleId = this.rolEditandoId;
        const { error: updateError } = await supabase
          .from('admin_roles')
          .update({
            name,
            description: this.descripcionRol.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', roleId);

        if (updateError) throw updateError;

        const { error: deleteError } = await supabase
          .from('admin_role_permissions')
          .delete()
          .eq('admin_role_id', roleId);

        if (deleteError) throw deleteError;

        if (permissions.length) {
          const { error: insertError } = await supabase
            .from('admin_role_permissions')
            .insert(permissions.map(permission => ({
              ...permission,
              admin_role_id: roleId,
            })));

          if (insertError) {
            if (previousPermissions.length) {
              await supabase.from('admin_role_permissions').insert(previousPermissions);
            }
            throw insertError;
          }
        }

        this.mensaje = 'Rol actualizado correctamente.';
      }

      this.rolEditandoId = null;
      this.nombreRol = '';
      this.descripcionRol = '';
      this.permisosSeleccionados = {};
      await this.cargarDatos();
    } catch (err: any) {
      console.error('Error al guardar el rol:', err);
      this.error = err?.message ?? 'No se pudo guardar el rol.';
    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  async eliminarRol(rol: AdminRole): Promise<void> {
    if (rol.is_system || this.guardando) return;

    const assigned = this.usuarios.some(user => user.admin_role_id === rol.id);
    if (assigned) {
      this.error = 'No se puede eliminar este rol porque está asignado a uno o más usuarios.';
      return;
    }

    if (!confirm('¿Seguro que querés eliminar el rol "' + rol.name + '"?')) return;

    this.guardando = true;
    this.error = '';
    this.mensaje = '';

    try {
      const { error: permissionsError } = await supabase
        .from('admin_role_permissions')
        .delete()
        .eq('admin_role_id', rol.id);
      if (permissionsError) throw permissionsError;

      const { error } = await supabase.from('admin_roles').delete().eq('id', rol.id);
      if (error) throw error;

      this.mensaje = 'Rol eliminado correctamente.';
      if (this.rolEditandoId === rol.id) this.cancelarEdicion();
      await this.cargarDatos();
    } catch (err: any) {
      console.error('Error al eliminar el rol:', err);
      this.error = err?.message ?? 'No se pudo eliminar el rol.';
    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  nombreUsuario(user: ProfileOption): string {
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    return fullName || user.email;
  }

  nombreRolAsignado(roleId: string | null): string {
    return this.roles.find(role => role.id === roleId)?.name ?? 'Sin rol personalizado';
  }

  async asignarRol(): Promise<void> {
    if (this.guardando) return;

    const user = this.usuarios.find(item => item.id === this.usuarioSeleccionadoId);
    const role = this.roles.find(item => item.id === this.rolSeleccionadoId);

    if (!user || !role) {
      this.error = 'Seleccioná un usuario y un rol.';
      return;
    }

    if (user.role === 'admin' && !user.admin_role_id) {
      this.error = 'No se puede modificar otro administrador principal.';
      return;
    }

    this.guardando = true;
    this.error = '';
    this.mensaje = '';

    try {
      const previousRole = user.role;

      if (user.role !== 'admin') {
        const { error: promoteError } = await supabase.rpc('set_admin_user_role', {
          p_user_id: user.id,
          p_new_role: 'admin',
        });
        if (promoteError) throw promoteError;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          admin_role_id: role.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        if (previousRole !== 'admin') {
          await supabase.rpc('set_admin_user_role', {
            p_user_id: user.id,
            p_new_role: previousRole,
          });
        }
        throw error;
      }

      this.mensaje = 'El rol "' + role.name + '" fue asignado a ' + this.nombreUsuario(user) + '.';
      this.usuarioSeleccionadoId = '';
      this.rolSeleccionadoId = '';
      await this.cargarDatos();
    } catch (err: any) {
      console.error('Error al asignar el rol:', err);
      this.error = err?.message ?? 'No se pudo asignar el rol al usuario.';
    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  puedeAsignar(user: ProfileOption): boolean {
    return user.role !== 'admin' || user.admin_role_id !== null;
  }
}
