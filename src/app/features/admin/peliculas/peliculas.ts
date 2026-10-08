import {
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';

import { AdminMovieService } from './admin-movie.service';
import { Movie } from '../../movies/movie';

@Component({
  selector: 'app-peliculas',
  imports: [],
  templateUrl: './peliculas.html',
  styleUrl: './peliculas.scss',
})
export class Peliculas {

  private movieService = inject(AdminMovieService);
  private changeDetector = inject(ChangeDetectorRef);

  movies: Movie[] = [];
  loading = true;
  error = '';

  async ngOnInit() {
    await this.cargarPeliculas();
  }

  async cargarPeliculas() {
    this.loading = true;
    this.error = '';

    try {
      const movies = await this.movieService.getMovies();

      this.movies = movies;

      console.log('PELÍCULAS EN COMPONENTE:', this.movies);

    } catch (error) {
      console.error('ERROR EN COMPONENTE PELÍCULAS:', error);

      this.error = 'No se pudieron cargar las películas.';
      this.movies = [];

    } finally {
      this.loading = false;

      this.changeDetector.detectChanges();
    }
  }
}