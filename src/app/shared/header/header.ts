import { Component, inject, signal } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private auth = inject(AuthService);
  private router = inject(Router);

  hasSession = signal(false);
  role = signal<string | null>(null);

  constructor() {
    this.cargarRol();
  }

  private async cargarRol() {
    try {
      const { data, error } = await this.auth.getUser();

      if (error || !data.user) {
        this.hasSession.set(false);
        this.role.set(null);
        return;
      }

      this.hasSession.set(true);

      const role = await this.auth.getRole(data.user.id);
      this.role.set(role);

      console.log('HEADER - usuario:', data.user.email);
      console.log('HEADER - rol:', role);

      this.role.set(role);

    } catch (error) {
      console.error('HEADER - error cargando rol:', error);
      this.role.set(null);
    }
  }

  async logout() {
    await this.auth.logout();

    this.role.set(null);

    await this.router.navigate(['/login']);
  }

  volverAlLogin(): void {
    this.router.navigate(['/login']);
  }
}