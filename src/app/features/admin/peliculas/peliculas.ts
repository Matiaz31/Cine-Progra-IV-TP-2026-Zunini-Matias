import { Component, inject } from '@angular/core';
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

  movies: Movie[] = [];
  loading = true;
  error = '';

  async ngOnInit() {
    await this.cargarPeliculas();
  }

  async cargarPeliculas() {
    this.loading = true;
    this.error = '';

    this.movies = await this.movieService.getMovies();

    this.loading = false;
  }
}