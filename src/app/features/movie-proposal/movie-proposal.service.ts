
import { Injectable } from '@angular/core';
import { supabase } from '../../core/supabase';

export type MovieProposalStatus =
  | 'pending'
  | 'accepted'
  | 'rejected';

export interface MovieProposal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  reason: string;
  status: MovieProposalStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comment: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class MovieProposalService {
  async getCurrentUserId(): Promise<string> {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    if (!user) {
      throw new Error(
        'Tenés que iniciar sesión para realizar esta acción.'
      );
    }

    return user.id;
  }

  async getMyProposals(): Promise<MovieProposal[]> {
    const userId = await this.getCurrentUserId();

    const { data, error } = await supabase
      .from('movie_proposals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(
        'Error al obtener mis propuestas:',
        error
      );
      throw error;
    }

    return data ?? [];
  }

  async createProposal(proposal: {
    title: string;
    description: string;
    reason: string;
  }): Promise<MovieProposal> {
    const userId = await this.getCurrentUserId();

    const { data, error } = await supabase
      .from('movie_proposals')
      .insert({
        user_id: userId,
        title: proposal.title.trim(),
        description: proposal.description.trim(),
        reason: proposal.reason.trim(),
      })
      .select('*')
      .single();

    if (error) {
      console.error(
        'Error al crear propuesta:',
        error
      );
      throw error;
    }

    return data;
  }

  async getPendingProposals(): Promise<MovieProposal[]> {
    const { error: authError } =
      await supabase.auth.getUser();

    if (authError) {
      throw authError;
    }

    const { data, error } = await supabase
      .from('movie_proposals')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error(
        'Error al obtener propuestas pendientes:',
        error
      );
      throw error;
    }

    return data ?? [];
  }

  async reviewProposal(
    id: string,
    status: 'accepted' | 'rejected',
    comment: string | null = null
  ): Promise<MovieProposal> {
    const reviewerId = await this.getCurrentUserId();

    const { data, error } = await supabase
      .from('movie_proposals')
      .update({
        status,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        review_comment: comment?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'pending')
      .select('*')
      .single();

    if (error) {
      console.error(
        'Error al revisar propuesta:',
        error
      );
      throw error;
    }

    return data;
  }
}
