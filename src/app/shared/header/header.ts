import { Component, inject } from '@angular/core';
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

  role: string | null = null;

  constructor() {
    this.cargarRol();
  }

  private async cargarRol() {
    const { data } = await this.auth.getUser();

    if (!data.user) {
      this.role = null;
      return;
    }

    this.role = await this.auth.getRole(data.user.id);
  }

  async logout() {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}