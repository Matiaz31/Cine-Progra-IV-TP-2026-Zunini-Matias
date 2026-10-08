import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { supabase } from '../../../core/supabase';
import { Seat } from '../seat';

@Component({
  selector: 'app-seat-selection',
  imports: [],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelection implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  screeningId = '';

  seats: Seat[] = [];
  occupiedSeatIds = new Set<string>();
  selectedSeats: Seat[] = [];

  screeningPrice = 0;

  readonly rows = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
  ];

  loading = true;
  error = '';

  async ngOnInit() {
    console.log('SEAT SELECTION: iniciando');

    this.screeningId =
      this.route.snapshot.paramMap.get('id') ?? '';

    console.log(
      'SEAT SELECTION: screeningId:',
      this.screeningId
    );

    if (!this.screeningId) {
      this.error =
        'No se encontró la función seleccionada.';

      this.loading = false;
      this.cdr.detectChanges();

      return;
    }

    await this.loadSeats();
  }

  async loadSeats() {
    this.loading = true;
    this.error = '';

    try {
      console.log(
        'SEAT SELECTION: buscando función...'
      );

      const {
        data: screening,
        error: screeningError,
      } = await supabase
        .from('screenings')
        .select('id, room_id, price')
        .eq('id', this.screeningId)
        .single();

      if (screeningError) {
        console.error(
          'Error buscando función:',
          screeningError
        );

        throw screeningError;
      }

      if (!screening) {
        throw new Error(
          'No se encontró la función.'
        );
      }

      console.log(
        'SEAT SELECTION: función encontrada:',
        screening
      );

      this.screeningPrice =
        Number(screening.price);

      console.log(
        'SEAT SELECTION: precio:',
        this.screeningPrice
      );

      console.log(
        'SEAT SELECTION: buscando butacas...'
      );

      const {
        data: seats,
        error: seatsError,
      } = await supabase
        .from('seats')
        .select('*')
        .eq('room_id', screening.room_id)
        .eq('is_active', true)
        .order('row_label')
        .order('seat_number');

      if (seatsError) {
        console.error(
          'Error buscando butacas:',
          seatsError
        );

        throw seatsError;
      }

      this.seats = seats ?? [];

      console.log(
        'SEAT SELECTION: butacas encontradas:',
        this.seats.length
      );

      console.log(
        'SEAT SELECTION: buscando butacas ocupadas...'
      );

      const {
        data: occupiedSeats,
        error: occupiedError,
      } = await supabase
        .from('ticket_seats')
        .select(`
          seat_id,
          tickets!inner (
            status
          )
        `)
        .eq('screening_id', this.screeningId)
        .neq('tickets.status', 'cancelled');

      if (occupiedError) {
        console.error(
          'Error buscando butacas ocupadas:',
          occupiedError
        );

        throw occupiedError;
      }

      this.occupiedSeatIds = new Set(
        (occupiedSeats ?? []).map(
          (seat) => seat.seat_id
        )
      );

      console.log(
        'SEAT SELECTION: butacas ocupadas:',
        this.occupiedSeatIds.size
      );

      console.log(
        'SEAT SELECTION: carga terminada'
      );
    } catch (error: any) {
      console.error(
        'SEAT SELECTION: ERROR GENERAL:',
        error
      );

      this.error =
        error?.message ??
        'No se pudieron cargar las butacas.';
    } finally {
      this.loading = false;

      console.log(
        'SEAT SELECTION: loading =',
        this.loading
      );

      this.cdr.detectChanges();
    }
  }

  getSeatsForRow(row: string): Seat[] {
    return this.seats.filter(
      (seat) => seat.row_label === row
    );
  }

  getBlockSeats(
    row: string,
    start: number,
    end: number
  ): Seat[] {
    return this.getSeatsForRow(row).filter(
      (seat) =>
        seat.seat_number >= start &&
        seat.seat_number <= end
    );
  }

  isSpecialRow(row: string): boolean {
    return row === 'J' || row === 'K';
  }

  isVipRow(row: string): boolean {
    return (
      row === 'R' ||
      row === 'S' ||
      row === 'T'
    );
  }

  toggleSeat(seat: Seat) {
    if (this.isOccupied(seat)) {
      return;
    }

    const index =
      this.selectedSeats.findIndex(
        (selected) => selected.id === seat.id
      );

    if (index >= 0) {
      this.selectedSeats.splice(index, 1);
    } else {
      this.selectedSeats.push(seat);
    }
  }

  isSelected(seat: Seat): boolean {
    return this.selectedSeats.some(
      (selected) => selected.id === seat.id
    );
  }

  isOccupied(seat: Seat): boolean {
    return this.occupiedSeatIds.has(seat.id);
  }

  getSeatPrice(seat: Seat): number {
    const modifier =
      Number(seat.price_modifier ?? 0);

    const price =
      Math.round(
        this.screeningPrice * (1 + modifier)
      );

    return price;
  }

  getSeatPriceLabel(seatType: string): string {
    let price = this.screeningPrice;

    if (seatType === 'vip') {
      price = Math.round(
        this.screeningPrice * 1.20
      );
    }

    return price.toLocaleString('es-AR');
  }

  getTotal(): number {
    return this.selectedSeats.reduce(
      (total, seat) =>
        total + this.getSeatPrice(seat),
      0
    );
  }

  getSelectedNormalCount(): number {
    return this.selectedSeats.filter(
      (seat) => seat.seat_type === 'normal'
    ).length;
  }

  getSelectedAccessibleCount(): number {
    return this.selectedSeats.filter(
      (seat) => seat.seat_type === 'accessible'
    ).length;
  }

  getSelectedVipCount(): number {
    return this.selectedSeats.filter(
      (seat) => seat.seat_type === 'vip'
    ).length;
  }

  mostrarCandyBar = false;

  continuar() {
    if (this.selectedSeats.length === 0) {
      return;
    }

    this.mostrarCandyBar = true;
    this.cdr.detectChanges();
  }

  irAlCandyBar() {
    this.guardarSeleccion();
    this.router.navigate(['/candy-bar']);
  }

  continuarSinCandyBar() {
    this.guardarSeleccion();
    this.router.navigate(['/resumen-compra']);
  }

  private guardarSeleccion() {
    const seatIds = this.selectedSeats.map(
      (seat) => seat.id
    );

    sessionStorage.setItem(
      'purchase-selection',
      JSON.stringify({
        screeningId: this.screeningId,
        seatIds,
      })
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

  volver() {
    this.router.navigate(['/home']);
  }
}