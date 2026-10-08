import {
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';

import {
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';

import { filter } from 'rxjs';

@Component({
  selector: 'app-admin',
  imports: [RouterOutlet],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin {

  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);

  esInicio = false;

  constructor() {

    this.actualizarVista();

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {

        this.actualizarVista();

        this.changeDetector.detectChanges();

      });
  }

  private actualizarVista() {
    this.esInicio = this.router.url === '/admin';
  }

  navegar(ruta: string) {
    this.router.navigate([ruta]);
  }
}