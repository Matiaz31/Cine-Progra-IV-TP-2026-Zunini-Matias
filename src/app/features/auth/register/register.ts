import {
  Component,
  ChangeDetectorRef,
  inject,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  email = '';
  password = '';
  firstName = '';
  lastName = '';
  birthDate = '';

  bloodType = '';
  eyeColor = '';
  vacationDays = 0;

  error = '';
  message = '';
  loading = false;

  private traducirError(mensaje: string): string {
    const error = mensaje.toLowerCase();

    if (
      error.includes('user already registered') ||
      error.includes('already registered') ||
      error.includes('email_exists')
    ) {
      return 'Ya existe una cuenta registrada con ese correo electrónico. Intentá iniciar sesión.';
    }

    if (error.includes('invalid email')) {
      return 'El correo electrónico ingresado no es válido. Verificá que esté escrito correctamente.';
    }

    if (
      error.includes('password should be at least') ||
      error.includes('weak_password')
    ) {
      return 'La contraseña es demasiado corta o no cumple los requisitos de seguridad.';
    }

    if (
      error.includes('password') &&
      error.includes('characters')
    ) {
      return 'La contraseña no cumple con la longitud requerida.';
    }

    if (
      error.includes('too many requests') ||
      error.includes('rate limit')
    ) {
      return 'Se realizaron demasiados intentos. Esperá unos minutos antes de volver a registrarte.';
    }

    if (
      error.includes('network') ||
      error.includes('fetch')
    ) {
      return 'No pudimos conectarnos al servidor. Revisá tu conexión a Internet e intentá nuevamente.';
    }

    if (
      error.includes('duplicate key') ||
      error.includes('unique constraint')
    ) {
      return 'Ya existe un registro con alguno de los datos ingresados. Verificá la información.';
    }

    if (
      error.includes('null value') ||
      error.includes('not-null constraint')
    ) {
      return 'Faltan algunos datos obligatorios. Revisá el formulario e intentá nuevamente.';
    }

    return 'No pudimos completar tu registro. Verificá los datos ingresados e intentá nuevamente. Si el problema continúa, contactá con soporte.';
  }

  async register() {
    if (this.loading) return;

    this.error = '';
    this.message = '';
    this.loading = true;
    this.cdr.detectChanges();

    try {
      const { data, error } = await this.auth.register(
        this.email.trim(),
        this.password,
        this.firstName.trim(),
        this.lastName.trim(),
        this.birthDate,
        this.bloodType,
        this.eyeColor,
        this.vacationDays,
      );

      if (error) {
        this.error = this.traducirError(error.message);
        return;
      }

      if (data.user) {
        this.message =
          '¡Registro exitoso! Revisá tu correo electrónico para confirmar tu cuenta si se solicita la verificación.';
      } else {
        this.error =
          'No pudimos confirmar la creación de tu cuenta. Intentá nuevamente.';
      }

    } catch (e: unknown) {
      const mensaje = e instanceof Error ? e.message : '';
      this.error = this.traducirError(mensaje);

    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}