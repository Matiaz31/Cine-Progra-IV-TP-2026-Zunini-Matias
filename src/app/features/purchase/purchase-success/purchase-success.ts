import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface PurchaseData {
  orderId: string;
  ticketId: string;
  qrCode: string;
  movieTitle: string;
  screeningDate: string;
  screeningTime: string;
  seats: {
    id: string;
    row_label: string;
    seat_number: number;
    seat_type: string;
    price: number;
  }[];
  total: number;
}

@Component({
  selector: 'app-purchase-success',
  imports: [],
  templateUrl: './purchase-success.html',
  styleUrl: './purchase-success.scss',
})
export class PurchaseSuccess implements OnInit {
  purchase: PurchaseData | null = null;

  constructor(private router: Router) {}

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();

    this.purchase =
      navigation?.extras.state?.['purchase'] ?? null;

    // Si la página se recarga, Angular pierde el state.
    // Recuperamos los datos desde sessionStorage.
    if (!this.purchase) {
      const savedPurchase =
        sessionStorage.getItem('purchase-success');

      if (savedPurchase) {
        this.purchase = JSON.parse(savedPurchase);
      }
    }
  }

  volverAlInicio() {
    sessionStorage.removeItem('purchase-success');
    this.router.navigate(['/home']);
  }

  getSeatLabel(seat: PurchaseData['seats'][number]) {
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
    if (!date) return '';

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