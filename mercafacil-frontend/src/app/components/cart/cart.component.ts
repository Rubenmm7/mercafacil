import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { ApiService } from '../../services/api.service';
import { CartItem, Store } from '../../models/models';

interface StoreGroup {
  storeId: number;
  storeName: string;
  items: CartItem[];
  store: Store | undefined;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {
  readonly stores = signal<Store[]>([]);

  readonly cartItems = computed(() => this.cartService.items());
  readonly isEmpty = computed(() => this.cartItems().length === 0);

  readonly itemsByStore = computed<StoreGroup[]>(() => {
    const groups: Record<number, { storeName: string; items: CartItem[] }> = {};
    for (const item of this.cartItems()) {
      if (!groups[item.storeId]) groups[item.storeId] = { storeName: item.storeName, items: [] };
      groups[item.storeId].items.push(item);
    }
    const storeList = this.stores();
    return Object.entries(groups).map(([id, g]) => ({
      storeId: +id,
      storeName: g.storeName,
      items: g.items,
      store: storeList.find(s => s.id === +id)
    }));
  });

  readonly subtotal = computed(() =>
    this.cartItems().reduce((sum, i) => sum + i.price * i.quantity, 0)
  );

  readonly deliveryFees = computed(() =>
    this.itemsByStore().reduce((sum, g) => {
      const storeSubtotal = g.items.reduce((s, i) => s + i.price * i.quantity, 0);
      return sum + (g.store ? (storeSubtotal >= 40 ? 0 : g.store.deliveryFee) : 0);
    }, 0)
  );

  readonly total = computed(() => this.subtotal() + this.deliveryFees());
  readonly totalUnits = computed(() =>
    this.cartItems().reduce((s, i) => s + i.quantity, 0)
  );

  readonly checking = signal(false);
  readonly checkoutError = signal<string | null>(null);

  constructor(
    public cartService: CartService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.api.getStores().subscribe(s => this.stores.set(s));
  }

  checkout(): void {
    if (this.checking()) return;
    this.checking.set(true);
    this.checkoutError.set(null);
    this.api.createOrder(this.cartItems()).subscribe({
      next: () => {
        this.cartService.clear();
        this.router.navigate(['/pedidos']);
      },
      error: () => {
        this.checkoutError.set('No se pudo procesar el pedido. Inténtalo de nuevo.');
        this.checking.set(false);
      }
    });
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
