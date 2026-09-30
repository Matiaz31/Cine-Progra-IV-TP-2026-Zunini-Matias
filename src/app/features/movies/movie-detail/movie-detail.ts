import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MovieService } from '../movie.service';
import { Movie } from '../movie';

@Component({
  selector: 'app-movie-detail',
  imports: [],
  templateUrl: './movie-detail.html',
  styleUrl: './movie-detail.scss',
})
export class MovieDetail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private movieService = inject(MovieService);
  private cdr = inject(ChangeDetectorRef);

  movie: Movie | null = null;
  loading = true;
  error = '';

  async ngOnInit() {
    const movieId = this.route.snapshot.paramMap.get('id');

    if (!movieId) {
      this.error = 'No se indicó una película.';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    const movie = await this.movieService.getMovieById(movieId);

    if (!movie) {
      this.error = 'No se encontró la película.';
    } else {
      this.movie = movie;
    }

    this.loading = false;
    this.cdr.detectChanges();
  }

  volver() {
    this.router.navigate(['/home']);
  }
}