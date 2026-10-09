import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';

import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import {
  PurchaseData,
  PurchaseTicketService,
} from '../../../services/purchase-ticket.service';

import * as QRCode from 'qrcode';

interface GuestPurchase {
  orderId: string;
  ticketId: string;
  qrCode: string;
  movieTitle: string;
  screeningDate: string;
  screeningTime: string;
  seats: PurchaseData['seats'];
  total: number;
  candyBar?: unknown;
}

@Component({
  selector: 'app-purchase-success',
  imports: [],
  templateUrl: './purchase-success.html',
  styleUrl: './purchase-success.scss',
})
export class PurchaseSuccess implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private purchaseTicketService = inject(
    PurchaseTicketService
  );

  purchase: PurchaseData | null = null;
  qrImage = '';

  loading = true;
  error = '';

  async ngOnInit() {
    const ticketId =
      this.route.snapshot.queryParamMap.get('ticket');

    console.log('TICKET DE LA URL:', ticketId);

    if (ticketId) {
      await this.loadTicket(ticketId);
      return;
    }

    const navigation = this.router.getCurrentNavigation();

    this.purchase =
      navigation?.extras.state?.['purchase'] ?? null;

    if (!this.purchase) {
      const savedPurchase =
        sessionStorage.getItem('purchase-success');

      if (savedPurchase) {
        try {
          this.purchase = JSON.parse(savedPurchase);
        } catch (error) {
          console.error(
            'ERROR LEYENDO purchase-success:',
            error
          );

          this.error =
            'No se pudo recuperar la información de la compra.';
        }
      }
    }

    if (this.purchase) {
      await this.generateQr();
    }

    this.loading = false;
    this.cdr.detectChanges();
  }

  private findGuestPurchase(
    ticketId: string
  ): PurchaseData | null {
    try {
      const savedPurchases =
        localStorage.getItem('guest-purchases');

      if (!savedPurchases) {
        return null;
      }

      const purchases: GuestPurchase[] =
        JSON.parse(savedPurchases);

      if (!Array.isArray(purchases)) {
        return null;
      }

      const guestPurchase = purchases.find(
        (item) => item.ticketId === ticketId
      );

      if (!guestPurchase) {
        return null;
      }

      return {
        orderId: guestPurchase.orderId,
        ticketId: guestPurchase.ticketId,
        qrCode: guestPurchase.qrCode,
        movieTitle: guestPurchase.movieTitle,
        screeningDate: guestPurchase.screeningDate,
        screeningTime: guestPurchase.screeningTime,
        seats: guestPurchase.seats ?? [],
        total: Number(guestPurchase.total ?? 0),
        candyBar: guestPurchase.candyBar,
      } as PurchaseData;
    } catch (error) {
      console.error(
        'ERROR LEYENDO COMPRA DE INVITADO:',
        error
      );

      return null;
    }
  }

  private async generateQr() {
    const qrCode = this.purchase?.qrCode;

    if (!qrCode) {
      this.qrImage = '';
      return;
    }

    try {
      this.qrImage = await QRCode.toDataURL(qrCode, {
        width: 240,
        margin: 2,
        errorCorrectionLevel: 'M',
      });
    } catch (error) {
      console.error('ERROR GENERANDO QR:', error);
      this.error = 'No se pudo generar el código QR.';
    }
  }

  async loadTicket(ticketId: string) {
    this.loading = true;
    this.error = '';

    try {
      console.log('BUSCANDO ENTRADA:', ticketId);

      this.purchase = this.findGuestPurchase(ticketId);

      if (this.purchase) {
        console.log(
          'ENTRADA DE INVITADO RECUPERADA:',
          this.purchase
        );

        await this.generateQr();
        return;
      }

      const {
        data: { session },
        error: sessionError,
      } = await (
        await import('../../../core/supabase')
      ).supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.user) {
        this.error =
          'No se encontró esta entrada entre tus compras de invitado. Si la compra se realizó en otro navegador o dispositivo, iniciá sesión con la cuenta correspondiente o volvé a Mis entradas.';
        return;
      }

      this.purchase =
        await this.purchaseTicketService.getTicket(ticketId);

      console.log('ENTRADA CARGADA:', this.purchase);

      await this.generateQr();
    } catch (error: any) {
      console.error('ERROR CARGANDO ENTRADA:', error);

      this.error =
        error?.message ?? 'No se pudo cargar la entrada.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  volverAlInicio() {
    sessionStorage.removeItem('purchase-success');
    this.router.navigate(['/home']);
  }

  volverAEntradas() {
    this.router.navigate(['/mis-entradas']);
  }

  getSeatLabel(
    seat: PurchaseData['seats'][number]
  ) {
    return `${seat.row_label}${seat.seat_number}`;
  }

  getSeatTypeLabel(type: string) {
    switch (type) {
      case 'normal':
        return 'Normal';
      case 'accessible':
        return 'Accesible';
      case 'vip':
        return 'VIP';
      default:
        return type;
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

  formatPrice(price: number) {
    return price.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    });
  }
}