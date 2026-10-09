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

  loading = true;
  error = '';
  selectionError = '';

  mostrarCandyBar = false;

  readonly rows = [
    'A', 'B', 'C', 'D', 'E',
    'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O',
    'P', 'Q', 'R', 'S', 'T',
  ];

  async ngOnInit() {
    this.screeningId =
      this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.screeningId) {
      this.error = 'No se encontró la función seleccionada.';
      this.loading = false;
      return;
    }

    await this.loadSeats();
  }

  async loadSeats() {
    this.loading = true;
    this.error = '';

    try {
      const { data: screening, error: screeningError } =
        await supabase
          .from('screenings')
          .select('id, room_id, price')
          .eq('id', this.screeningId)
          .single();

      if (screeningError) throw screeningError;
      if (!screening) {
        throw new Error('No se encontró la función.');
      }

      this.screeningPrice = Number(screening.price);

      const { data: seats, error: seatsError } =
        await supabase
          .from('seats')
          .select('*')
          .eq('room_id', screening.room_id)
          .eq('is_active', true)
          .order('row_label')
          .order('seat_number');

      if (seatsError) throw seatsError;

      this.seats = seats ?? [];

      const { data: occupiedSeats, error: occupiedError } =
        await supabase
          .from('ticket_seats')
          .select(`
            seat_id,
            tickets!inner (
              status
            )
          `)
          .eq('screening_id', this.screeningId)
          .neq('tickets.status', 'cancelled');

      if (occupiedError) throw occupiedError;

      this.occupiedSeatIds = new Set(
        (occupiedSeats ?? []).map((seat) => seat.seat_id)
      );
    } catch (error: any) {
      console.error('Error cargando butacas:', error);
      this.error =
        error?.message ?? 'No se pudieron cargar las butacas.';
    } finally {
      this.loading = false;
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
    return ['R', 'S', 'T'].includes(row);
  }

  /**
   * Identifica el bloque físico de la butaca.
   * Los pasillos separan los bloques, aunque los números
   * de las butacas sean consecutivos.
   */
  private getSeatBlock(seat: Seat): string {
    const number = seat.seat_number;

    if (this.isSpecialRow(seat.row_label)) {
      if (number <= 2) return 'izquierdo';
      if (number <= 12) return 'central';
      return 'derecho';
    }

    if (number <= 4) return 'izquierdo';
    if (number <= 24) return 'central';
    return 'derecho';
  }

  /**
   * Una selección múltiple debe estar en una sola fila,
   * en un solo bloque y con números consecutivos.
   */
  validarButacasContiguas(): boolean {
    if (this.selectedSeats.length <= 1) {
      return true;
    }

    const firstSeat = this.selectedSeats[0];

    const mismaFila = this.selectedSeats.every(
      (seat) => seat.row_label === firstSeat.row_label
    );

    if (!mismaFila) {
      this.selectionError =
        'Elegí las butacas de una misma fila para continuar.';
      return false;
    }

    const mismoBloque = this.selectedSeats.every(
      (seat) =>
        this.getSeatBlock(seat) ===
        this.getSeatBlock(firstSeat)
    );

    if (!mismoBloque) {
      this.selectionError =
        'No podés seleccionar butacas que estén separadas por un pasillo.';
      return false;
    }

    const numeros = this.selectedSeats
      .map((seat) => seat.seat_number)
      .sort((a, b) => a - b);

    for (let i = 1; i < numeros.length; i++) {
      if (numeros[i] !== numeros[i - 1] + 1) {
        this.selectionError =
          'Las butacas deben ser consecutivas, sin espacios entre ellas.';
        return false;
      }
    }

    this.selectionError = '';
    return true;
  }

  toggleSeat(seat: Seat) {
    if (this.isOccupied(seat)) return;

    const index = this.selectedSeats.findIndex(
      (selected) => selected.id === seat.id
    );

    if (index >= 0) {
      this.selectedSeats.splice(index, 1);
    } else {
      this.selectedSeats.push(seat);
    }

    this.selectionError = '';
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
    const modifier = Number(seat.price_modifier ?? 0);

    return Math.round(
      this.screeningPrice * (1 + modifier)
    );
  }

  getSeatPriceLabel(seatType: string): string {
    let price = this.screeningPrice;

    if (seatType === 'vip') {
      price = Math.round(this.screeningPrice * 1.20);
    }

    return price.toLocaleString('es-AR');
  }

  getTotal(): number {
    return this.selectedSeats.reduce(
      (total, seat) => total + this.getSeatPrice(seat),
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

  continuar() {
    if (this.selectedSeats.length === 0) return;

    if (!this.validarButacasContiguas()) {
      this.cdr.detectChanges();
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
      default:
        return 'Normal';
    }
  }

  volver() {
    this.router.navigate(['/home']);
  }
}