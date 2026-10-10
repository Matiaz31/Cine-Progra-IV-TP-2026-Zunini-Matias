import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { supabase } from '../../../core/supabase';
import { Seat } from '../../seats/seat';

interface CandyBarProductSelection {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CandyBarComboSelection {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CandyBarSelection {
  products: CandyBarProductSelection[];
  combos: CandyBarComboSelection[];
}

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

  candyBar: CandyBarSelection = {
    products: [],
    combos: [],
  };

  loading = true;
  purchasing = false;

  error = '';
  success = '';

  async ngOnInit() {
    this.loadPurchaseSelection();
    this.loadCandyBarSelection();

    if (!this.screeningId || this.seatIds.length === 0) {
      this.error = 'No se encontró la información de la compra.';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    await this.loadSummary();
  }

  private loadPurchaseSelection() {
    this.screeningId =
      this.route.snapshot.queryParamMap.get('screeningId') ?? '';

    const seatsParam =
      this.route.snapshot.queryParamMap.get('seats') ?? '';

    this.seatIds = seatsParam
      ? seatsParam.split(',').filter(Boolean)
      : [];

    if (!this.screeningId || this.seatIds.length === 0) {
      const savedSelection =
        sessionStorage.getItem('purchase-selection');

      if (!savedSelection) {
        return;
      }

      try {
        const selection = JSON.parse(savedSelection);

        this.screeningId =
          selection.screeningId ?? '';

        this.seatIds =
          Array.isArray(selection.seatIds)
            ? selection.seatIds
            : [];

        console.log(
          'SELECCIÓN DE COMPRA RECUPERADA:',
          selection
        );
      } catch (error) {
        console.error(
          'ERROR LEYENDO purchase-selection:',
          error
        );
      }
    }
  }

  private loadCandyBarSelection() {
    const savedCandyBar =
      sessionStorage.getItem('candy-bar-selection');

    if (!savedCandyBar) {
      return;
    }

    try {
      const selection = JSON.parse(savedCandyBar);

      this.candyBar = {
        products: Array.isArray(selection.products)
          ? selection.products
          : [],

        combos: Array.isArray(selection.combos)
          ? selection.combos
          : [],
      };

      console.log(
        'CANDY BAR RECUPERADO:',
        this.candyBar
      );
    } catch (error) {
      console.error(
        'ERROR LEYENDO candy-bar-selection:',
        error
      );
    }
  }

  async loadSummary() {
    this.loading = true;
    this.error = '';

    try {
      const {
        data: screening,
        error: screeningError,
      } = await supabase
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

      const {
        data: seats,
        error: seatsError,
      } = await supabase
        .from('seats')
        .select('*')
        .in('id', this.seatIds)
        .order('row_label')
        .order('seat_number');

      if (seatsError) {
        throw seatsError;
      }

      this.selectedSeats = seats ?? [];

      if (this.selectedSeats.length === 0) {
        throw new Error(
          'No se encontraron las butacas seleccionadas.'
        );
      }

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
    const modifier =
      Number(seat.price_modifier ?? 0);

    return Math.round(
      this.screeningPrice * (1 + modifier)
    );
  }

  getTicketsTotal(): number {
    return this.selectedSeats.reduce(
      (total, seat) =>
        total + this.getSeatPrice(seat),
      0
    );
  }

  getCandyBarTotal(): number {
    const productsTotal =
      this.candyBar.products.reduce(
        (total, product) =>
          total +
          product.price * product.quantity,
        0
      );

    const combosTotal =
      this.candyBar.combos.reduce(
        (total, combo) =>
          total +
          combo.price * combo.quantity,
        0
      );

    return productsTotal + combosTotal;
  }

  getTotal(): number {
    return (
      this.getTicketsTotal() +
      this.getCandyBarTotal()
    );
  }

  getCandyBarItemsCount(): number {
    const productsCount =
      this.candyBar.products.reduce(
        (total, product) =>
          total + product.quantity,
        0
      );

    const combosCount =
      this.candyBar.combos.reduce(
        (total, combo) =>
          total + combo.quantity,
        0
      );

    return productsCount + combosCount;
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

  formatPrice(price: number): string {
    return price.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
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
        userId
          ? 'Usuario registrado'
          : 'Compra anónima'
      );

      const {
        data: order,
        error: orderError,
      } = await supabase.rpc('create_order', {
        p_user_id: userId,
        p_total: this.getTotal(),
        p_discount: 0,
        p_payment_method: 'test',
      });

      if (orderError) {
        throw orderError;
      }

      if (!order) {
        throw new Error(
          'No se pudo crear la orden.'
        );
      }

      console.log(
        'Orden creada:',
        order
      );

      for (const seat of this.selectedSeats) {
        const seatPrice =
          this.getSeatPrice(seat);

        const {
          error: itemError,
        } = await supabase.rpc(
          'add_order_item',
          {
            p_order_id: order.id,
            p_item_type: 'ticket',
            p_product_id: null,
            p_quantity: 1,
            p_unit_price: seatPrice,
          }
        );

        if (itemError) {
          throw itemError;
        }
      }

      console.log(
        'Order items de tickets creados.'
      );

      for (const product of this.candyBar.products) {
        const { error: productError } = await supabase.rpc(
          'add_order_item',
          {
            p_order_id: order.id,
            p_item_type: 'product',
            p_product_id: product.id,
            p_quantity: product.quantity,
            p_unit_price: product.price,
          }
        );

        if (productError) {
          throw productError;
        }
      }

      console.log(
        'Order items de productos del Candy Bar creados.'
      );

      for (const combo of this.candyBar.combos) {
        const { error: comboError } = await supabase.rpc(
          'add_order_item',
          {
            p_order_id: order.id,
            p_item_type: 'combo',
            p_product_id: null,
            p_quantity: combo.quantity,
            p_unit_price: combo.price,
            p_combo_id: combo.id,
          }
        );

        if (comboError) {
          throw comboError;
        }
      }

      console.log(
        'Order items de combos del Candy Bar creados.'
      );

      const qrCode =
        `TICKET-${crypto.randomUUID()}`;

      const {
        data: ticket,
        error: ticketError,
      } = await supabase.rpc(
        'create_ticket',
        {
          p_order_id: order.id,
          p_screening_id: this.screeningId,
          p_qr_code: qrCode,
        }
      );

      if (ticketError) {
        throw ticketError;
      }

      if (!ticket) {
        throw new Error(
          'No se pudo crear el ticket.'
        );
      }

      console.log(
        'Ticket creado:',
        ticket
      );

      for (const seat of this.selectedSeats) {
        const {
          error: seatError,
        } = await supabase.rpc(
          'add_ticket_seat',
          {
            p_ticket_id: ticket.id,
            p_seat_id: seat.id,
          }
        );

        if (seatError) {
          throw seatError;
        }
      }

      console.log(
        'Butacas asociadas al ticket.'
      );

      const {
        data: paidOrder,
        error: paymentError,
      } = await supabase.rpc(
        'confirm_test_order_paid',
        {
          p_order_id: order.id,
        }
      );

      if (paymentError) {
        throw paymentError;
      }

      if (!paidOrder) {
        throw new Error(
          'No se pudo confirmar el pago de prueba.'
        );
      }

      console.log(
        'Orden confirmada como pagada:',
        paidOrder
      );

      const purchaseData = {
        orderId: order.id,
        ticketId: ticket.id,
        qrCode,

        movieTitle: this.movieTitle,

        screeningDate: this.startTime,

        screeningTime:
          new Date(
            this.startTime
          ).toLocaleTimeString(
            'es-AR',
            {
              hour: '2-digit',
              minute: '2-digit',
            }
          ),

        seats:
          this.selectedSeats.map(
            (seat) => ({
              id: seat.id,
              row_label: seat.row_label,
              seat_number:
                seat.seat_number,
              seat_type:
                seat.seat_type,
              price:
                this.getSeatPrice(
                  seat
                ),
            })
          ),

        total: this.getTotal(),

        candyBar: this.candyBar,
      };

      console.log(
        'Datos del comprobante:',
        purchaseData
      );
      
      if (!userId) {
        try {
          const storageKey = 'guest-purchases';

          const savedPurchases =
            localStorage.getItem(storageKey);

          let purchases: typeof purchaseData[] = [];

          if (savedPurchases) {
            try {
              purchases = JSON.parse(savedPurchases);
            } catch (parseError) {
              console.error(
                'No se pudieron leer las entradas guardadas:',
                parseError
              );
            }
          }

          const updatedPurchases = [
            ...purchases.filter(
              (item) => item.ticketId !== purchaseData.ticketId
            ),
            purchaseData,
          ];

          localStorage.setItem(
            storageKey,
            JSON.stringify(updatedPurchases)
          );

          console.log(
            'Entradas de invitado guardadas:',
            updatedPurchases
          );
        } catch (storageError) {
          console.error(
            'No se pudieron guardar las entradas del invitado:',
            storageError
          );
        }
      }
      
      sessionStorage.setItem(
        'purchase-success',
        JSON.stringify(purchaseData)
      );

      sessionStorage.removeItem('purchase-selection');
      sessionStorage.removeItem('candy-bar-selection');

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