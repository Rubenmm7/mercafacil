import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Store } from '../../models/models';

@Component({
  selector: 'app-stores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stores.component.html',
  styleUrl: './stores.component.css'
})
export class StoresComponent implements OnInit {
  stores: Store[] = [];
  filterType = 'Todos';
  searchStore = '';
  filterTypes = ['Todos', 'Supermercado', 'Hipermercado', 'Gran Almacén'];

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.api.getStores().subscribe(s => this.stores = s);
  }

  get filteredStores(): Store[] {
    return this.stores.filter(s => {
      const matchesType = this.filterType === 'Todos' || s.category === this.filterType;
      const matchesSearch = s.name.toLowerCase().includes(this.searchStore.toLowerCase())
        || s.address.toLowerCase().includes(this.searchStore.toLowerCase());
      return matchesType && matchesSearch;
    });
  }

  viewProducts(storeName: string): void {
    this.router.navigate(['/buscar'], { queryParams: { tienda: storeName } });
  }

  getStars(rating: number): boolean[] {
    return [1, 2, 3, 4, 5].map(n => n <= Math.floor(rating));
  }
}
