import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { Store, StoreWithLogo, Product, Category, DeliveryZone, Order, CartItem } from '../models/models';
import { environment } from '../../environments/environment';
import { attachStoreLogo } from './store-logo';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;
  private storesCache?: Observable<StoreWithLogo[]>;
  private categoriesCache?: Observable<Category[]>;
  private deliveryZonesCache?: Observable<DeliveryZone[]>;

  constructor(private http: HttpClient) { }

  getStores(): Observable<StoreWithLogo[]> {
    this.storesCache ??= this.http.get<Store[]>(`${this.baseUrl}/stores`).pipe(
      map(stores => stores.map(attachStoreLogo)),
      catchError(this.handleError<StoreWithLogo[]>([])),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.storesCache;
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
    this.categoriesCache ??= this.http.get<Category[]>(`${this.baseUrl}/categories`).pipe(
      catchError(this.handleError<Category[]>([])),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.categoriesCache;
  }

  getDeliveryZones(): Observable<DeliveryZone[]> {
    this.deliveryZonesCache ??= this.http.get<DeliveryZone[]>(`${this.baseUrl}/delivery-zones`).pipe(
      catchError(this.handleError<DeliveryZone[]>([])),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.deliveryZonesCache;
  }

  createOrder(
    items: CartItem[],
    shippingAddress: string,
    deliveryNotes?: string,
    deliveryLat?: number,
    deliveryLng?: number,
    postalCode?: string
  ): Observable<Order> {
    const payload = {
      items: items.map(i => ({
        productId: i.productId,
        storeId: i.storeId,
        quantity: i.quantity,
        unitPrice: i.price
      })),
      shippingAddress,
      postalCode: postalCode ?? null,
      deliveryNotes: deliveryNotes ?? null,
      deliveryLat: deliveryLat ?? null,
      deliveryLng: deliveryLng ?? null
    };
    return this.http.post<Order>(`${this.baseUrl}/orders`, payload);
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/orders/my`);
  }

  getMyOrderById(orderId: number): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/orders/${orderId}`);
  }

  cancelOrder(orderId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/orders/${orderId}`);
  }

  private handleError<T>(fallback: T) {
    return (_error: HttpErrorResponse): Observable<T> => {
      // Silenciamos el error aquí para evitar ruido en consola; los componentes
      // ya reciben el valor de fallback y pueden decidir si muestran feedback.
      return of(fallback);
    };
  }
}
