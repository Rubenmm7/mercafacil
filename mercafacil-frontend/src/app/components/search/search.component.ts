import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { Product, Store, Category, StoreOffer } from '../../models/models';
import { IconComponent } from '../icon/icon.component';

interface OfferView {
  offer: StoreOffer;
  store?: Store;
  isBest: boolean;
  isUniqueBest: boolean;
}

interface ProductView {
  product: Product;
  minPrice: number;
  availableCount: number;
  hasDiscount: boolean;
  offers: OfferView[];
}

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
  readonly categoryDisplay = computed(() => this.selectedCategory().replace(/\|/g, ' y '));
  readonly selectedStores = signal<number[]>([]);
  readonly storeById = computed(() => new Map(this.stores().map(store => [store.id, store] as const)));
  readonly selectedStoreViews = computed(() =>
    this.selectedStores().map(id => ({ id, store: this.storeById().get(id) }))
  );
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'stores' = 'relevance';
  readonly addedItems = signal<Set<string>>(new Set());
  private lastLoadedQuery: string | null = null;

  readonly filteredProducts = computed(() => {
    let result = this.allProducts();
    const cat = this.selectedCategory();
    const stores = this.selectedStores();

    if (cat) {
      const cats = cat.split('|');
      result = result.filter(p => cats.includes(p.category));
    }
    if (stores.length > 0) {
      result = result.filter(p => p.storeOffers.some(o => stores.includes(o.storeId) && o.inStock));
    }
    if (this.sortBy === 'price_asc') {
      result = [...result].sort((a, b) => this.minPriceOf(a) - this.minPriceOf(b));
    } else if (this.sortBy === 'price_desc') {
      result = [...result].sort((a, b) => this.minPriceOf(b) - this.minPriceOf(a));
    } else if (this.sortBy === 'stores') {
      result = [...result].sort((a, b) => b.storeOffers.length - a.storeOffers.length);
    }
    return result;
  });

  readonly productViews = computed<ProductView[]>(() =>
    this.filteredProducts().map(product => {
      const availableOffers = product.storeOffers.filter(offer => offer.inStock);
      const prices = availableOffers.map(offer => offer.price);
      const minPrice = prices.length ? Math.min(...prices) : 0;

      return {
        product,
        minPrice,
        availableCount: availableOffers.length,
        hasDiscount: product.storeOffers.some(offer => offer.originalPrice),
        offers: product.storeOffers.map(offer => ({
          offer,
          store: this.storeById().get(offer.storeId),
          isBest: offer.inStock && offer.price === minPrice,
          isUniqueBest: offer.inStock && offer.price === minPrice && availableOffers.filter(item => item.price === offer.price).length === 1
        }))
      };
    })
  );

  constructor(
    private api: ApiService,
    public cartService: CartService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.api.getStores().subscribe(s => this.stores.set(s));
    this.api.getCategories().subscribe(c => this.categories.set(c));

    this.route.queryParamMap.subscribe(params => {
      const query = this.applyRouteState(params);
      if (query !== this.lastLoadedQuery) {
        this.lastLoadedQuery = query;
        this.loadProducts();
      }
    });
  }

  private applyRouteState(params: ParamMap): string {
    const query = params.get('q') ?? '';
    const category = params.get('categoria') ?? '';
    const storeIds = params.get('storeId');

    this.query.set(query);
    this.localQuery = query;
    this.selectedCategory.set(category);
    this.selectedStores.set(
      storeIds
        ? storeIds.split(',').map(id => +id).filter(id => Number.isFinite(id))
        : []
    );
    return query;
  }

  private syncRoute(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.query() || null,
        categoria: this.selectedCategory() || null,
        storeId: this.selectedStores().length ? this.selectedStores().join(',') : null
      },
      queryParamsHandling: 'merge'
    });
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
    this.syncRoute();
  }

  onSortChange(value: string): void {
    this.sortBy = value as typeof this.sortBy;
    this.allProducts.update(p => [...p]);
  }

  private minPriceOf(product: Product): number {
    const prices = product.storeOffers.filter(o => o.inStock).map(o => o.price);
    return prices.length ? Math.min(...prices) : 0;
  }

  toggleStore(storeId: number): void {
    const current = this.selectedStores();
    this.selectedStores.set(current.includes(storeId) ? current.filter(id => id !== storeId) : [...current, storeId]);
    this.syncRoute();
  }

  isStoreSelected(storeId: number): boolean {
    return this.selectedStores().includes(storeId);
  }

  selectCategory(name: string): void {
    if (!name) {
      this.selectedCategory.set('');
      this.syncRoute();
      return;
    }

    const selected = this.selectedCategory()
      .split('|')
      .filter(Boolean);

    const next = selected.includes(name)
      ? selected.filter(item => item !== name)
      : [...selected, name];

    this.selectedCategory.set(next.join('|'));
    this.syncRoute();
  }

  clearFilters(): void {
    this.selectedStores.set([]);
    this.selectedCategory.set('');
    this.syncRoute();
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
    this.syncRoute();
  }
}
