import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { ApiService } from '../../services/api.service';
import { CartItem, Store } from '../../models/models';
import { IconComponent } from '../icon/icon.component';
import { FREE_DELIVERY_THRESHOLD_EUR } from '../../utils/business-rules';

interface StoreGroup {
  storeId: number;
  storeName: string;
  items: CartItem[];
  store: Store | undefined;
}

interface StoreGroupView extends StoreGroup {
  subtotal: number;
  freeShipping: boolean;
  remainingForFree: number;
  freeProgress: number;
  deliveryFee: number;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {
  readonly stores = signal<Store[]>([]);
  readonly storeById = computed(() => new Map(this.stores().map(store => [store.id, store] as const)));

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
      store: this.storeById().get(+id)
    }));
  });

  readonly storeGroups = computed<StoreGroupView[]>(() =>
    this.itemsByStore().map(group => {
      const subtotal = group.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const freeShipping = subtotal >= FREE_DELIVERY_THRESHOLD_EUR;
      return {
        ...group,
        subtotal,
        freeShipping,
        remainingForFree: Math.max(0, FREE_DELIVERY_THRESHOLD_EUR - subtotal),
        freeProgress: Math.min((subtotal / FREE_DELIVERY_THRESHOLD_EUR) * 100, 100),
        deliveryFee: group.store ? group.store.deliveryFee : 0
      };
    })
  );

  readonly subtotal = computed(() =>
    this.cartItems().reduce((sum, i) => sum + i.price * i.quantity, 0)
  );

  readonly deliveryFees = computed(() =>
    this.storeGroups().reduce((sum, g) => {
      return sum + (g.store ? (g.freeShipping ? 0 : g.store.deliveryFee) : 0);
    }, 0)
  );

  readonly total = computed(() => this.subtotal() + this.deliveryFees());
  readonly totalUnits = computed(() =>
    this.cartItems().reduce((s, i) => s + i.quantity, 0)
  );

  constructor(
    public cartService: CartService,
    private api: ApiService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.api.getStores().subscribe(s => this.stores.set(s));
  }

  checkout(): void {
    this.router.navigate(['/pago']);
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
