import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Permiso } from '../permissions/permissions';
import { AuthService } from '../services/auth.service';
import { CommunityStore } from '../stores/community.store';
import { SessionStore } from '../stores/session.store';

/** Solo administradores. Si no, `/forbidden`. */
export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const session = inject(SessionStore);
  const router = inject(Router);
  if (!(await auth.initialize())) {
    return router.createUrlTree(['/auth-error']);
  }
  await session.ensure();
  return session.isAdmin() ? true : router.createUrlTree(['/forbidden']);
};

/** Admin o miembro de `servers/:id`. */
export const serverMemberGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const session = inject(SessionStore);
  const community = inject(CommunityStore);
  const router = inject(Router);
  if (!(await auth.initialize())) {
    return router.createUrlTree(['/auth-error']);
  }
  if (!auth.user()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  await session.ensure();
  await community.ensureLoaded();
  const serverId = route.paramMap.get('id');
  if (session.isAdmin() || community.memberships().some((item) => item.serverId === serverId)) {
    return true;
  }
  return router.createUrlTree(['/forbidden']);
};

/**
 * Guard de un permiso de la matriz.
 * @param permiso Acción exigida.
 */
export function permissionGuard(permiso: Permiso): CanActivateFn {
  return async () => {
    const auth = inject(AuthService);
    const session = inject(SessionStore);
    const community = inject(CommunityStore);
    const router = inject(Router);
    if (!(await auth.initialize())) {
      return router.createUrlTree(['/auth-error']);
    }
    await session.ensure();
    await community.ensureLoaded();
    return community.can(permiso) ? true : router.createUrlTree(['/forbidden']);
  };
}
