import { Injectable } from '@angular/core';
import { supabase } from '../../core/supabase';
import { Seat } from './seat';

@Injectable({
  providedIn: 'root',
})
export class SeatService {

  async getSeatsByRoomId(roomId: string): Promise<Seat[]> {
    const { data, error } = await supabase
      .from('seats')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_active', true)
      .order('row_label', { ascending: true })
      .order('seat_number', { ascending: true });

    if (error) {
      console.error('Error al obtener butacas:', error);
      return [];
    }

    return data ?? [];
  }
}