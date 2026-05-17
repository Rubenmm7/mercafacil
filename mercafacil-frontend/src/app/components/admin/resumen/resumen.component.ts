import { Component, OnInit, signal, computed } from '@angular/core';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { AdminStats, AnalyticsData } from '../../../models/models';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'app-admin-resumen',
  standalone: true,
  imports: [IconComponent, DecimalPipe, SlicePipe],
  templateUrl: './resumen.component.html',
  styleUrl: './resumen.component.css'
})
export class ResumenAdminComponent implements OnInit {
  stats = signal<AdminStats | null>(null);
  loading = signal(true);
  error = signal('');

  period = signal<7 | 30>(7);
  analyticsData = signal<AnalyticsData | null>(null);
  analyticsLoading = signal(true);

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

  revenueBars = computed(() => {
    const stores = this.analyticsData()?.revenueByStore ?? [];
    const max = Math.max(...stores.map(s => s.revenue), 1);
    return stores.map(s => ({
      name: s.storeName,
      revenue: s.revenue,
      widthPct: Math.round((s.revenue / max) * 100)
    }));
  });

  totalOrders = computed(() =>
    (this.analyticsData()?.dailyOrders ?? []).reduce((sum, d) => sum + d.orders, 0)
  );

  totalRevenue = computed(() =>
    (this.analyticsData()?.revenueByStore ?? []).reduce((sum, s) => sum + s.revenue, 0)
  );

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getStats().subscribe({
      next: s => { this.stats.set(s); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar las estadísticas'); this.loading.set(false); }
    });
    this.loadAnalytics();
  }

  setPeriod(p: 7 | 30) {
    this.period.set(p);
    this.loadAnalytics();
  }

  private loadAnalytics() {
    this.analyticsLoading.set(true);
    this.adminService.getAnalytics(this.period()).subscribe({
      next: d => { this.analyticsData.set(d); this.analyticsLoading.set(false); },
      error: () => { this.analyticsLoading.set(false); }
    });
  }
}
