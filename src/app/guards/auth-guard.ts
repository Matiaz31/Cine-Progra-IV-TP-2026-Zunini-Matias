import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/auth';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const { data } = await auth.getSession();

  if (data.session) {
    return true;
  }

  return router.createUrlTree(['/login']);
};