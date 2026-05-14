import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthResponse, Role } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly USER_KEY = 'mf_user';
  private readonly _user = signal<AuthResponse | null>(this.loadStored());

  readonly user = this._user.asReadonly();
  readonly loggedIn = computed(() => this._user() !== null);

  constructor(private http: HttpClient, private router: Router) { }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap(user => this.store(user)));
  }

  register(nombre: string, apellidos: string, email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, { nombre, apellidos, email, password })
      .pipe(tap(user => this.store(user)));
  }

  logout(): void {
    localStorage.removeItem(this.USER_KEY);
    this._user.set(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return this._user()?.token ?? null;
  }

  clearAuthState(): void {
    localStorage.removeItem(this.USER_KEY);
    this._user.set(null);
  }

  isLoggedIn(): boolean {
    return this.loggedIn();
  }

  getUser(): AuthResponse | null {
    return this._user();
  }

  hasRole(role: Role): boolean {
    return this._user()?.rol === role;
  }

  private store(user: AuthResponse): void {
    const normalized: AuthResponse = {
      ...user,
      token: this.normalizeToken(user.token)
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(normalized));
    this._user.set(normalized);
  }

  private loadStored(): AuthResponse | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as Partial<AuthResponse>;
      if (!parsed.id || !parsed.token || !parsed.email || !parsed.nombre || !parsed.apellidos || !parsed.rol) {
        return null;
      }
      return {
        id: parsed.id,
        token: this.normalizeToken(parsed.token),
        email: parsed.email,
        nombre: parsed.nombre,
        apellidos: parsed.apellidos,
        rol: parsed.rol as Role
      };
    } catch {
      return null;
    }
  }

  private normalizeToken(token: string): string {
    return token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  }
}
