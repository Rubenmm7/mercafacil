import { Injectable, computed, signal } from '@angular/core';
import { CartItem } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly CART_KEY = 'mf_cart';
  private readonly _items = signal<CartItem[]>(this.loadCart());

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().reduce((sum, i) => sum + i.quantity, 0));

  getItems(): CartItem[] {
    return this._items();
  }

  getCartCount(): number {
    return this.count();
  }

  addToCart(item: CartItem): void {
    const current = this._items();
    const existing = current.find(i => i.productId === item.productId && i.storeId === item.storeId);
    if (existing) {
      this._items.set(current.map(i =>
        i.productId === item.productId && i.storeId === item.storeId
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      this._items.set([...current, { ...item }]);
    }
    this.save();
  }

  updateQuantity(productId: number, storeId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId, storeId);
      return;
    }
    this._items.set(this._items().map(i =>
      i.productId === productId && i.storeId === storeId ? { ...i, quantity } : i
    ));
    this.save();
  }

  removeItem(productId: number, storeId: number): void {
    this._items.set(this._items().filter(i => !(i.productId === productId && i.storeId === storeId)));
    this.save();
  }

  clear(): void {
    this._items.set([]);
    this.save();
  }

  private save(): void {
    localStorage.setItem(this.CART_KEY, JSON.stringify(this._items()));
  }

  private loadCart(): CartItem[] {
    const raw = localStorage.getItem(this.CART_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}
