import { Component, inject } from '@angular/core';
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

  email = '';
  password = '';
  firstName = '';
  lastName = '';
  birthDate = '';

  error = '';
  message = '';
  loading = false;

  async register() {
    this.error = '';
    this.message = '';
    this.loading = true;

    const { data, error } = await this.auth.register(
      this.email,
      this.password,
      this.firstName,
      this.lastName,
      this.birthDate,
    );

    this.loading = false;

    if (error) {
      this.error = error.message;
      return;
    }

    if (data.user) {
      this.message =
        'Registro exitoso. Revisá tu email si Supabase solicita confirmar la cuenta.';
    }
  }
}