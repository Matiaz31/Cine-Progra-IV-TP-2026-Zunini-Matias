import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { supabase } from '../../../core/supabase';
import { Seat } from '../../seats/seat';

@Component({
  selector: 'app-purchase-summary',
  imports: [],
  templateUrl: './purchase-summary.html',
  styleUrl: './purchase-summary.scss',
})
export class PurchaseSummary implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  screeningId = '';
  seatIds: string[] = [];

  movieTitle = '';
  startTime = '';
  format = '';
  language = '';
  screeningPrice = 0;

  selectedSeats: Seat[] = [];

  loading = true;
  error = '';

  async ngOnInit() {
    this.screeningId =
      this.route.snapshot.queryParamMap.get('screeningId') ?? '';

    const seatsParam =
      this.route.snapshot.queryParamMap.get('seats') ?? '';

    this.seatIds = seatsParam
      ? seatsParam.split(',').filter(Boolean)
      : [];

    if (!this.screeningId || this.seatIds.length === 0) {
      this.error = 'No se encontró la información de la compra.';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    await this.loadSummary();
  }

  async loadSummary() {
    this.loading = true;
    this.error = '';

    try {
      const { data: screening, error: screeningError } =
        await supabase
          .from('screenings')
          .select(`
            id,
            start_time,
            format,
            language,
            price,
            movies (
              id,
              title
            )
          `)
          .eq('id', this.screeningId)
          .single();

      if (screeningError) {
        throw screeningError;
      }

      if (!screening) {
        throw new Error('No se encontró la función.');
      }

      this.startTime = screening.start_time;
      this.format = screening.format;
      this.language = screening.language;
      this.screeningPrice = Number(screening.price);

      const movie = Array.isArray(screening.movies)
        ? screening.movies[0]
        : screening.movies;

      this.movieTitle = movie?.title ?? 'Película';

      const { data: seats, error: seatsError } =
        await supabase
          .from('seats')
          .select('*')
          .in('id', this.seatIds)
          .order('row_label')
          .order('seat_number');

      if (seatsError) {
        throw seatsError;
      }

      this.selectedSeats = seats ?? [];
    } catch (error: any) {
      this.error =
        error?.message ??
        'No se pudo cargar el resumen de compra.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  getSeatPrice(seat: Seat): number {
    const modifier = Number(seat.price_modifier ?? 0);

    return Math.round(
      this.screeningPrice * (1 + modifier)
    );
  }

  getTotal(): number {
    return this.selectedSeats.reduce(
      (total, seat) => total + this.getSeatPrice(seat),
      0
    );
  }

  getSeatTypeLabel(seat: Seat): string {
    switch (seat.seat_type) {
      case 'vip':
        return 'VIP';

      case 'accessible':
        return 'Accesible';

      case 'normal':
      default:
        return 'Normal';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('es-AR', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  }

  volver() {
    this.router.navigate([
      '/seleccion-butacas',
      this.screeningId,
    ]);
  }

  confirmarCompra() {
    console.log('CONFIRMAR COMPRA');
    console.log('Screening:', this.screeningId);
    console.log('Butacas:', this.selectedSeats);
    console.log('Total:', this.getTotal());

    // Próximo paso:
    // crear orden + ticket + ticket_seats.
  }
}