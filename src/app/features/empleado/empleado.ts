import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { supabase } from '../../core/supabase';

@Component({
  selector: 'app-empleado',
  imports: [FormsModule],
  templateUrl: './empleado.html',
  styleUrl: './empleado.scss',
})
export class Empleado implements AfterViewInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  

  @ViewChild('video')
  videoElement!: ElementRef<HTMLVideoElement>;

  private qrReader = new BrowserMultiFormatReader();
  private scannerControls: { stop: () => void } | undefined;

  qrCode = '';

  scannerActivo = false;
  loading = false;

  error = '';
  success = '';

  ngAfterViewInit() {}

  async iniciarScanner() {
    this.error = '';
    this.success = '';

    if (this.scannerActivo) {
      return;
    }

    try {
      this.scannerActivo = true;
      this.cdr.detectChanges();

      this.scannerControls =
        await this.qrReader.decodeFromVideoDevice(
          undefined,
          this.videoElement.nativeElement,
          (result) => {
            if (result) {
              this.qrCode = result.getText();

              this.detenerScanner();

              this.success = 'QR detectado correctamente.';
              this.error = '';

              this.cdr.detectChanges();
            }
          }
        );
    } catch (error: any) {
      console.error('ERROR INICIANDO SCANNER:', error);

      this.scannerActivo = false;
      this.scannerControls = undefined;

      this.error =
        'No se pudo acceder a la cámara. Verificá los permisos del navegador.';

      this.cdr.detectChanges();
    }
  }

  detenerScanner() {
    this.scannerControls?.stop();
    this.scannerControls = undefined;

    this.scannerActivo = false;

    this.cdr.detectChanges();
  }

  async validarEntrada() {
    await this.ejecutarAccion('validate_ticket_qr');
  }

  async retirarCandyBar() {
    await this.ejecutarAccion('redeem_candy_bar_qr');
  }

  private async ejecutarAccion(funcion: string) {
    if (!this.qrCode.trim()) {
      this.error = 'Escaneá un QR o ingresá el código manualmente.';
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

  ngOnDestroy() {
    this.detenerScanner();
  }
}