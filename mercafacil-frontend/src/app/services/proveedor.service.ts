import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProveedorStats, Store } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ProveedorService {
  private readonly base = `${environment.apiUrl}/proveedor`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<ProveedorStats> {
    return this.http.get<ProveedorStats>(`${this.base}/stats`);
  }

  getStores(): Observable<Store[]> {
    return this.http.get<Store[]>(`${this.base}/stores`);
  }
}
