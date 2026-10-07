import { Component, inject } from '@angular/core';
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

  email = '';
  password = '';
  error = '';
  loading = false;
  oauthLoading = '';

  continueAsGuest() {
    this.router.navigate(['/home']);
  }

  async login() {
    this.error = '';
    this.loading = true;

    const { error } = await this.auth.login(this.email, this.password);

    this.loading = false;

    if (error) {
      this.error = error.message;
      return;
    }

    await this.router.navigate(['/home']);
  }

  async loginWithGoogle() {
    this.error = '';
    this.oauthLoading = 'google';

    const { error } = await this.auth.loginWithGoogle();

    if (error) {
      this.error = error.message;
      this.oauthLoading = '';
    }
  }

  async loginWithGitHub() {
    this.error = '';
    this.oauthLoading = 'github';

    const { error } = await this.auth.loginWithGitHub();

    if (error) {
      this.error = error.message;
      this.oauthLoading = '';
    }
  }
}