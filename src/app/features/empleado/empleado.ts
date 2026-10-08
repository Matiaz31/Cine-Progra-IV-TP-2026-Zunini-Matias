import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../core/supabase';

@Component({
  selector: 'app-empleado',
  imports: [FormsModule],
  templateUrl: './empleado.html',
  styleUrl: './empleado.scss',
})
export class Empleado {
  private cdr = inject(ChangeDetectorRef);

  qrCode = '';

  loading = false;
  error = '';
  success = '';

  async validarEntrada() {
    await this.ejecutarAccion('validate_ticket_qr');
  }

  async retirarCandyBar() {
    await this.ejecutarAccion('redeem_candy_bar_qr');
  }

  private async ejecutarAccion(funcion: string) {
    if (!this.qrCode.trim()) {
      this.error = 'Ingresá un código QR.';
      this.success = '';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    try {
      const { error } = await supabase.rpc(funcion, {
        p_qr_code: this.qrCode.trim(),
      });

      if (error) {
        throw error;
      }

      if (funcion === 'validate_ticket_qr') {
        this.success = 'Entrada validada correctamente.';
      } else {
        this.success = 'Candy Bar retirado correctamente.';
      }

      this.qrCode = '';
    } catch (error: any) {
      console.error(`ERROR ${funcion}:`, error);

      this.error =
        error?.message ??
        'No se pudo completar la operación.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}