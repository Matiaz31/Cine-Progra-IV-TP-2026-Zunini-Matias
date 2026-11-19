import { Routes } from '@angular/router';

import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { CompleteProfile } from './features/auth/complete-profile/complete-profile';
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
import { adminPermissionGuard } from './guards/admin-permission-guard';

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
    path: 'completar-perfil',
    component: CompleteProfile,
  },
  {
    path: 'home',
    component: Home,
    canActivate: [homeGuard],
  },
  {
    path: 'proponer-pelicula',
    loadComponent: () =>
      import('./features/movie-proposal/movie-proposal').then(
        m => m.MovieProposals
      ),
    canActivate: [authGuard],
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
    path: 'mis-recompensas',
    loadComponent: () =>
      import('./features/mis-recompensas/mis-recompensas').then(
        m => m.MisRecompensas
      ),
    canActivate: [authGuard, roleGuard(['customer'])],
  },
  {
    path: 'admin',
    component: Admin,
    canActivate: [
      authGuard,
      roleGuard(['admin']),
    ],
    canActivateChild: [adminPermissionGuard],
    children: [
      {
        path: 'peliculas',
        data: { permissionSection: 'movies' },
        loadComponent: () =>
          import('./features/admin/peliculas/peliculas').then(
            m => m.Peliculas
          ),
      },
      {
        path: 'generos',
        data: { permissionSection: 'genres' },
        loadComponent: () =>
          import('./features/admin/generos/generos').then(
            m => m.Generos
          ),
      },
      {
        path: 'categorias',
        data: { permissionSection: 'product_categories' },
        loadComponent: () =>
          import('./features/admin/categorias/categorias').then(
            m => m.Categorias
          ),
      },
      {
        path: 'productos',
        data: { permissionSection: 'products' },
        loadComponent: () =>
          import('./features/admin/productos/productos').then(
            m => m.Productos
          ),
      },
      {
        path: 'salas',
        data: { permissionSection: 'rooms' },
        loadComponent: () =>
          import('./features/admin/salas/salas').then(
            m => m.Salas
          ),
      },
      {
        path: 'funciones',
        data: { permissionSection: 'screenings' },
        loadComponent: () =>
          import('./features/admin/funciones/funciones').then(
            m => m.Funciones
          ),
      },
      {
        path: 'butacas',
        data: { permissionSection: 'seats' },
        loadComponent: () =>
          import('./features/admin/butacas/butacas').then(
            m => m.Butacas
          ),
      },
      {
        path: 'preventa',
        data: { permissionSection: 'ticket_pricing' },
        loadComponent: () =>
          import('./features/admin/butacas/butacas').then(
            m => m.Butacas
          ),
      },
      {
        path: 'combos',
        data: { permissionSection: 'combos' },
        loadComponent: () =>
          import('./features/admin/combos/combos').then(m => m.Combos)
      },
      {
        path: 'cupones',
        data: { permissionSection: 'coupons' },
        loadComponent: () =>
          import('./features/admin/cupones/cupones').then(m => m.Cupones)
      },
      {
        path: 'recompensas',
        data: { permissionSection: 'rewards' },
        loadComponent: () =>
          import('./features/admin/recompensas/recompensas').then(
            m => m.Recompensas
          )
      },
      {
        path: 'logs',
        data: { permissionSection: 'activity_logs' },
        loadComponent: () =>
          import('./features/admin/logs/logs').then(
            m => m.Logs
          ),
      },
      {
        path: 'reportes',
        data: { permissionSection: 'reports' },
        loadComponent: () =>
          import('./features/admin/reportes/reportes').then(
            m => m.Reportes
          ),
      },
      {
        path: 'propuestas-peliculas',
        data: { permissionSection: 'movie_proposals' },
        loadComponent: () =>
          import('./features/admin/movie-proposals/movie-proposals').then(
            m => m.MovieProposalsAdmin
          ),
      },
      {
        path: 'roles',
        data: { permissionSection: 'admin_roles' },
        loadComponent: () =>
          import('./features/admin/roles/roles').then(
            m => m.AdminRoles
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
