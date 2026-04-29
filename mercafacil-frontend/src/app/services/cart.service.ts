import { Injectable, computed, effect, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CartItem } from '../models/models';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

// Estructura del body para actualizar cantidad
interface QuantityBody { quantity: number; }

// Estructura de petición al backend (igual que CartItem pero sin estado de UI)
interface CartItemRequest {
  productId: number; productName: string; productImage: string;
  storeId: number;   storeName: string;  brand: string;
  price: number;     quantity: number;   unit: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly CART_KEY = 'mf_cart';
  private readonly api = `${environment.apiUrl}/cart`;
  private readonly _items = signal<CartItem[]>([]);

  readonly items  = this._items.asReadonly();
  readonly count  = computed(() => this._items().reduce((sum, i) => sum + i.quantity, 0));

  constructor(private http: HttpClient, private authService: AuthService) {
    // Sincroniza el carrito según si el usuario está autenticado o es invitado
    effect(() => {
      if (this.authService.loggedIn()) {
        this.syncFromApi();
      } else {
        this._items.set(this.readLocal());
      }
    });
  }

  getItems(): CartItem[]  { return this._items(); }
  getCartCount(): number  { return this.count(); }

  addToCart(item: CartItem): void {
    if (this.authService.loggedIn()) {
      // POST al backend; actualiza señal con la respuesta del servidor
      this.http.post<CartItem>(`${this.api}/items`, this.toReq(item)).subscribe({
        next: res => {
          const cur = this._items();
          const idx = cur.findIndex(i => i.productId === item.productId && i.storeId === item.storeId);
          this._items.set(idx >= 0
            ? cur.map((i, k) => k === idx ? res : i)
            : [...cur, res]);
        }
      });
    } else {
      const cur = this._items();
      const existing = cur.find(i => i.productId === item.productId && i.storeId === item.storeId);
      this._items.set(existing
        ? cur.map(i => i.productId === item.productId && i.storeId === item.storeId
            ? { ...i, quantity: i.quantity + 1 } : i)
        : [...cur, { ...item }]);
      this.saveLocal();
    }
  }

  updateQuantity(productId: number, storeId: number, quantity: number): void {
    if (quantity <= 0) { this.removeItem(productId, storeId); return; }
    if (this.authService.loggedIn()) {
      this.http.put<CartItem>(`${this.api}/items/${productId}/${storeId}`, { quantity } as QuantityBody).subscribe({
        next: () => this._items.set(
          this._items().map(i => i.productId === productId && i.storeId === storeId ? { ...i, quantity } : i))
      });
    } else {
      this._items.set(this._items().map(i =>
        i.productId === productId && i.storeId === storeId ? { ...i, quantity } : i));
      this.saveLocal();
    }
  }

  removeItem(productId: number, storeId: number): void {
    if (this.authService.loggedIn()) {
      this.http.delete(`${this.api}/items/${productId}/${storeId}`).subscribe({
        next: () => this._items.set(
          this._items().filter(i => !(i.productId === productId && i.storeId === storeId)))
      });
    } else {
      this._items.set(this._items().filter(i => !(i.productId === productId && i.storeId === storeId)));
      this.saveLocal();
    }
  }

  clear(): void {
    if (this.authService.loggedIn()) {
      this.http.delete(this.api).subscribe({ next: () => this._items.set([]) });
    } else {
      this._items.set([]);
      this.saveLocal();
    }
  }

  // Al hacer login: fusiona carrito local en servidor, luego borra localStorage
  private syncFromApi(): void {
    const local = this.readLocal();
    if (local.length > 0) {
      this.http.post<CartItem[]>(`${this.api}/merge`, local.map(i => this.toReq(i))).subscribe({
        next: items => { this._items.set(items); localStorage.removeItem(this.CART_KEY); },
        error:  ()   => this.fetchFromApi()
      });
    } else {
      this.fetchFromApi();
    }
  }

  private fetchFromApi(): void {
    this.http.get<CartItem[]>(this.api).subscribe({
      next:  items => this._items.set(items),
      error: ()    => this._items.set([])
    });
  }

  private saveLocal(): void {
    localStorage.setItem(this.CART_KEY, JSON.stringify(this._items()));
  }

  private readLocal(): CartItem[] {
    const raw = localStorage.getItem(this.CART_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private toReq(item: CartItem): CartItemRequest {
    return {
      productId: item.productId, productName: item.productName, productImage: item.productImage,
      storeId:   item.storeId,   storeName:   item.storeName,   brand:        item.brand,
      price:     item.price,     quantity:    item.quantity,    unit:         item.unit
    };
  }
}
