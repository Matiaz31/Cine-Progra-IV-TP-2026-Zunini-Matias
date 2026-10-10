
import { Injectable, inject } from '@angular/core';
import { supabase } from './supabase';

export interface ActivityLogInput {
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  details?: Record<string, unknown> | null;
}

@Injectable({
  providedIn: 'root',
})
export class ActivityLogService {
  private supabase = supabase;

  async registrar(input: ActivityLogInput): Promise<void> {
    try {
      const { data, error: userError } =
        await this.supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const userId = data.user?.id;

      // Sin sesión no registramos una acción atribuida a un usuario.
      if (!userId) return;

      const { error } = await this.supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          action: input.action,
          entity_type: input.entity_type ?? null,
          entity_id: input.entity_id ?? null,
          details: input.details ?? null,
        });

      if (error) {
        console.error('No se pudo registrar la actividad:', error);
      }
    } catch (error) {
      // Un fallo de auditoría no debe interrumpir la operación principal.
      console.error('Error al registrar actividad:', error);
    }
  }
}
