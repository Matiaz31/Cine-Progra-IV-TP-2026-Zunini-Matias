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

  couponCode = '';
  couponMessage = '';
  couponMessageType: 'success' | 'error' | '' = '';
  couponId: string | null = null;
  couponDiscount = 0;
  couponApplied = false;

  userId: string | null = null;
  pointsBalance = 0;

  rewardId: string | null = null;
  rewardCost = 0;
  useTicketReward = false;
  selectedRewardSeatId = '';

  loyaltyLoading = false;
  loyaltyMessage = '';


  validatingCoupon = false;

  onCouponCodeChange(value: string): void {
    this.couponCode = value;
    this.couponApplied = false;
    this.couponDiscount = 0;
    this.couponMessage = '';
    this.couponMessageType = '';
  }

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

    await this.loadLoyaltyInfo();

    if (this.selectedSeats.length > 0) {
      this.selectedRewardSeatId = this.rewardEligibleSeats[0]?.id ?? '';
    }
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

  getFinalTotal(): number {
    const rewardDiscount =
      this.useTicketReward && this.canRedeemTicketReward()
        ? this.getSelectedRewardSeatPrice()
        : 0;

    return Math.max(
      0,
      this.getTotal() - this.couponDiscount - rewardDiscount,
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

  async aplicarCupon(): Promise<void> {

    const codigo = this.couponCode.trim();

    if (!codigo) {
      this.couponMessage = 'Ingresá un código de cupón.';
      this.couponMessageType = 'error';
      return;
    }

    if (this.validatingCoupon) return;

    this.validatingCoupon = true;
    this.couponMessage = '';
    this.couponMessageType = '';
    this.couponApplied = false;
    this.couponDiscount = 0;
    this.couponId = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        this.couponMessage =
          'Para utilizar cupones, ingresá con tu cuenta.';
        this.couponMessageType = 'error';
        return;
      }

      const { data, error } = await supabase.rpc(
        'calculate_coupon_discount',
        {
          p_coupon_code: codigo,
          p_user_id: user.id,
          p_subtotal: this.getTotal(),
        }
      );

      if (error) throw error;

      const resultado = Array.isArray(data) ? data[0] : data;

      if (
        !resultado?.coupon_id ||
        Number(resultado.discount_amount) <= 0
      ) {
        this.couponMessage =
          'El cupón no es válido o no corresponde a tu compra.';
        this.couponMessageType = 'error';
        return;
      }

      this.couponId = resultado.coupon_id;
      this.couponDiscount = Number(resultado.discount_amount);
      this.couponApplied = true;

      this.couponMessage =
        `¡Cupón aplicado! Descuento: ${this.formatPrice(this.couponDiscount)}.`;
      this.couponMessageType = 'success';

    } catch (error: any) {
      console.error('Error validando el cupón:', error);

      this.couponMessage =
        error?.message ||
        'No se pudo validar el cupón. Revisá el código e intentá nuevamente.';
      this.couponMessageType = 'error';

    } finally {
      this.validatingCoupon = false;
      this.cdr.detectChanges();
    }
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

  async loadLoyaltyInfo(): Promise<void> {
    this.loyaltyLoading = true;
    this.loyaltyMessage = '';

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      this.userId = user?.id ?? null;

      // Los invitados pueden comprar, pero no canjear puntos.
      if (!this.userId) return;

      const [
        { data: transactions, error: transactionsError },
        { data: reward, error: rewardError },
      ] = await Promise.all([
        supabase
          .from('points_transactions')
          .select('type, amount')
          .eq('user_id', this.userId),

        supabase
          .from('rewards')
          .select('id, name, type, points_cost')
          .eq('name', 'Entrada gratis')
          .eq('is_active', true)
          .maybeSingle(),
      ]);

      if (transactionsError) throw transactionsError;
      if (rewardError) throw rewardError;

      this.pointsBalance = (transactions ?? []).reduce(
        (balance, transaction) => {
          const amount = Number(transaction.amount ?? 0);

          switch (transaction.type) {
            case 'earned':
              return balance + Math.abs(amount);
            case 'redeemed':
              return balance - Math.abs(amount);
            case 'adjustment':
              return balance + amount;
            default:
              return balance;
          }
        },
        0,
      );

      if (reward) {
        this.rewardId = reward.id;
        this.rewardCost = Number(reward.points_cost ?? 0);
      }
    } catch (error: any) {
      console.error('Error cargando puntos:', error);
      this.loyaltyMessage =
        error?.message ?? 'No se pudieron cargar tus puntos.';
    } finally {
      this.loyaltyLoading = false;
      this.cdr.detectChanges();
    }
  }

  getSelectedRewardSeatPrice(): number {
    const seat = this.selectedSeats.find(
      (item) => item.id === this.selectedRewardSeatId,
    );

    return seat ? this.getSeatPrice(seat) : 0;
  }

  canRedeemTicketReward(): boolean {
    return Boolean(
      this.userId &&
      this.rewardId &&
      this.rewardCost > 0 &&
      this.pointsBalance >= this.rewardCost &&
      this.selectedRewardSeatId &&
      this.selectedSeats.some(
        (seat) =>
          seat.id === this.selectedRewardSeatId &&
          seat.seat_type !== 'vip',
      ),
    );
  }

  get rewardEligibleSeats(): Seat[] {
    return this.selectedSeats.filter(
      (seat) => seat.seat_type !== 'vip',
    );
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

            if (this.useTicketReward) {
        if (
          !userId ||
          !this.rewardId ||
          !this.canRedeemTicketReward()
        ) {
          throw new Error(
            'No podés canjear la entrada gratis. Revisá tu sesión y tu saldo de puntos.'
          );
        }
      }

      const {
        data: order,
        error: orderError,
      } = await supabase.rpc('create_order', {
        p_user_id: userId,
        p_total: this.getTotal(),
        p_discount: 0,
        p_payment_method: 'test',
      });
      
      if (this.couponApplied && this.couponCode.trim()) {
        const { data: couponOrder, error: couponError } =
          await supabase.rpc('set_order_coupon', {
            p_order_id: order.id,
            p_coupon_code: this.couponCode.trim(),
          });

        if (couponError) {
          throw couponError;
        }

        if (!couponOrder) {
          throw new Error('No se pudo asociar el cupón a la orden.');
        }

      }

      if (orderError) {
        throw orderError;
      }

      if (!order) {
        throw new Error('No se pudo crear la orden.');
      }

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

      if (this.useTicketReward) {
        const { error: rewardError } = await supabase.rpc(
          'apply_ticket_reward',
          {
            p_order_id: order.id,
            p_reward_id: this.rewardId,
            p_seat_id: this.selectedRewardSeatId,
          }
        );

        if (rewardError) {
          throw rewardError;
        }
      }

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
          this.selectedSeats.map((seat) => ({
            id: seat.id,
            row_label: seat.row_label,
            seat_number:
              seat.seat_number,
            seat_type:
              seat.seat_type,
            price:
              this.useTicketReward &&
              seat.id === this.selectedRewardSeatId
                ? 0
                : this.getSeatPrice(seat),
          })
          ),
        total: Number(
          paidOrder.total ?? this.getFinalTotal()
        ),
        couponApplied: this.couponApplied,
        candyBar: this.candyBar,
      };
      
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