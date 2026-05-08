import { Component, OnInit, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { MallMapComponent } from '../mall-map/mall-map.component';
import { Product, Store, Category } from '../../models/models';

interface CategoryGroup {
  name: string;
  icon: string;
  bgColor: string;
  stores: Store[];
  storeNames: string;
}

const CATEGORY_META: Record<string, { icon: string; bgColor: string }> = {
  'Restaurantes': { icon: '🍔', bgColor: '#ef4444' },
  'Textiles':    { icon: '👕', bgColor: '#8b5cf6' },
  'Informática': { icon: '💻', bgColor: '#3b82f6' },
  'Deporte':     { icon: '🚴', bgColor: '#14b8a6' },
  'Mascotas':    { icon: '🐾', bgColor: '#f97316' },
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MallMapComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  readonly selectedMallStore = signal<number | null>(null);

  readonly sortedStores = computed(() => {
    const sel = this.selectedMallStore();
    const all = this.stores();
    if (!sel) return all;
    const idx = all.findIndex(s => s.id === sel);
    if (idx <= 0) return all;
    return [all[idx], ...all.slice(0, idx), ...all.slice(idx + 1)];
  });

  readonly categoryGroups = computed<CategoryGroup[]>(() => {
    const map = new Map<string, Store[]>();
    for (const s of this.stores()) {
      const key = s.category || 'Otros';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).map(([name, stores]) => ({
      name,
      icon: CATEGORY_META[name]?.icon ?? '🏪',
      bgColor: CATEGORY_META[name]?.bgColor ?? '#6b7280',
      stores,
      storeNames: stores.map(s => s.name).join(' · '),
    }));
  });

  searchQuery = '';
  readonly categories = signal<Category[]>([]);
  readonly stores = signal<Store[]>([]);
  readonly featuredProducts = signal<Product[]>([]);
  readonly loading = signal(true);

  popularTerms = ['iPhone 17', 'Big Mac', 'Aceite Oliva', 'Rockrider'];

  stats = [
    { icon: '📍', value: '25+',     label: 'Establecimientos en Jaén' },
    { icon: '🏷️', value: '+50.000', label: 'Productos comparados'     },
    { icon: '✅', value: 'Gratis',  label: 'Sin registro necesario'   },
    { icon: '🔄', value: 'Diario',  label: 'Precios actualizados'     },
  ];

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    let pending = 3;
    const done = () => { if (--pending === 0) this.loading.set(false); };
    this.api.getCategories().subscribe({ next: c => this.categories.set(c), complete: done, error: done });
    this.api.getStores().subscribe({ next: s => this.stores.set(s), complete: done, error: done });
    this.api.getProducts().subscribe({ next: p => this.featuredProducts.set(p.slice(0, 8)), complete: done, error: done });
  }

  handleSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/buscar'], { state: { q: this.searchQuery.trim() } });
    }
  }

  searchTerm(term: string): void {
    this.router.navigate(['/buscar'], { state: { q: term } });
  }

  searchCategory(name: string): void {
    this.router.navigate(['/buscar'], { state: { categoria: name } });
  }

  getFirstStoreName(product: Product): string {
    return product.storeOffers.find(o => o.inStock)?.storeName ?? '';
  }

  getMinPrice(product: Product): number {
    const prices = product.storeOffers.filter(o => o.inStock).map(o => o.price);
    return prices.length ? Math.min(...prices) : 0;
  }

  getMaxPrice(product: Product): number {
    const prices = product.storeOffers.filter(o => o.inStock).map(o => o.price);
    return prices.length ? Math.max(...prices) : 0;
  }

  getAvailableCount(product: Product): number {
    return product.storeOffers.filter(o => o.inStock).length;
  }

  selectMallStore(id: number): void {
    this.selectedMallStore.set(this.selectedMallStore() === id ? null : id);
  }

  viewProducts(store: Store): void {
    this.router.navigate(['/buscar'], { state: { storeId: store.id } });
  }

  goToSearch(): void {
    this.router.navigate(['/buscar']);
  }
}
