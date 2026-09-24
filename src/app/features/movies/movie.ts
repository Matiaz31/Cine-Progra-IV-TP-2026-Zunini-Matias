import { Injectable } from '@angular/core';
import { supabase } from '../../core/supabase';

export interface Movie {
  id: string;
  title: string;
  synopsis: string | null;
  duration_minutes: number;
  poster_url: string | null;
  release_date: string | null;
  age_rating: number | null;
  is_active: boolean;
  pre_sale_enabled: boolean;
  pre_sale_price: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class MovieService {
  async getMovies(): Promise<Movie[]> {
    const { data, error } = await supabase
      .from('movies')
      .select(`*,
        movie_genres (
            genres (
            id,
            name
            )
        )`)
      .eq('is_active', true)
      .order('release_date', { ascending: false });

    if (error) {
      console.error('Error al obtener películas:', error);
      return [];
    }

    return data ?? [];
  }
}