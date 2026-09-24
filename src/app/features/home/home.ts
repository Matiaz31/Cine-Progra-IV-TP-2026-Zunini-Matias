import { Component, inject } from '@angular/core';
import { Header } from '../../shared/header/header';
import { MovieService, Movie } from '../movies/movie';

@Component({
  selector: 'app-home',
  imports: [Header],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private movieService = inject(MovieService);

  movies: Movie[] = [];
  loading = true;
  error = '';

  async ngOnInit() {
    console.log('HOME: iniciando consulta');

    const movies = await this.movieService.getMovies();

    console.log('HOME: películas recibidas', movies);

    this.movies = movies;
    this.loading = false;
}
}