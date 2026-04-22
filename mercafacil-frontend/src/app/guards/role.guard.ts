import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/models';

export const roleGuard = (...roles: Role[]): CanActivateFn => (_route, _state) => {
  const user = inject(AuthService).getUser();
  if (user && roles.includes(user.rol)) return true;
  return inject(Router).createUrlTree(['/']);
};
