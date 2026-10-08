import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Header } from './shared/header/header';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {

  private router = inject(Router);

  protected readonly title = signal('cine-progra-iv');

  mostrarHeader = signal(false);

  constructor() {

    // Estado inicial
    this.actualizarHeader(this.router.url);

    // Actualizar cuando cambia la ruta
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd)
      )
      .subscribe((event) => {
        this.actualizarHeader(event.urlAfterRedirects);
      });
  }

  private actualizarHeader(url: string) {
    this.mostrarHeader.set(
      url !== '/login' &&
      url !== '/register'
    );
  }
}