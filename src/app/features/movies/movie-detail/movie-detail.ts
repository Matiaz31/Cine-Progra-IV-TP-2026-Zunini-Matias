import { ChangeDetectorRef, Component, HostListener, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MovieService } from '../movie.service';
import { Movie } from '../movie';
import { ScreeningService } from '../screening.service';
import { Screening } from '../screening';
import { supabase } from '../../../core/supabase';
import { DatePipe, DecimalPipe } from '@angular/common';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

@Component({
  selector: 'app-movie-detail',
  imports: [FormsModule, DatePipe, DecimalPipe],
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
  reviews: Review[] = [];

  currentUserId: string | null = null;
  myReviewId: string | null = null;

  selectedRating = 5;
  reviewComment = '';

  reviewLoading = false;
  reviewSaving = false;

  reviewMessage = '';
  reviewError = '';

  loading = true;
  error = '';
  isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;

  @HostListener('window:online')
  onOnline() {
    this.isOnline = true;
  }

  @HostListener('window:offline')
  onOffline() {
    this.isOnline = false;
  }

  get averageRating(): number {
    if (this.reviews.length === 0) {
      return 0;
    }

    const total = this.reviews.reduce(
      (sum, review) => sum + review.rating,
      0,
    );

    return total / this.reviews.length;
  }

  async ngOnInit() {
    const movieId = this.route.snapshot.paramMap.get('id');

    if (!movieId) {
      this.error = 'No se indicó una película.';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    // Primero mostramos la película desde la caché local, sin esperar
    // consultas secundarias que pueden quedar pendientes sin conexión.
    const movie = await this.movieService.getMovieById(movieId);

    if (!movie) {
      this.error = 'No se encontró la película.';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.movie = movie;
    this.loading = false;
    this.cdr.detectChanges();

    // La cartelera y el detalle son públicos y pueden consultarse offline.
    // Funciones, sesión y reseñas requieren conexión.
    if (!this.isOnline) {
      this.reviewLoading = false;
      return;
    }

    const [screenings, userResult] = await Promise.all([
      this.screeningService.getScreeningsByMovieId(movieId),
      supabase.auth.getUser(),
    ]);

    this.screenings = screenings;
    this.currentUserId = userResult.data.user?.id ?? null;

    await this.loadReviews(movieId);
    this.cdr.detectChanges();
  }

  private async loadReviews(movieId: string) {
    this.reviewLoading = true;
    this.reviewError = '';

    const { data, error } = await supabase
      .from('reviews')
      .select('id, user_id, rating, comment, created_at')
      .eq('movie_id', movieId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar reseñas:', error);
      this.reviewError = 'No se pudieron cargar las reseñas.';
    } else {
      this.reviews = (data ?? []) as Review[];

      const myReview = this.reviews.find(
        (review) => review.user_id === this.currentUserId,
      );

      if (myReview) {
        this.myReviewId = myReview.id;
        this.selectedRating = myReview.rating;
        this.reviewComment = myReview.comment ?? '';
      }
    }

    this.reviewLoading = false;
  }

  async saveReview() {
    this.reviewMessage = '';
    this.reviewError = '';

    if (this.reviewSaving) {
      return;
    }

    if (!this.currentUserId) {
      this.reviewError = 'Iniciá sesión para publicar una reseña.';
      return;
    }

    if (!this.movie) {
      return;
    }

    if (
      !Number.isInteger(this.selectedRating) ||
      this.selectedRating < 1 ||
      this.selectedRating > 5
    ) {
      this.reviewError = 'Elegí una calificación entre 1 y 5.';
      return;
    }

    this.reviewSaving = true;

    const values = {
      rating: this.selectedRating,
      comment: this.reviewComment.trim() || null,
    };

    const result = this.myReviewId
      ? await supabase
          .from('reviews')
          .update(values)
          .eq('id', this.myReviewId)
          .eq('user_id', this.currentUserId)
          .select('id, user_id, rating, comment, created_at')
          .single()
      : await supabase
          .from('reviews')
          .insert({
            ...values,
            user_id: this.currentUserId,
            movie_id: this.movie.id,
          })
          .select('id, user_id, rating, comment, created_at')
          .single();

    if (result.error) {
      console.error('Error al guardar reseña:', result.error);

      this.reviewError =
        'No se pudo guardar la reseña. Intentá nuevamente.';
    } else if (result.data) {
      const savedReview = result.data as Review;

      this.reviews = [
        savedReview,
        ...this.reviews.filter(
          (review) => review.id !== savedReview.id,
        ),
      ].sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime(),
      );

      this.myReviewId = savedReview.id;
      this.reviewMessage = 'Tu reseña se guardó correctamente.';
    }

    this.reviewSaving = false;
    this.cdr.detectChanges();
  }

  volver() {
    this.router.navigate(['/home']);
  }

  seleccionarFuncion(screeningId: string) {
    this.router.navigate(['/seleccion-butacas', screeningId]);
  }
}