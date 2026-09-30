import { Injectable } from '@angular/core';
import { supabase } from '../../core/supabase';
import { Movie } from './movie';

@Injectable({
  providedIn: 'root',
})
export class MovieService {
  async getMovies(): Promise<Movie[]> {
    const { data, error } = await supabase
      .from('movies')
      .select(`
        *,
        movie_genres (
          genres (
            id,
            name
          )
        )
      `)
      .eq('is_active', true)
      .order('release_date', { ascending: false });

    if (error) {
      console.error('Error al obtener películas:', error);
      return [];
    }
    return data ?? [];
  }

  async getMovieById(id: string): Promise<Movie | null> {
    const { data, error } = await supabase
        .from('movies')
        .select(`
        *,
        movie_genres (
            genres (
            id,
            name
            )
        )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

    if (error) {
        console.error('Error al obtener la película:', error);
        return null;
    }

    return data;
    }
}