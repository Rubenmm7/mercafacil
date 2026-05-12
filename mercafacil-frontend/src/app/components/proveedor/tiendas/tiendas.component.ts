import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProveedorService } from '../../../services/proveedor.service';
import { StoreWithLogo } from '../../../models/models';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'app-proveedor-tiendas',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './tiendas.component.html',
  styleUrl: './tiendas.component.css'
})
export class TiendasProveedorComponent implements OnInit {
  stores = signal<StoreWithLogo[]>([]);
  loading = signal(true);
  error = signal('');

  constructor(
    private proveedorService: ProveedorService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.proveedorService.getStores().subscribe({
      next: list => { this.stores.set(list); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar las tiendas'); this.loading.set(false); }
    });
  }

  openChat(storeId: number): void {
    this.router.navigate(['/chat/shop', storeId]);
  }
}
