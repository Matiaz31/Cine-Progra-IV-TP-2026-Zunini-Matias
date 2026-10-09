import { Injectable } from '@angular/core';
import { supabase } from '../../../core/supabase';

export interface Genre {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminGenreService {
  async getGenres(): Promise<Genre[]> {
    const { data, error } = await supabase
      .from('genres')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error al obtener los géneros:', error);
      throw error;
    }

    return data ?? [];
  }

  async createGenre(name: string): Promise<Genre> {
    const { data, error } = await supabase
      .from('genres')
      .insert({ name })
      .select('id, name')
      .single();

    if (error) {
      console.error('Error al crear el género:', error);
      throw error;
    }

    return data;
  }

  async updateGenre(id: string, name: string): Promise<Genre> {
    const { data, error } = await supabase
      .from('genres')
      .update({ name })
      .eq('id', id)
      .select('id, name')
      .single();

    if (error) {
      console.error('Error al actualizar el género:', error);
      throw error;
    }

    return data;
  }

  async deleteGenre(id: string): Promise<void> {
    const { error } = await supabase
      .from('genres')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar el género:', error);
      throw error;
    }
  }
}