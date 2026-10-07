import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { supabase } from '../../core/supabase';

interface TicketGroup {
  ticket_id: string;
  order_id: string;
  movie_title: string;
  start_time: string;
  format: string;
  language: string;
  qr_code: string;
  ticket_status: string;
  order_status: string;
  order_total: number;
  seats: {
    row_label: string;
    seat_number: number;
    seat_type: string;
    price: number;
  }[];
}

@Component({
  selector: 'app-mis-entradas',
  imports: [],
  templateUrl: './mis-entradas.html',
  styleUrl: './mis-entradas.scss',
})
export class MisEntradas implements OnInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  entries: TicketGroup[] = [];

  loading = true;
  error = '';

  async ngOnInit() {
    await this.loadEntries();
  }

  async loadEntries() {
    this.loading = true;
    this.error = '';

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        this.error =
          'Debés iniciar sesión para ver tus entradas.';
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total,
          status,
          created_at,

          tickets (
            id,
            screening_id,
            qr_code,
            status,
            created_at,

            ticket_seats (
              price,
              seat_id,

              seats (
                row_label,
                seat_number,
                seat_type
              )
            ),

            screenings (
              start_time,
              format,
              language,

              movies (
                id,
                title
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      this.entries = [];

      for (const order of data ?? []) {
        for (const ticket of order.tickets ?? []) {

          const screening = Array.isArray(ticket.screenings)
            ? ticket.screenings[0]
            : ticket.screenings;

          const movie = Array.isArray(screening?.movies)
            ? screening.movies[0]
            : screening?.movies;

          const seats =
            (ticket.ticket_seats ?? []).map((ticketSeat: any) => {

              const seat = Array.isArray(ticketSeat.seats)
                ? ticketSeat.seats[0]
                : ticketSeat.seats;

              return {
                row_label: seat?.row_label ?? '',
                seat_number: seat?.seat_number ?? 0,
                seat_type: seat?.seat_type ?? 'normal',
                price: Number(ticketSeat.price ?? 0),
              };
            });

          this.entries.push({
            ticket_id: ticket.id,
            order_id: order.id,

            movie_title:
              movie?.title ?? 'Película',

            start_time:
              screening?.start_time ?? '',

            format:
              screening?.format ?? '',

            language:
              screening?.language ?? '',

            qr_code:
              ticket.qr_code,

            ticket_status:
              ticket.status,

            order_status:
              order.status,

            order_total:
              Number(order.total ?? 0),

            seats,
          });
        }
      }

    } catch (error: any) {

      console.error(
        'ERROR CARGANDO ENTRADAS:',
        error
      );

      this.error =
        error?.message ??
        'No se pudieron cargar tus entradas.';

    } finally {

      this.loading = false;
      this.cdr.detectChanges();

    }
  }

  getSeatLabel(seat: TicketGroup['seats'][number]) {
    return `${seat.row_label}${seat.seat_number}`;
  }

  getSeatTypeLabel(type: string) {
    switch (type) {
      case 'vip':
        return 'VIP';

      case 'accessible':
        return 'Accesible';

      default:
        return 'Normal';
    }
  }

  getTicketStatusLabel(status: string) {
    switch (status) {
      case 'valid':
        return 'Válida';

      case 'used':
        return 'Usada';

      case 'cancelled':
        return 'Cancelada';

      default:
        return status;
    }
  }

  getTicketStatusClass(status: string) {
    switch (status) {
      case 'valid':
        return 'valid';

      case 'used':
        return 'used';

      case 'cancelled':
        return 'cancelled';

      default:
        return '';
    }
  }

  formatDate(date: string) {
    if (!date) {
      return '';
    }

    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatTime(date: string) {
    if (!date) {
      return '';
    }

    return new Date(date).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  verEntrada(ticketId: string) {
    this.router.navigate(
      ['/compra-exitosa'],
      {
        queryParams: {
          ticket: ticketId,
        },
      }
    );
  }

  formatPrice(price: number) {
    return price.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    });
  }

  volverAlInicio() {
    this.router.navigate(['/home']);
  }
}