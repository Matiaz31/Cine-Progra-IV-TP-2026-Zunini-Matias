import { Injectable } from '@angular/core';

import { supabase } from '../../../core/supabase';

import { Movie } from '../../movies/movie';

@Injectable({
  providedIn: 'root',
})
export class AdminMovieService {

  /* =========================
     OBTENER PELÍCULAS
     ========================= */

  async getMovies(): Promise<Movie[]> {

    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('release_date', {
        ascending: false,
      });

    if (error) {

      console.error(
        'ERROR SUPABASE - obtener películas:',
        error
      );

      throw error;
    }

    console.log(
      'PELÍCULAS ADMIN:',
      data
    );

    return data ?? [];
  }

  /* =========================
     CREAR PELÍCULA
     ========================= */

  async createMovie(movie: {
    title: string;
    synopsis: string | null;
    duration_minutes: number;
    poster_url: string | null;
    release_date: string | null;
    age_rating: number | null;
    pre_sale_enabled: boolean;
    pre_sale_price: number | null;
  }): Promise<Movie | null> {

    const { data, error } = await supabase
      .from('movies')
      .insert(movie)
      .select()
      .single();

    if (error) {

      console.error(
        'Error al crear película:',
        error
      );

      return null;
    }

    return data;
  }

  /* =========================
     ACTUALIZAR PELÍCULA
     ========================= */

  async updateMovie(
    id: string,
    movie: Partial<{
      title: string;
      synopsis: string | null;
      duration_minutes: number;
      poster_url: string | null;
      release_date: string | null;
      age_rating: number | null;
      is_active: boolean;
      pre_sale_enabled: boolean;
      pre_sale_price: number | null;
    }>
  ): Promise<Movie | null> {

    const { data, error } = await supabase
      .from('movies')
      .update(movie)
      .eq('id', id)
      .select()
      .single();

    if (error) {

      console.error(
        'Error al actualizar película:',
        error
      );

      return null;
    }

    return data;
  }

  /* =========================
     DESACTIVAR PELÍCULA
     ========================= */

  async deleteMovie(
    id: string
  ): Promise<boolean> {

    const { error } = await supabase
      .from('movies')
      .update({
        is_active: false,
      })
      .eq('id', id);

    if (error) {

      console.error(
        'Error al desactivar película:',
        error
      );

      return false;
    }

    return true;
  }

  /* =========================
     ELIMINAR DEFINITIVAMENTE
     ========================= */

  async permanentlyDeleteMovie(
    id: string
  ): Promise<boolean> {

    const { error } = await supabase
      .from('movies')
      .delete()
      .eq('id', id);

    if (error) {

      console.error(
        'Error al eliminar película:',
        error
      );

      return false;
    }

    return true;
  }
}