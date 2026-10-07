import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MovieService } from '../movie.service';
import { Movie } from '../movie';
import { ScreeningService } from '../screening.service';
import { Screening } from '../screening';

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
  private screeningService = inject(ScreeningService);
  private cdr = inject(ChangeDetectorRef);

  movie: Movie | null = null;
  screenings: Screening[] = [];

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
    const screenings =
      await this.screeningService.getScreeningsByMovieId(movieId);

    if (!movie) {
      this.error = 'No se encontró la película.';
    } else {
      this.movie = movie;
      this.screenings = screenings;
    }

    this.loading = false;
    this.cdr.detectChanges();
  }

  volver() {
    this.router.navigate(['/home']);
  }

  seleccionarFuncion(screeningId: string) {
    this.router.navigate(['/seleccion-butacas', screeningId]);
  }
}