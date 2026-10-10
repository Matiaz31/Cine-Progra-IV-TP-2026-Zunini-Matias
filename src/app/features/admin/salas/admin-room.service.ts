import { Injectable } from '@angular/core';
import { supabase } from '../../../core/supabase';

@Injectable({
  providedIn: 'root',
})
export class AdminRoomService {
  async getRooms() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error al obtener las salas:', error);
      throw error;
    }

    return data ?? [];
  }
}