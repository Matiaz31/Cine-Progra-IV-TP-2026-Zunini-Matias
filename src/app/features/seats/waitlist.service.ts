import { Injectable } from '@angular/core';
import { supabase } from '../../core/supabase';

export interface WaitlistEntry {
  waitlist_id: string;
  screening_id: string;
  movie_title: string;
  screening_start: string;
  status: 'waiting' | 'offered' | 'accepted' | 'expired' | 'cancelled';
  joined_at: string;
  waitlist_position: number | null;
  offered_seat_ids: string[] | null;
  offer_expires_at: string | null;
}

@Injectable({ providedIn: 'root' })
export class WaitlistService {
  async getMine(): Promise<WaitlistEntry[]> {
    const { data, error } = await supabase.rpc('get_my_waitlist_entries');
    if (error) throw error;
    return (data ?? []) as WaitlistEntry[];
  }

  async join(screeningId: string): Promise<{ waitlist_id: string; waitlist_position: number; joined_at: string }> {
    const { data, error } = await supabase.rpc('join_screening_waitlist', {
      p_screening_id: screeningId,
    });
    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
    if (!result) throw new Error('No se pudo registrar tu inscripción.');
    return result;
  }

  async leave(waitlistId: string): Promise<void> {
    const { error } = await supabase.rpc('leave_screening_waitlist', {
      p_waitlist_id: waitlistId,
    });
    if (error) throw error;
  }
}
