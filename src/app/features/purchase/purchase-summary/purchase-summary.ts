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
  purchasing = false;

  error = '';
  success = '';

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

  async confirmarCompra() {
    if (this.purchasing) {
      return;
    }

    this.purchasing = true;
    this.error = '';
    this.success = '';

    try {
      console.log('CONFIRMAR COMPRA');
      console.log('Screening:', this.screeningId);
      console.log('Butacas:', this.selectedSeats);
      console.log('Total:', this.getTotal());

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.warn(
          'No se pudo obtener el usuario autenticado:',
          userError
        );
      }

      const userId = user?.id ?? null;

      console.log(
        'Tipo de compra:',
        userId ? 'Usuario registrado' : 'Compra anónima'
      );

      // 1. Crear orden
      const { data: order, error: orderError } =
        await supabase.rpc('create_order', {
          p_user_id: userId,
          p_total: this.getTotal(),
          p_discount: 0,
          p_payment_method: 'test',
        });

      if (orderError) {
        throw orderError;
      }

      if (!order) {
        throw new Error('No se pudo crear la orden.');
      }

      console.log('Orden creada:', order);

      // 2. Crear los items de la orden
      for (const seat of this.selectedSeats) {
        const seatPrice = this.getSeatPrice(seat);

        const { error: itemError } =
          await supabase.rpc('add_order_item', {
            p_order_id: order.id,
            p_item_type: 'ticket',
            p_product_id: null,
            p_quantity: 1,
            p_unit_price: seatPrice,
          });

        if (itemError) {
          throw itemError;
        }
      }

      console.log('Order items creados.');

      // 3. Crear ticket
      const qrCode =
        `TICKET-${crypto.randomUUID()}`;

      const { data: ticket, error: ticketError } =
        await supabase.rpc('create_ticket', {
          p_order_id: order.id,
          p_screening_id: this.screeningId,
          p_qr_code: qrCode,
        });

      if (ticketError) {
        throw ticketError;
      }

      if (!ticket) {
        throw new Error('No se pudo crear el ticket.');
      }

      console.log('Ticket creado:', ticket);

      // 4. Asociar butacas
      for (const seat of this.selectedSeats) {
        const { error: seatError } =
          await supabase.rpc('add_ticket_seat', {
            p_ticket_id: ticket.id,
            p_seat_id: seat.id,
          });

        if (seatError) {
          throw seatError;
        }
      }

      console.log('Butacas asociadas al ticket.');

      // 5. Preparar información para el comprobante
      const purchaseData = {
        orderId: order.id,
        ticketId: ticket.id,
        qrCode: qrCode,

        movieTitle: this.movieTitle,

        screeningDate: this.startTime,

        screeningTime: new Date(
          this.startTime
        ).toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
        }),

        seats: this.selectedSeats.map((seat) => ({
          id: seat.id,
          row_label: seat.row_label,
          seat_number: seat.seat_number,
          seat_type: seat.seat_type,
          price: this.getSeatPrice(seat),
        })),

        total: this.getTotal(),
      };

      console.log(
        'Datos del comprobante:',
        purchaseData
      );

      // Guardamos los datos por si el usuario recarga la página
      sessionStorage.setItem(
        'purchase-success',
        JSON.stringify(purchaseData)
      );

      // 6. Ir a la pantalla de compra exitosa
      this.router.navigate(
        ['/compra-exitosa'],
        {
          state: {
            purchase: purchaseData,
          },
        }
      );

    } catch (error: any) {

      console.error(
        'ERROR EN LA COMPRA:',
        error
      );

      this.error =
        error?.message ??
        'No se pudo completar la compra.';

    } finally {

      this.purchasing = false;
      this.cdr.detectChanges();

    }
  }
}