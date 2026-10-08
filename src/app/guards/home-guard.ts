import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../core/auth';

export const homeGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const { data } = await auth.getSession();

  // Invitado: puede ver la cartelera
  if (!data.session) {
    return true;
  }

  const role = await auth.getRole(data.session.user.id);

  // Cliente: puede acceder a Home
  if (role === 'customer') {
    return true;
  }

  // Empleado: vuelve a su panel
  if (role === 'employee') {
    return router.createUrlTree(['/empleado']);
  }

  // Administrador: vuelve a su panel
  if (role === 'admin') {
    return router.createUrlTree(['/admin']);
  }

  // Si no tiene un rol válido
  return router.createUrlTree(['/login']);
};