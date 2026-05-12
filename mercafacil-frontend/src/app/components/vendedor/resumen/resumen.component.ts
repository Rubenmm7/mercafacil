import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VendedorService } from '../../../services/vendedor.service';
import { StoreOfferDetail, VendedorStats } from '../../../models/models';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'app-vendedor-resumen',
  standalone: true,
  imports: [RouterLink, DecimalPipe, IconComponent],
  templateUrl: './resumen.component.html',
  styleUrl: './resumen.component.css'
})
export class ResumenComponent implements OnInit {
  stats    = signal<VendedorStats | null>(null);
  lowStock = signal<StoreOfferDetail[]>([]);
  loading  = signal(true);
  error    = signal('');

  constructor(private vendedorService: VendedorService) {}

  ngOnInit(): void {
    this.vendedorService.getStats().subscribe({
      next: s => { this.stats.set(s); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar las estadísticas'); this.loading.set(false); }
    });
    this.vendedorService.getLowStockOffers().subscribe({
      next: list => this.lowStock.set(list)
    });
  }
}
