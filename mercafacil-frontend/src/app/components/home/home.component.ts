import { Component, OnInit, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from '../../services/api.service';
import { MallMapComponent } from '../mall-map/mall-map.component';
import { IconComponent, IconName } from '../icon/icon.component';
import { Product, Store, Category } from '../../models/models';

interface CategoryGroup {
  name: string;
  bgColor: string;
  stores: Store[];
  storeNames: string;
}

interface FeaturedProductCard {
  product: Product;
  firstStoreName: string;
  minPrice: number;
  maxPrice: number;
}

type PopularTerm = Readonly<{
  label: string;
  query: string;
}>;

const SVG_ATTRS = `width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;

const CATEGORY_META: Record<string, { bgColor: string; svg: string }> = {
  'Comida Rápida': {
    bgColor: '#ef4444',
    svg: `<svg ${SVG_ATTRS}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>`,
  },
  'Restaurantes': {
    bgColor: '#ef4444',
    svg: `<svg ${SVG_ATTRS}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>`,
  },
  'Moda': {
    bgColor: '#8b5cf6',
    svg: `<svg ${SVG_ATTRS}><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>`,
  },
  'Textiles': {
    bgColor: '#8b5cf6',
    svg: `<svg ${SVG_ATTRS}><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>`,
  },
  'Tecnología': {
    bgColor: '#3b82f6',
    svg: `<svg ${SVG_ATTRS}><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/></svg>`,
  },
  'Informática': {
    bgColor: '#3b82f6',
    svg: `<svg ${SVG_ATTRS}><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/></svg>`,
  },
  'Videojuegos': {
    bgColor: '#6366f1',
    svg: `<svg ${SVG_ATTRS}><rect width="20" height="12" x="2" y="6" rx="2"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="15" cy="13" r="1" fill="white" stroke="none"/><circle cx="18" cy="11" r="1" fill="white" stroke="none"/></svg>`,
  },
  'Deporte': {
    bgColor: '#14b8a6',
    svg: `<svg ${SVG_ATTRS}><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`,
  },
  'Mascotas': {
    bgColor: '#f97316',
    svg: `<svg ${SVG_ATTRS}><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><circle cx="4" cy="8" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>`,
  },
};

const DEFAULT_SVG = `<svg ${SVG_ATTRS}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MallMapComponent, IconComponent],
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
      bgColor: CATEGORY_META[name]?.bgColor ?? '#6b7280',
      stores,
      storeNames: stores.map(s => s.name).join(' · '),
    }));
  });

  readonly featuredProductCards = computed<FeaturedProductCard[]>(() =>
    this.featuredProducts().map(product => {
      const prices = product.storeOffers.filter(o => o.inStock).map(o => o.price);
      return {
        product,
        firstStoreName: product.storeOffers.find(o => o.inStock)?.storeName ?? '',
        minPrice: prices.length ? Math.min(...prices) : 0,
        maxPrice: prices.length ? Math.max(...prices) : 0
      };
    })
  );

  searchQuery = '';
  readonly categories = signal<Category[]>([]);
  readonly stores = signal<Store[]>([]);
  readonly featuredProducts = signal<Product[]>([]);
  readonly loading = signal(true);

  readonly popularTerms = [
    { label: 'iPhone 17', query: 'iPhone 17' },
    { label: 'Big Mac', query: 'Big Mac' },
    { label: 'Collar Seresto', query: 'Collar Antiparasitario Seresto' },
    { label: 'Rockrider', query: 'Rockrider' },
  ] satisfies ReadonlyArray<PopularTerm>;

  stats: { icon: IconName; value: string; label: string }[] = [
    { icon: 'map-pin', value: '+ 10', label: 'Establecimientos en Jaén' },
    { icon: 'tag', value: '+75', label: 'Productos comparados' },
    { icon: 'check-circle', value: 'Compara gratis', label: 'Registrate solo al comprar' },
    { icon: 'refresh-cw', value: 'Diario', label: 'Precios actualizados' },
  ];

  constructor(
    private api: ApiService,
    private router: Router,
    private sanitizer: DomSanitizer,
  ) { }

  ngOnInit(): void {
    let pending = 3;
    const done = () => { if (--pending === 0) this.loading.set(false); };
    this.api.getCategories().subscribe({ next: c => this.categories.set(c), complete: done, error: done });
    this.api.getStores().subscribe({ next: s => this.stores.set(s), complete: done, error: done });
    this.api.getProducts().subscribe({ next: p => this.featuredProducts.set(p.slice(0, 8)), complete: done, error: done });
  }

  iconHtml(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(CATEGORY_META[name]?.svg ?? DEFAULT_SVG);
  }

  handleSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/buscar'], { queryParams: { q: this.searchQuery.trim() } });
    }
  }

  searchTerm(term: PopularTerm): void {
    this.router.navigate(['/buscar'], { queryParams: { q: term.query } });
  }

  searchCategory(name: string): void {
    this.router.navigate(['/buscar'], { queryParams: { categoria: name } });
  }

  selectMallStore(id: number): void {
    this.selectedMallStore.set(this.selectedMallStore() === id ? null : id);
  }

  viewProducts(store: Store): void {
    this.router.navigate(['/buscar'], { queryParams: { storeId: store.id } });
  }

}
