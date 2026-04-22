import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Product, Store, Category } from '../../models/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  searchQuery = '';
  categories: Category[] = [];
  stores: Store[] = [];
  featuredProducts: Product[] = [];
  popularTerms = ['Aceite de Oliva', 'Aceitunas', 'Pan', 'Naranjas', 'Chorizo'];

  heroImg = 'https://images.unsplash.com/photo-1741515042519-9b52d3ec2eaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80';
  oliveImg = 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80';
  fruitImg = 'https://images.unsplash.com/photo-1547514701-42782101795e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80';
  breadImg = 'https://images.unsplash.com/photo-1767065885755-58ee6202ae74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80';

  stats = [
    { value: '5', label: 'Supermercados' },
    { value: '+5.000', label: 'Productos' },
    { value: 'Jaén', label: 'Cobertura' },
    { value: 'Diario', label: 'Actualización' }
  ];

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.api.getCategories().subscribe(c => this.categories = c);
    this.api.getStores().subscribe(s => this.stores = s);
    this.api.getProducts().subscribe(p => this.featuredProducts = p.slice(0, 4));
  }

  handleSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/buscar'], { queryParams: { q: this.searchQuery.trim() } });
    }
  }

  searchTerm(term: string): void {
    this.router.navigate(['/buscar'], { queryParams: { q: term } });
  }

  searchCategory(name: string): void {
    this.router.navigate(['/buscar'], { queryParams: { categoria: name } });
  }

  getMinPrice(product: Product): number {
    return Math.min(...product.storeOffers.filter(o => o.inStock).map(o => o.price));
  }

  getMaxPrice(product: Product): number {
    return Math.max(...product.storeOffers.filter(o => o.inStock).map(o => o.price));
  }

  getAvailableCount(product: Product): number {
    return product.storeOffers.filter(o => o.inStock).length;
  }

  goToSearch(): void {
    this.router.navigate(['/buscar']);
  }
}
