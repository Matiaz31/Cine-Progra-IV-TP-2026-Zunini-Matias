import { Routes } from '@angular/router';

import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Home } from './features/home/home';
import { MovieDetail } from './features/movies/movie-detail/movie-detail';
import { SeatSelection } from './features/seats/seat-selection/seat-selection';
import { PurchaseSummary } from './features/purchase/purchase-summary/purchase-summary';
import { PurchaseSuccess } from './features/purchase/purchase-success/purchase-success';
import { MisEntradas } from './features/mis-entradas/mis-entradas';
import { CandyBar } from './features/candy-bar/candy-bar/candy-bar';
import { Admin } from './features/admin/admin';
import { Profile } from './features/profile/profile';

import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';
import { homeGuard } from './guards/home-guard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'register',
    component: Register,
  },
  {
    path: 'home',
    component: Home,
    canActivate: [homeGuard],
  },
  {
    path: 'pelicula/:id',
    component: MovieDetail,
  },
  {
    path: 'seleccion-butacas/:id',
    component: SeatSelection,
  },
  {
    path: 'candy-bar',
    component: CandyBar,
  },
  {
    path: 'resumen-compra',
    component: PurchaseSummary,
  },
  {
    path: 'compra-exitosa',
    component: PurchaseSuccess,
  },
  {
    path: 'perfil',
    component: Profile,
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    component: Admin,
    canActivate: [
      authGuard,
      roleGuard(['admin']),
    ],
    children: [
      {
        path: 'peliculas',
        loadComponent: () =>
          import('./features/admin/peliculas/peliculas').then(
            m => m.Peliculas
          ),
      },
      {
        path: 'generos',
        loadComponent: () =>
          import('./features/admin/generos/generos').then(
            m => m.Generos
          ),
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./features/admin/categorias/categorias').then(
            (m) => m.Categorias,
          ),
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./features/admin/productos/productos').then(
            (m) => m.Productos,
          ),
      },
      {
        path: 'salas',
        loadComponent: () =>
          import('./features/admin/salas/salas').then(
            (m) => m.Salas,
          ),
      },
      {
        path: 'funciones',
        loadComponent: () =>
          import('./features/admin/funciones/funciones').then(
            (m) => m.Funciones,
          ),
      },
      {
        path: 'butacas',
        loadComponent: () =>
          import('./features/admin/butacas/butacas').then(
            (m) => m.Butacas,
          ),
      },
    ],
  },
  {
    path: 'empleado',
    loadComponent: () =>
      import('./features/empleado/empleado').then(
        m => m.Empleado
      ),
    canActivate: [
      authGuard,
      roleGuard(['employee']),
    ],
  },
  {
    path: 'mis-entradas',
    component: MisEntradas,
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];