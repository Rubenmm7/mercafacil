import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order, RepartidorStats } from '../models/models';

@Injectable({ providedIn: 'root' })
export class RepartidorService {
  private readonly base = `${environment.apiUrl}/repartidor`;

  constructor(private http: HttpClient) { }

  getStats(): Observable<RepartidorStats> {
    return this.http.get<RepartidorStats>(`${this.base}/stats`);
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.base}/orders`);
  }

  getAvailableOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.base}/orders/available`);
  }

  acceptOrder(orderId: number): Observable<Order> {
    return this.http.patch<Order>(`${this.base}/orders/${orderId}/accept`, {});
  }

  updateOrderStatus(orderId: number, status: string): Observable<Order> {
    return this.http.patch<Order>(`${this.base}/orders/${orderId}/status`, { status });
  }
}
