import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { Product, Store, Category } from '../../models/models';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent implements OnInit {
  allProducts: Product[] = [];
  stores: Store[] = [];
  categories: Category[] = [];
  query = '';
  localQuery = '';
  selectedCategory = '';
  selectedStores: number[] = [];
  sortBy = 'relevance';
  showFilters = false;
  addedItems = new Set<string>();

  constructor(
    private api: ApiService,
    public cartService: CartService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.api.getStores().subscribe(s => this.stores = s);
    this.api.getCategories().subscribe(c => this.categories = c);

    this.route.queryParams.subscribe(params => {
      this.query = params['q'] || '';
      this.localQuery = this.query;
      this.selectedCategory = params['categoria'] || '';
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.api.getProducts(this.query || undefined).subscribe(p => this.allProducts = p);
  }

  get filteredProducts(): Product[] {
    let result = this.allProducts;

    if (this.selectedCategory) {
      result = result.filter(p => p.category === this.selectedCategory);
    }

    if (this.selectedStores.length > 0) {
      result = result.filter(p =>
        p.storeOffers.some(o => this.selectedStores.includes(o.storeId) && o.inStock)
      );
    }

    if (this.sortBy === 'price_asc') {
      result = [...result].sort((a, b) => this.getMinPrice(a) - this.getMinPrice(b));
    } else if (this.sortBy === 'price_desc') {
      result = [...result].sort((a, b) => this.getMinPrice(b) - this.getMinPrice(a));
    } else if (this.sortBy === 'stores') {
      result = [...result].sort((a, b) => b.storeOffers.length - a.storeOffers.length);
    }

    return result;
  }

  handleSearch(): void {
    this.router.navigate(['/buscar'], { queryParams: { q: this.localQuery } });
  }

  toggleStore(storeId: number): void {
    const idx = this.selectedStores.indexOf(storeId);
    if (idx > -1) this.selectedStores.splice(idx, 1);
    else this.selectedStores.push(storeId);
  }

  isStoreSelected(storeId: number): boolean {
    return this.selectedStores.includes(storeId);
  }

  selectCategory(name: string): void {
    this.selectedCategory = this.selectedCategory === name ? '' : name;
  }

  clearFilters(): void {
    this.selectedStores = [];
    this.selectedCategory = '';
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
    return this.stores.find(s => s.id === storeId);
  }

  isLowest(product: Product, price: number, inStock: boolean): boolean {
    return inStock && price === this.getMinPrice(product);
  }

  isAdded(productId: number, storeId: number): boolean {
    return this.addedItems.has(`${productId}-${storeId}`);
  }

  addToCart(product: Product, offer: any): void {
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
    this.addedItems.add(key);
    setTimeout(() => this.addedItems.delete(key), 2000);
  }

  clearAll(): void {
    this.localQuery = '';
    this.query = '';
    this.selectedCategory = '';
    this.selectedStores = [];
    this.router.navigate(['/buscar']);
    this.api.getProducts().subscribe(p => this.allProducts = p);
  }
}
