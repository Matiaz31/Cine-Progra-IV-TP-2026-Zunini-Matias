import { Component, inject } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Movie } from '../movies/movie';
import { MovieService } from '../movies/movie.service';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [Header],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private movieService = inject(MovieService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  movies: Movie[] = [];
  loading = true;
  error = '';

  async ngOnInit() {
    const movies = await this.movieService.getMovies();
    this.movies = movies;
    this.loading = false;
    this.cdr.detectChanges();
  }

  verPelicula(id: string) {
    this.router.navigate(['/pelicula', id]);
  }
}