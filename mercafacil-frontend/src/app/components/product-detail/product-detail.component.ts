import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { Product, Store, StoreOffer } from '../../models/models';
import { IconComponent } from '../icon/icon.component';

interface StoreOfferView {
  offer: StoreOffer;
  store?: Store;
  isBest: boolean;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [DecimalPipe, RouterLink, IconComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  readonly product = signal<Product | null>(null);
  readonly relatedProducts = signal<Product[]>([]);
  readonly stores = signal<Store[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly storeById = computed(() => new Map(this.stores().map(s => [s.id, s] as const)));

  readonly offerViews = computed((): StoreOfferView[] => {
    const p = this.product();
    if (!p) return [];
    const available = p.storeOffers.filter(o => o.inStock);
    const bestPrice = available.length > 0 ? Math.min(...available.map(o => o.price)) : null;
    return p.storeOffers.map(o => ({
      offer: o,
      store: this.storeById().get(o.storeId),
      isBest: bestPrice !== null && o.inStock && o.price === bestPrice
    }));
  });

  readonly minPrice = computed(() => {
    const p = this.product();
    if (!p) return null;
    const prices = p.storeOffers.filter(o => o.inStock).map(o => o.price);
    return prices.length > 0 ? Math.min(...prices) : null;
  });

  readonly availableCount = computed(() =>
    this.product()?.storeOffers.filter(o => o.inStock).length ?? 0
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cartService: CartService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.api.getStores().subscribe(stores => this.stores.set(stores));

    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      if (!id) { this.router.navigate(['/buscar']); return; }

      this.loading.set(true);
      this.error.set(false);
      this.product.set(null);
      this.relatedProducts.set([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      this.api.getProductById(id).subscribe({
        next: product => {
          if (!product) { this.error.set(true); this.loading.set(false); return; }
          this.product.set(product);
          this.loading.set(false);
          this.loadRelated(product.category, id);
        },
        error: () => { this.error.set(true); this.loading.set(false); }
      });
    });
  }

  private loadRelated(category: string, excludeId: number): void {
    this.api.getProducts(category).subscribe(products => {
      this.relatedProducts.set(products.filter(p => p.id !== excludeId).slice(0, 6));
    });
  }

  addToCart(offer: StoreOffer): void {
    const p = this.product();
    if (!p) return;
    this.cartService.addToCart({
      productId: p.id,
      productName: p.name,
      productImage: p.image,
      storeId: offer.storeId,
      storeName: offer.storeName,
      brand: offer.brand,
      price: offer.price,
      quantity: 1,
      unit: p.unit
    });
  }

  isAdded(storeId: number): boolean {
    const p = this.product();
    if (!p) return false;
    return this.cartService.items().some(i => i.productId === p.id && i.storeId === storeId);
  }

  relatedMinPrice(product: Product): number | null {
    const prices = product.storeOffers.filter(o => o.inStock).map(o => o.price);
    return prices.length > 0 ? Math.min(...prices) : null;
  }

  goToRelated(id: number): void {
    this.router.navigate(['/producto', id]);
  }

  goBack(): void {
    this.router.navigate(['/buscar']);
  }
}
