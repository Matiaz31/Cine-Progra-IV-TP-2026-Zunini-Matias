import { Injectable } from '@angular/core';
import { supabase } from '../core/supabase';

export interface PurchaseSeat {
  id: string;
  row_label: string;
  seat_number: number;
  seat_type: string;
  price: number;
}

export interface PurchaseData {
  orderId: string;
  ticketId: string;
  qrCode: string;
  movieTitle: string;
  screeningDate: string;
  screeningTime: string;
  seats: PurchaseSeat[];
  total: number;
}

@Injectable({
  providedIn: 'root',
})
export class PurchaseTicketService {

  async getTicket(ticketId: string): Promise<PurchaseData> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error(
        'Debés iniciar sesión para consultar esta entrada.'
      );
    }

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        id,
        order_id,
        screening_id,
        qr_code,

        orders (
          id,
          user_id,
          total
        ),

        screenings (
          start_time,
          movies (
            title
          )
        ),

        ticket_seats (
          seat_id,
          price,

          seats (
            id,
            row_label,
            seat_number,
            seat_type
          )
        )
      `)
      .eq('id', ticketId)
      .single();

    if (error) {
      throw error;
    }

    if (!ticket) {
      throw new Error('No se encontró la entrada.');
    }

    const order = Array.isArray(ticket.orders)
      ? ticket.orders[0]
      : ticket.orders;

    if (!order) {
      throw new Error('No se encontró la compra asociada.');
    }

    if (order.user_id !== user.id) {
      throw new Error(
        'No tenés permiso para consultar esta entrada.'
      );
    }

    const screening = Array.isArray(ticket.screenings)
      ? ticket.screenings[0]
      : ticket.screenings;

    const movie = Array.isArray(screening?.movies)
      ? screening.movies[0]
      : screening?.movies;

    const seats = (ticket.ticket_seats ?? []).map(
      (ticketSeat: any) => {

        const seat = Array.isArray(ticketSeat.seats)
          ? ticketSeat.seats[0]
          : ticketSeat.seats;

        return {
          id: seat?.id ?? ticketSeat.seat_id,
          row_label: seat?.row_label ?? '',
          seat_number: seat?.seat_number ?? 0,
          seat_type: seat?.seat_type ?? 'normal',
          price: Number(ticketSeat.price ?? 0),
        };
      }
    );

    return {
      orderId: order.id,
      ticketId: ticket.id,
      qrCode: ticket.qr_code,
      movieTitle: movie?.title ?? 'Película',
      screeningDate: screening?.start_time ?? '',
      screeningTime: screening?.start_time
        ? new Date(
            screening.start_time
          ).toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '',
      seats,
      total: Number(order.total ?? 0),
    };
  }
}