import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/auth';
import { supabase } from '../core/supabase';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const { data: sessionData } = await auth.getSession();

    if (!sessionData.session) {
      return router.createUrlTree(['/login']);
    }

    const userId = sessionData.session.user.id;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return router.createUrlTree(['/home']);
    }

    if (allowedRoles.includes(profile.role)) {
      return true;
    }

    return router.createUrlTree(['/home']);
  };
};