import { Injectable } from '@angular/core';
import { supabase } from '../../core/supabase';
import { Movie } from './movie';

@Injectable({
  providedIn: 'root',
})
export class MovieService {
  private readonly cacheKey = 'cine-public-movies-cache';

  private getCachedMovies(): Movie[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const cached = localStorage.getItem(this.cacheKey);
      const movies = cached ? JSON.parse(cached) : [];
      return Array.isArray(movies) ? movies : [];
    } catch {
      return [];
    }
  }

  private saveCachedMovies(movies: Movie[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(movies));
    } catch (error) {
      console.warn('No se pudo guardar la cartelera para uso sin conexión:', error);
    }
  }

  async getMovies(): Promise<Movie[]> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return this.getCachedMovies();
    }

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
      return this.getCachedMovies();
    }

    const movies = data ?? [];
    this.saveCachedMovies(movies);
    return movies;
  }

  async getMovieById(id: string): Promise<Movie | null> {
    const cachedMovie = this.getCachedMovies().find((movie) => movie.id === id);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return cachedMovie ?? null;
    }

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
      return cachedMovie ?? null;
    }

    const movies = this.getCachedMovies();
    const updatedMovies = [
      ...movies.filter((movie) => movie.id !== data.id),
      data,
    ];
    this.saveCachedMovies(updatedMovies);

    return data;
  }
}
