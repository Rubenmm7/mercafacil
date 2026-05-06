import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/models';

export const roleGuard = (...roles: Role[]): CanActivateFn => (_route, state) => {
  const user = inject(AuthService).getUser();
  if (user && roles.includes(user.rol)) return true;
  if (!user) {
    return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  return inject(Router).createUrlTree(['/']);
};
