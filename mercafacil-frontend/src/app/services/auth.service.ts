import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthResponse, Role } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly USER_KEY = 'mf_user';
  private userSubject = new BehaviorSubject<AuthResponse | null>(this.loadStored());
  user$ = this.userSubject.asObservable();

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
    this.userSubject.next(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return this.userSubject.value?.token ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.userSubject.value;
  }

  getUser(): AuthResponse | null {
    return this.userSubject.value;
  }

  hasRole(role: Role): boolean {
    return this.userSubject.value?.rol === role;
  }

  private store(user: AuthResponse): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }

  private loadStored(): AuthResponse | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
