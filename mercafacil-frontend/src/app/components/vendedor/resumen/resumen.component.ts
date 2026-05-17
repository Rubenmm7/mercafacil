import { Component, OnInit, signal, computed } from '@angular/core';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VendedorService } from '../../../services/vendedor.service';
import { StoreOfferDetail, VendedorStats, AnalyticsData } from '../../../models/models';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'app-vendedor-resumen',
  standalone: true,
  imports: [RouterLink, DecimalPipe, SlicePipe, IconComponent],
  templateUrl: './resumen.component.html',
  styleUrl: './resumen.component.css'
})
export class ResumenComponent implements OnInit {
  stats = signal<VendedorStats | null>(null);
  lowStock = signal<StoreOfferDetail[]>([]);
  loading = signal(true);
  error = signal('');

  period = signal<7 | 30>(7);
  analyticsData = signal<AnalyticsData | null>(null);
  analyticsLoading = signal(false);

  dailyBars = computed(() => {
    const daily = this.analyticsData()?.dailyOrders ?? [];
    const max = Math.max(...daily.map(d => d.orders), 1);
    return daily.map(d => ({
      date: d.date,
      orders: d.orders,
      heightPx: Math.max(Math.round((d.orders / max) * 80), 2)
    }));
  });

  productBars = computed(() => {
    const products = this.analyticsData()?.topProducts ?? [];
    const max = Math.max(...products.map(p => p.units), 1);
    return products.map(p => ({
      name: p.productName,
      units: p.units,
      widthPct: Math.round((p.units / max) * 100)
    }));
  });

  totalOrders = computed(() =>
    (this.analyticsData()?.dailyOrders ?? []).reduce((sum, d) => sum + d.orders, 0)
  );

  totalRevenue = computed(() =>
    (this.analyticsData()?.revenueByStore ?? []).reduce((sum, s) => sum + s.revenue, 0)
  );

  constructor(private vendedorService: VendedorService) { }

  ngOnInit(): void {
    this.vendedorService.getStats().subscribe({
      next: s => { this.stats.set(s); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar las estadísticas'); this.loading.set(false); }
    });
    this.vendedorService.getLowStockOffers().subscribe({
      next: list => this.lowStock.set(list)
    });
    this.loadAnalytics();
  }

  setPeriod(p: 7 | 30): void {
    this.period.set(p);
    this.loadAnalytics();
  }

  private loadAnalytics(): void {
    this.analyticsLoading.set(true);
    this.vendedorService.getAnalytics(this.period()).subscribe({
      next: d => { this.analyticsData.set(d); this.analyticsLoading.set(false); },
      error: () => { this.analyticsLoading.set(false); }
    });
  }
}
