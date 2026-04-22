import { Injectable } from '@angular/core';
import { CartItem } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly CART_KEY = 'mf_cart';
  private cartItems: CartItem[] = this.loadCart();

  getItems(): CartItem[] {
    return this.cartItems;
  }

  getCartCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  addToCart(item: CartItem): void {
    const existing = this.cartItems.find(
      i => i.productId === item.productId && i.storeId === item.storeId
    );
    if (existing) {
      existing.quantity += 1;
    } else {
      this.cartItems.push({ ...item });
    }
    this.save();
  }

  updateQuantity(productId: number, storeId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId, storeId);
      return;
    }
    const item = this.cartItems.find(
      i => i.productId === productId && i.storeId === storeId
    );
    if (item) {
      item.quantity = quantity;
      this.save();
    }
  }

  removeItem(productId: number, storeId: number): void {
    this.cartItems = this.cartItems.filter(
      i => !(i.productId === productId && i.storeId === storeId)
    );
    this.save();
  }

  clear(): void {
    this.cartItems = [];
    this.save();
  }

  private save(): void {
    localStorage.setItem(this.CART_KEY, JSON.stringify(this.cartItems));
  }

  private loadCart(): CartItem[] {
    const raw = localStorage.getItem(this.CART_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}
