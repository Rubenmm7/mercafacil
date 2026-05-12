import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { Product, Store, Category, StoreOffer } from '../../models/models';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent implements OnInit {
  readonly allProducts = signal<Product[]>([]);
  readonly stores = signal<Store[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);

  readonly query = signal('');
  localQuery = '';
  readonly selectedCategory = signal('');
  readonly selectedStores = signal<number[]>([]);
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'stores' = 'relevance';
  readonly addedItems = signal<Set<string>>(new Set());

  readonly filteredProducts = computed(() => {
    let result = this.allProducts();
    const cat = this.selectedCategory();
    const stores = this.selectedStores();

    if (cat) {
      result = result.filter(p => p.category === cat);
    }
    if (stores.length > 0) {
      result = result.filter(p => p.storeOffers.some(o => stores.includes(o.storeId) && o.inStock));
    }
    if (this.sortBy === 'price_asc') {
      result = [...result].sort((a, b) => this.getMinPrice(a) - this.getMinPrice(b));
    } else if (this.sortBy === 'price_desc') {
      result = [...result].sort((a, b) => this.getMinPrice(b) - this.getMinPrice(a));
    } else if (this.sortBy === 'stores') {
      result = [...result].sort((a, b) => b.storeOffers.length - a.storeOffers.length);
    }
    return result;
  });

  constructor(
    private api: ApiService,
    public cartService: CartService,
    private route: ActivatedRoute
  ) {
    const state = history.state as Record<string, unknown>;
    if (state['q']) { this.query.set(state['q'] as string); this.localQuery = state['q'] as string; }
    if (state['categoria']) this.selectedCategory.set(state['categoria'] as string);
    if (state['storeId']) this.selectedStores.set([state['storeId'] as number]);
  }

  ngOnInit(): void {
    this.api.getStores().subscribe(s => this.stores.set(s));
    this.api.getCategories().subscribe(c => this.categories.set(c));

    this.route.queryParamMap.subscribe(params => {
      const storeId = params.get('storeId');
      if (storeId) this.selectedStores.set([+storeId]);
    });

    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.api.getProducts(this.query() || undefined).subscribe({
      next: p => this.allProducts.set(p),
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  handleSearch(): void {
    this.query.set(this.localQuery);
    this.loadProducts();
  }

  onSortChange(value: string): void {
    this.sortBy = value as typeof this.sortBy;
    this.allProducts.update(p => [...p]);
  }

  toggleStore(storeId: number): void {
    const current = this.selectedStores();
    this.selectedStores.set(
      current.includes(storeId) ? current.filter(id => id !== storeId) : [...current, storeId]
    );
  }

  isStoreSelected(storeId: number): boolean {
    return this.selectedStores().includes(storeId);
  }

  selectCategory(name: string): void {
    this.selectedCategory.set(this.selectedCategory() === name ? '' : name);
  }

  clearFilters(): void {
    this.selectedStores.set([]);
    this.selectedCategory.set('');
  }

  getMinPrice(product: Product): number {
    const prices = product.storeOffers.filter(o => o.inStock).map(o => o.price);
    return prices.length ? Math.min(...prices) : 0;
  }

  getAvailableCount(product: Product): number {
    return product.storeOffers.filter(o => o.inStock).length;
  }

  hasDiscount(product: Product): boolean {
    return product.storeOffers.some(o => o.originalPrice);
  }

  getStore(storeId: number): Store | undefined {
    return this.stores().find(s => s.id === storeId);
  }

  isLowest(product: Product, price: number, inStock: boolean): boolean {
    return inStock && price === this.getMinPrice(product);
  }

  isUniqueBest(product: Product, price: number, inStock: boolean): boolean {
    if (!inStock || price !== this.getMinPrice(product)) return false;
    return product.storeOffers.filter(o => o.inStock && o.price === price).length === 1;
  }

  isAdded(productId: number, storeId: number): boolean {
    return this.addedItems().has(`${productId}-${storeId}`);
  }

  addToCart(product: Product, offer: StoreOffer): void {
    const key = `${product.id}-${offer.storeId}`;
    this.cartService.addToCart({
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      storeId: offer.storeId,
      storeName: offer.storeName,
      brand: offer.brand,
      price: offer.price,
      quantity: 1,
      unit: product.unit
    });
    this.addedItems.update(s => new Set(s).add(key));
    setTimeout(() => this.addedItems.update(s => {
      const next = new Set(s);
      next.delete(key);
      return next;
    }), 2000);
  }

  clearAll(): void {
    this.localQuery = '';
    this.query.set('');
    this.selectedCategory.set('');
    this.selectedStores.set([]);
    this.loadProducts();
  }
}
