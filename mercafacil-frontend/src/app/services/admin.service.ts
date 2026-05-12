import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminStats, UserAdmin, Role, CreateUserRequest, UpdateUserRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = '/api/admin';

  constructor(private http: HttpClient) { }

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.base}/stats`);
  }

  getUsers(): Observable<UserAdmin[]> {
    return this.http.get<UserAdmin[]>(`${this.base}/users`);
  }

  createUser(req: CreateUserRequest): Observable<UserAdmin> {
    return this.http.post<UserAdmin>(`${this.base}/users`, req);
  }

  updateUser(userId: number, req: UpdateUserRequest): Observable<UserAdmin> {
    return this.http.put<UserAdmin>(`${this.base}/users/${userId}`, req);
  }

  changeRole(userId: number, rol: Role): Observable<UserAdmin> {
    return this.http.put<UserAdmin>(`${this.base}/users/${userId}/role`, { rol });
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${userId}`);
  }
}
