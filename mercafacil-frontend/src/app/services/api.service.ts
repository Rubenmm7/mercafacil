import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Store, Product, Category, DeliveryZone, Order, CartItem } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getStores(): Observable<Store[]> {
    return this.http.get<Store[]>(`${this.baseUrl}/stores`).pipe(
      catchError(this.handleError<Store[]>([]))
    );
  }

  getProducts(query?: string): Observable<Product[]> {
    const url = query
      ? `${this.baseUrl}/products?q=${encodeURIComponent(query)}`
      : `${this.baseUrl}/products`;
    return this.http.get<Product[]>(url).pipe(
      catchError(this.handleError<Product[]>([]))
    );
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`).pipe(
      catchError(this.handleError<Category[]>([]))
    );
  }

  getDeliveryZones(): Observable<DeliveryZone[]> {
    return this.http.get<DeliveryZone[]>(`${this.baseUrl}/delivery-zones`).pipe(
      catchError(this.handleError<DeliveryZone[]>([]))
    );
  }

  createOrder(items: CartItem[], shippingAddress: string, deliveryNotes?: string): Observable<Order> {
    const payload = {
      items: items.map(i => ({
        productId: i.productId,
        storeId: i.storeId,
        quantity: i.quantity,
        unitPrice: i.price
      })),
      shippingAddress,
      deliveryNotes: deliveryNotes ?? null
    };
    return this.http.post<Order>(`${this.baseUrl}/orders`, payload);
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/orders/my`);
  }

  getMyOrderById(orderId: number): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/orders/${orderId}`);
  }

  private handleError<T>(fallback: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`[ApiService] Error calling API:`, error.message);
      return of(fallback);
    };
  }
}
