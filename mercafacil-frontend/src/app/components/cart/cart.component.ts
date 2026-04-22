import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { ApiService } from '../../services/api.service';
import { CartItem, Store } from '../../models/models';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {
  stores: Store[] = [];

  constructor(
    public cartService: CartService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.api.getStores().subscribe(s => this.stores = s);
  }

  get cartItems(): CartItem[] {
    return this.cartService.getItems();
  }

  get isEmpty(): boolean {
    return this.cartItems.length === 0;
  }

  get itemsByStore(): { storeId: number; storeName: string; items: CartItem[]; store: Store | undefined }[] {
    const groups: Record<number, { storeName: string; items: CartItem[] }> = {};
    for (const item of this.cartItems) {
      if (!groups[item.storeId]) {
        groups[item.storeId] = { storeName: item.storeName, items: [] };
      }
      groups[item.storeId].items.push(item);
    }
    return Object.entries(groups).map(([id, g]) => ({
      storeId: +id,
      storeName: g.storeName,
      items: g.items,
      store: this.stores.find(s => s.id === +id)
    }));
  }

  get subtotal(): number {
    return this.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  get deliveryFees(): number {
    return this.itemsByStore.reduce((sum, g) => {
      const storeSubtotal = g.items.reduce((s, i) => s + i.price * i.quantity, 0);
      return sum + (g.store ? (storeSubtotal >= 40 ? 0 : g.store.deliveryFee) : 0);
    }, 0);
  }

  get total(): number {
    return this.subtotal + this.deliveryFees;
  }

  get totalUnits(): number {
    return this.cartItems.reduce((s, i) => s + i.quantity, 0);
  }

  storeSubtotal(items: CartItem[]): number {
    return items.reduce((s, i) => s + i.price * i.quantity, 0);
  }

  isFreeShipping(items: CartItem[]): boolean {
    return this.storeSubtotal(items) >= 40;
  }

  remainingForFree(items: CartItem[]): number {
    return Math.max(0, 40 - this.storeSubtotal(items));
  }

  freeProgress(items: CartItem[]): number {
    return Math.min((this.storeSubtotal(items) / 40) * 100, 100);
  }

  updateQty(productId: number, storeId: number, qty: number): void {
    this.cartService.updateQuantity(productId, storeId, qty);
  }

  remove(productId: number, storeId: number): void {
    this.cartService.removeItem(productId, storeId);
  }

  goToSearch(): void {
    this.router.navigate(['/buscar']);
  }
}
