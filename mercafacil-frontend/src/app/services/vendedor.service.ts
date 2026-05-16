import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AnalyticsData, Order, ProductDetail, Store, StoreOfferDetail, VendedorStats } from '../models/models';
import { attachStoreLogo } from './store-logo';

@Injectable({ providedIn: 'root' })
export class VendedorService {
  private readonly base = `${environment.apiUrl}/vendedor`;

  constructor(private http: HttpClient) { }

  getStats(): Observable<VendedorStats> {
    return this.http.get<VendedorStats>(`${this.base}/stats`);
  }

  getStores(): Observable<Store[]> {
    return this.http.get<Store[]>(`${this.base}/stores`).pipe(
      map(stores => stores.map(attachStoreLogo))
    );
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.base}/orders`);
  }

  updateOrderStatus(orderId: number, status: string): Observable<Order> {
    return this.http.patch<Order>(`${this.base}/orders/${orderId}/status`, { status });
  }

  getProducts(): Observable<ProductDetail[]> {
    return this.http.get<ProductDetail[]>(`${this.base}/products`);
  }

  createProduct(data: { name: string; category: string; image: string; description: string; unit: string }, storeId: number): Observable<ProductDetail> {
    return this.http.post<ProductDetail>(`${this.base}/products?storeId=${storeId}`, data);
  }

  updateProduct(id: number, data: { name: string; category: string; image: string; description: string; unit: string }): Observable<ProductDetail> {
    return this.http.put<ProductDetail>(`${this.base}/products/${id}`, data);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/products/${id}`);
  }

  getOffersByStore(storeId: number): Observable<StoreOfferDetail[]> {
    return this.http.get<StoreOfferDetail[]>(`${this.base}/stores/${storeId}/offers`);
  }

  getLowStockOffers(): Observable<StoreOfferDetail[]> {
    return this.http.get<StoreOfferDetail[]>(`${this.base}/offers/low-stock`);
  }

  updateOffer(id: number, data: { price: number; originalPrice?: number; stock: number; brand: string }): Observable<StoreOfferDetail> {
    return this.http.put<StoreOfferDetail>(`${this.base}/offers/${id}`, data);
  }

  pedirAlProveedor(offerId: number, mensaje: string): Observable<void> {
    return this.http.post<void>(`${this.base}/offers/${offerId}/pedir-proveedor`, { mensaje });
  }

  getAnalytics(period: number): Observable<AnalyticsData> {
    return this.http.get<AnalyticsData>(`${this.base}/analytics?period=${period}`);
  }
}
