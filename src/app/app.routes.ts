import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Home } from './features/home/home';
import { MovieDetail } from './features/movies/movie-detail/movie-detail';
import { SeatSelection } from './features/seats/seat-selection/seat-selection';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';
import { PurchaseSummary } from './features/purchase/purchase-summary/purchase-summary';
import { PurchaseSuccess } from './features/purchase/purchase-success/purchase-success';

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
    path: 'resumen-compra',
    component: PurchaseSummary,
  },
  { 
    path: 'compra-exitosa', 
    component: PurchaseSuccess,
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin').then(m => m.Admin),
    canActivate: [
      authGuard,
      roleGuard(['admin']),
    ],
  },
  {
    path: 'empleado',
    loadComponent: () =>
      import('./features/empleado/empleado').then(m => m.Empleado),
    canActivate: [
      authGuard,
      roleGuard(['employee']),
    ],
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];