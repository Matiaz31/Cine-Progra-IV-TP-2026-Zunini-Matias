import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { supabase } from '../core/supabase';

export const adminPermissionGuard: CanActivateChildFn = async (route) => {
  const router = inject(Router);
  const section = route.data['permissionSection'] as string | undefined;

  if (!section) {
    return router.createUrlTree(['/admin']);
  }

  const { data, error } = await supabase.rpc(
    'has_admin_permission',
    {
      p_section: section,
      p_action: 'view',
    }
  );

  if (error || data !== true) {
    return router.createUrlTree(['/admin']);
  }

  return true;
};