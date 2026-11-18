import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';

import {
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';

import { filter } from 'rxjs';
import { supabase } from '../../core/supabase';

@Component({
  selector: 'app-admin',
  imports: [RouterOutlet],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin implements OnInit {
  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);

  esInicio = false;
  esAdministradorPrincipal = false;

  permisos: Record<string, boolean> = {};

  private secciones = [
    'movies',
    'genres',
    'movie_proposals',
    'rooms',
    'seats',
    'screenings',
    'products',
    'product_categories',
    'combos',
    'coupons',
    'rewards',
    'ticket_pricing',
    'reports',
    'activity_logs',
  ];

  constructor() {
    this.actualizarVista();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.actualizarVista();
        this.changeDetector.detectChanges();
      });
  }

  async ngOnInit() {
    await Promise.all([this.cargarPermisos(), this.cargarTipoAdministrador()]);
  }

  private async cargarTipoAdministrador() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('admin_role_id')
      .eq('id', authData.user.id)
      .single();

    this.esAdministradorPrincipal = !error && data?.admin_role_id === null;
    this.changeDetector.detectChanges();
  }

  private async cargarPermisos() {
    const resultados = await Promise.all(
      this.secciones.map(async section => {
        const { data, error } = await supabase.rpc(
          'has_admin_permission',
          {
            p_section: section,
            p_action: 'view',
          }
        );

        return [section, !error && data === true] as const;
      })
    );

    this.permisos = Object.fromEntries(resultados);
    this.changeDetector.detectChanges();
  }

  tienePermiso(section: string): boolean {
    return this.permisos[section] === true;
  }

  private actualizarVista() {
    this.esInicio = this.router.url === '/admin';
  }

  navegar(ruta: string) {
    this.router.navigate([ruta]);
  }
}
