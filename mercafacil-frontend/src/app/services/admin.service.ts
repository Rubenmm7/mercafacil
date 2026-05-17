import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminStats, AnalyticsData, StoreAdmin, UserAdmin, UserPage, Role, CreateUserRequest, UpdateUserRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = '/api/admin';

  constructor(private http: HttpClient) { }

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.base}/stats`);
  }

  getUsers(opts: { search?: string; page?: number; size?: number; sort?: string; dir?: string } = {}): Observable<UserPage> {
    const params = new HttpParams()
      .set('search', opts.search ?? '')
      .set('page', opts.page ?? 0)
      .set('size', opts.size ?? 10)
      .set('sort', opts.sort ?? 'id')
      .set('dir', opts.dir ?? 'asc');
    return this.http.get<UserPage>(`${this.base}/users`, { params });
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

  getStores(): Observable<StoreAdmin[]> {
    return this.http.get<StoreAdmin[]>(`${this.base}/stores`);
  }

  assignVendedor(storeId: number, vendedorId: number | null): Observable<StoreAdmin> {
    return this.http.put<StoreAdmin>(`${this.base}/stores/${storeId}/vendedor`, { vendedorId });
  }

  getAnalytics(period: number): Observable<AnalyticsData> {
    return this.http.get<AnalyticsData>(`${this.base}/analytics?period=${period}`);
  }
}
