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

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap(u => this.store(u)));
  }

  register(nombre: string, apellidos: string, email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, { nombre, apellidos, email, password })
      .pipe(tap(u => this.store(u)));
  }

  logout(): void {
    localStorage.removeItem(this.USER_KEY);
    this._user.set(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return this._user()?.token ?? null;
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
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  private loadStored(): AuthResponse | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
