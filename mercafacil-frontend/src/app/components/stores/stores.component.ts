import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Store } from '../../models/models';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-stores',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './stores.component.html',
  styleUrl: './stores.component.css'
})
export class StoresComponent implements OnInit {
  readonly stores = signal<Store[]>([]);
  readonly loading = signal(true);
  readonly filterType = signal<string>('Todos');
  readonly searchStore = signal<string>('');

  filterTypes = ['Todos', 'Comida Rápida', 'Moda', 'Tecnología', 'Deporte', 'Mascotas'];

  readonly filteredStores = computed(() => {
    const type = this.filterType();
    const search = this.searchStore().toLowerCase();
    return this.stores().filter(s => {
      const matchesType = type === 'Todos'
        || (type === 'Tecnología' && (s.category === 'Tecnología' || s.category === 'Videojuegos'))
        || (type !== 'Tecnología' && s.category === type);
      const matchesSearch = s.name.toLowerCase().includes(search)
        || s.address.toLowerCase().includes(search);
      return matchesType && matchesSearch;
    });
  });

  constructor(private api: ApiService, private router: Router) { }

  ngOnInit(): void {
    this.api.getStores().subscribe({
      next: s => this.stores.set(s),
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  setFilterType(type: string): void {
    this.filterType.set(type);
  }

  onSearchInput(value: string): void {
    this.searchStore.set(value);
  }

  viewProducts(store: Store): void {
    this.router.navigate(['/buscar'], { queryParams: { storeId: store.id } });
  }

  getStars(rating: number): boolean[] {
    return [1, 2, 3, 4, 5].map(n => n <= Math.floor(rating));
  }
}
