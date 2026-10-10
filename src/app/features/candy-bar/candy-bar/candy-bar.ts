import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  CandyBarCombo,
  CandyBarProduct,
  CandyBarService,
} from '../candy-bar.service';

@Component({
  selector: 'app-candy-bar',
  imports: [],
  templateUrl: './candy-bar.html',
  styleUrl: './candy-bar.scss',
})
export class CandyBar implements OnInit {
  private candyBarService = inject(CandyBarService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  products: CandyBarProduct[] = [];
  combos: CandyBarCombo[] = [];

  productQuantities: Record<string, number> = {};
  comboQuantities: Record<string, number> = {};

  loading = true;
  error = '';

  async ngOnInit() {
    await this.loadCandyBar();
  }

  async loadCandyBar() {
    this.loading = true;
    this.error = '';

    try {
      const [products, combos] = await Promise.all([
        this.candyBarService.getProducts(),
        this.candyBarService.getCombos(),
      ]);

      this.products = products;
      this.combos = combos;

      const savedSelection = sessionStorage.getItem('candy-bar-selection');

      let savedProducts: { id: string; quantity: number }[] = [];
      let savedCombos: { id: string; quantity: number }[] = [];

      if (savedSelection) {
        try {
          const parsed = JSON.parse(savedSelection);
          savedProducts = Array.isArray(parsed.products) ? parsed.products : [];
          savedCombos = Array.isArray(parsed.combos) ? parsed.combos : [];
        } catch {
          sessionStorage.removeItem('candy-bar-selection');
        }
      }

      for (const product of products) {
        const saved = savedProducts.find(item => item.id === product.id);
        const quantity = Number(saved?.quantity ?? 0);

        this.productQuantities[product.id] = Math.max(
          0,
          Math.min(Number.isFinite(quantity) ? quantity : 0, product.stock)
        );
      }

      for (const combo of combos) {
        const saved = savedCombos.find(item => item.id === combo.id);
        const quantity = Number(saved?.quantity ?? 0);

        this.comboQuantities[combo.id] = Math.max(
          0,
          Number.isFinite(quantity) ? quantity : 0
        );
      }

    } catch (error: any) {
      console.error('ERROR CARGANDO CANDY BAR:', error);
      this.error =
        error?.message ?? 'No se pudo cargar el Candy Bar.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  incrementarProducto(product: CandyBarProduct) {
    const cantidadActual = this.productQuantities[product.id] ?? 0;

    if (cantidadActual >= product.stock) {
      return;
    }

    this.productQuantities[product.id] = cantidadActual + 1;
  }

  decrementarProducto(product: CandyBarProduct) {
    const cantidadActual = this.productQuantities[product.id] ?? 0;

    if (cantidadActual <= 0) {
      return;
    }

    this.productQuantities[product.id] = cantidadActual - 1;
  }

  incrementarCombo(combo: CandyBarCombo) {
    const cantidadActual = this.comboQuantities[combo.id] ?? 0;

    this.comboQuantities[combo.id] = cantidadActual + 1;
  }

  decrementarCombo(combo: CandyBarCombo) {
    const cantidadActual = this.comboQuantities[combo.id] ?? 0;

    if (cantidadActual <= 0) {
      return;
    }

    this.comboQuantities[combo.id] = cantidadActual - 1;
  }

  getProductQuantity(productId: string): number {
    return this.productQuantities[productId] ?? 0;
  }

  getComboQuantity(comboId: string): number {
    return this.comboQuantities[comboId] ?? 0;
  }

  getCandyBarTotal(): number {
    const productsTotal = this.products.reduce((total, product) => {
      const quantity = this.getProductQuantity(product.id);
      return total + product.price * quantity;
    }, 0);

    const combosTotal = this.combos.reduce((total, combo) => {
      const quantity = this.getComboQuantity(combo.id);
      return total + combo.price * quantity;
    }, 0);

    return productsTotal + combosTotal;
  }

  getSelectedItemsCount(): number {
    const productsCount = Object.values(this.productQuantities)
      .reduce((total, quantity) => total + quantity, 0);

    const combosCount = Object.values(this.comboQuantities)
      .reduce((total, quantity) => total + quantity, 0);

    return productsCount + combosCount;
  }

  continuarSinCandyBar() {
    this.router.navigate(['/resumen-compra']);
  }

  continuar() {
    const selectedItems = {
      products: this.products
        .filter(product => this.getProductQuantity(product.id) > 0)
        .map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: this.getProductQuantity(product.id),
        })),

      combos: this.combos
        .filter(combo => this.getComboQuantity(combo.id) > 0)
        .map(combo => ({
          id: combo.id,
          name: combo.name,
          price: combo.price,
          quantity: this.getComboQuantity(combo.id),
        })),
    };

    sessionStorage.setItem(
      'candy-bar-selection',
      JSON.stringify(selectedItems)
    );

    this.router.navigate(['/resumen-compra']);
  }

  formatPrice(price: number): string {
    return price.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    });
  }

  volver() {
    this.router.navigate(['/home']);
  }
}