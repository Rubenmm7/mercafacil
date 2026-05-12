import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ProveedorStats, Store, StoreWithLogo } from '../models/models';
import { attachStoreLogo } from './store-logo';

@Injectable({ providedIn: 'root' })
export class ProveedorService {
  private readonly base = `${environment.apiUrl}/proveedor`;

  constructor(private http: HttpClient) { }

  getStats(): Observable<ProveedorStats> {
    return this.http.get<ProveedorStats>(`${this.base}/stats`);
  }

  getStores(): Observable<StoreWithLogo[]> {
    return this.http.get<Store[]>(`${this.base}/stores`).pipe(
      map(stores => stores.map(attachStoreLogo))
    );
  }
}
