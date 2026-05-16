import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { AnalyticsData } from '../../../models/models';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [SlicePipe, DecimalPipe],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AdminAnalyticsComponent implements OnInit {
  private adminService = inject(AdminService);

  period = signal<7 | 30>(7);
  data = signal<AnalyticsData | null>(null);
  loading = signal(true);

  dailyBars = computed(() => {
    const daily = this.data()?.dailyOrders ?? [];
    const max = Math.max(...daily.map(d => d.orders), 1);
    return daily.map(d => ({
      date: d.date,
      orders: d.orders,
      heightPct: Math.round((d.orders / max) * 100)
    }));
  });

  productBars = computed(() => {
    const products = this.data()?.topProducts ?? [];
    const max = Math.max(...products.map(p => p.units), 1);
    return products.map(p => ({
      name: p.productName,
      units: p.units,
      widthPct: Math.round((p.units / max) * 100)
    }));
  });

  revenueBars = computed(() => {
    const stores = this.data()?.revenueByStore ?? [];
    const max = Math.max(...stores.map(s => s.revenue), 1);
    return stores.map(s => ({
      name: s.storeName,
      revenue: s.revenue,
      widthPct: Math.round((s.revenue / max) * 100)
    }));
  });

  totalOrders = computed(() =>
    (this.data()?.dailyOrders ?? []).reduce((sum, d) => sum + d.orders, 0)
  );

  totalRevenue = computed(() =>
    (this.data()?.revenueByStore ?? []).reduce((sum, s) => sum + s.revenue, 0)
  );

  ngOnInit() {
    this.loadData();
  }

  setPeriod(p: 7 | 30) {
    this.period.set(p);
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);
    this.adminService.getAnalytics(this.period()).subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }
}
