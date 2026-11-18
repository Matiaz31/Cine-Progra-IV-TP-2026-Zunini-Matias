import { Injectable } from '@angular/core';
import { supabase } from './supabase';

export type AdminPermissionAction = 'view' | 'create' | 'update' | 'delete';

export interface AdminPermissionSet {
  view: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AdminPermissionsService {
  async obtenerPermisos(section: string): Promise<AdminPermissionSet> {
    const actions: AdminPermissionAction[] = [
      'view',
      'create',
      'update',
      'delete',
    ];

    const permisos: AdminPermissionSet = {
      view: false,
      create: false,
      update: false,
      delete: false,
    };

    try {
      const results = await Promise.all(
        actions.map(async (action) => {
          const { data, error } = await supabase.rpc(
            'has_admin_permission',
            {
              p_section: section,
              p_action: action,
            },
          );

          if (error) {
            console.error(
              `Error al verificar el permiso ${section}.${action}:`,
              error,
            );
            return [action, false] as const;
          }

          return [action, data === true] as const;
        }),
      );

      for (const [action, allowed] of results) {
        permisos[action] = allowed;
      }
    } catch (error) {
      console.error(
        `No se pudieron cargar los permisos de la sección ${section}:`,
        error,
      );
    }

    return permisos;
  }
}
