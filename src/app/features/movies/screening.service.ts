import { Injectable } from '@angular/core';
import { supabase } from '../../core/supabase';
import { Screening } from './screening';

@Injectable({
  providedIn: 'root',
})
export class ScreeningService {
  async getScreeningsByMovieId(movieId: string): Promise<Screening[]> {
    const { data, error } = await supabase
      .from('screenings')
      .select('*')
      .eq('movie_id', movieId)
      .eq('status', 'scheduled')
      .gt('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error al obtener funciones:', error);
      return [];
    }

    return data ?? [];
  }
}
