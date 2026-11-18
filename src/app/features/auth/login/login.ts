import {
  Component,
  ChangeDetectorRef,
  inject,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  email = '';
  password = '';
  error = '';
  loading = false;
  oauthLoading = '';

  continueAsGuest() {
    this.router.navigate(['/home']);
  }

  private traducirError(mensaje: string): string {
    const error = mensaje.toLowerCase();

    if (
      error.includes('invalid login credentials') ||
      error.includes('invalid_credentials')
    ) {
      return 'El correo electrónico o la contraseña son incorrectos. Verificá tus datos e intentá nuevamente.';
    }

    if (error.includes('email not confirmed')) {
      return 'Tu correo electrónico todavía no fue confirmado. Revisá tu bandeja de entrada.';
    }

    if (error.includes('user not found')) {
      return 'No encontramos una cuenta registrada con esos datos.';
    }

    if (
      error.includes('too many requests') ||
      error.includes('rate limit')
    ) {
      return 'Realizaste demasiados intentos. Esperá unos minutos antes de volver a intentarlo.';
    }

    if (
      error.includes('network') ||
      error.includes('fetch')
    ) {
      return 'No pudimos conectarnos al servidor. Revisá tu conexión a Internet e intentá nuevamente.';
    }

    if (error.includes('database')) {
      return 'No pudimos verificar tu cuenta en este momento. Intentá nuevamente más tarde.';
    }

    return 'Ocurrió un problema al iniciar sesión. Intentá nuevamente. Si el problema continúa, contactá con soporte.';
  }

  async login() {
    if (this.loading) return;

    this.error = '';
    this.loading = true;
    this.cdr.detectChanges();

    try {
      const { data, error } = await this.auth.login(
        this.email.trim(),
        this.password
      );

      if (error) {
        this.error = this.traducirError(error.message);
        this.password = '';
        return;
      }

      const userId = data.user?.id;

      if (!userId) {
        this.error = 'No pudimos identificar tu cuenta. Intentá iniciar sesión nuevamente.';
        return;
      }

      const role = await this.auth.getRole(userId);

      if (!role) {
        this.error = 'No pudimos verificar los permisos de tu cuenta. Intentá nuevamente más tarde.';
        return;
      }

      if (role === 'admin') {
        await this.router.navigate(['/admin']);
        return;
      }

      if (role === 'employee') {
        await this.router.navigate(['/empleado']);
        return;
      }

      await this.router.navigate(['/home']);

    } catch (e: unknown) {
      const mensaje = e instanceof Error ? e.message : '';
      this.error = this.traducirError(mensaje);
      this.password = '';

    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async loginWithGoogle() {
    if (this.oauthLoading) return;

    this.error = '';
    this.oauthLoading = 'google';

    try {
      const { error } = await this.auth.loginWithGoogle();

      if (error) {
        this.error = this.traducirError(error.message);
        this.oauthLoading = '';
      }
    } catch (e: unknown) {
      const mensaje = e instanceof Error ? e.message : '';
      this.error = this.traducirError(mensaje);
      this.oauthLoading = '';
    } finally {
      this.cdr.detectChanges();
    }
  }

  async loginWithGitHub() {
    if (this.oauthLoading) return;

    this.error = '';
    this.oauthLoading = 'github';

    try {
      const { error } = await this.auth.loginWithGitHub();

      if (error) {
        this.error = this.traducirError(error.message);
        this.oauthLoading = '';
      }
    } catch (e: unknown) {
      const mensaje = e instanceof Error ? e.message : '';
      this.error = this.traducirError(mensaje);
      this.oauthLoading = '';
    } finally {
      this.cdr.detectChanges();
    }
  }
}