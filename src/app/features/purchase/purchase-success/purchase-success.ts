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

  loading = true;
  error = '';

  async ngOnInit() {

    const ticketId =
      this.route.snapshot.queryParamMap.get('ticket');

    console.log(
      'TICKET DE LA URL:',
      ticketId
    );

    if (ticketId) {
      await this.loadTicket(ticketId);
      return;
    }

    const navigation =
      this.router.getCurrentNavigation();

    this.purchase =
      navigation?.extras.state?.['purchase'] ?? null;

    if (!this.purchase) {

      const savedPurchase =
        sessionStorage.getItem(
          'purchase-success'
        );

      if (savedPurchase) {

        try {

          this.purchase =
            JSON.parse(savedPurchase);

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

    this.loading = false;

    this.cdr.detectChanges();
  }

  async loadTicket(ticketId: string) {

    this.loading = true;
    this.error = '';

    try {

      console.log(
        'CARGANDO TICKET:',
        ticketId
      );

      this.purchase =
        await this.purchaseTicketService.getTicket(
          ticketId
        );

      console.log(
        'TICKET CARGADO:',
        this.purchase
      );

    } catch (error: any) {

      console.error(
        'ERROR CARGANDO ENTRADA:',
        error
      );

      this.error =
        error?.message ??
        'No se pudo cargar la entrada.';

    } finally {

      this.loading = false;

      console.log(
        'LOADING FINAL:',
        this.loading
      );

      this.cdr.detectChanges();
    }
  }

  volverAlInicio() {

    sessionStorage.removeItem(
      'purchase-success'
    );

    this.router.navigate([
      '/home',
    ]);
  }

  volverAEntradas() {

    this.router.navigate([
      '/mis-entradas',
    ]);
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

    return new Date(
      date
    ).toLocaleDateString(
      'es-AR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    );
  }

  formatPrice(price: number) {

    return price.toLocaleString(
      'es-AR',
      {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
      }
    );
  }
}