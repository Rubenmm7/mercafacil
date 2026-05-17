import { Component, OnInit, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { VendedorService } from '../../../services/vendedor.service';
import { Order, OrderStatus } from '../../../models/models';
import { IconComponent } from '../../icon/icon.component';
import { formatMadridDateTime } from '../../../utils/date-time';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-vendedor-pedidos',
  standalone: true,
  imports: [DecimalPipe, IconComponent],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.css'
})
export class PedidosComponent implements OnInit {
  orders = signal<Order[]>([]);
  loading = signal(true);
  error = signal('');
  updating = signal<number | null>(null);
  expandedOrders = signal<Set<number>>(new Set());

  exportPeriod = signal<'today' | 'week' | 'all'>('today');

  readonly ordersForExport = computed(() => {
    const period = this.exportPeriod();
    const all = this.orders();
    if (period === 'all') return all;
    const now = new Date();
    const cutoff = new Date(now);
    if (period === 'today') {
      cutoff.setHours(0, 0, 0, 0);
    } else {
      cutoff.setDate(now.getDate() - 7);
      cutoff.setHours(0, 0, 0, 0);
    }
    return all.filter(o => o.createdAt && new Date(o.createdAt) >= cutoff);
  });

  readonly statusLabels: Record<OrderStatus, string> = {
    PENDIENTE: 'Pendiente',
    PREPARACION: 'En preparación',
    EN_RUTA: 'En ruta',
    ENTREGADO: 'Entregado',
    CANCELADO: 'Cancelado'
  };

  readonly nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
    PENDIENTE: 'PREPARACION'
  };

  readonly nextStatusLabel: Partial<Record<OrderStatus, string>> = {
    PENDIENTE: 'Iniciar preparación'
  };

  constructor(private vendedorService: VendedorService, private router: Router, private toastService: ToastService) { }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.vendedorService.getOrders().subscribe({
      next: list => { this.orders.set(list); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar pedidos'); this.loading.set(false); }
    });
  }

  advance(order: Order): void {
    const next = this.nextStatus[order.status];
    if (!next) return;
    this.updating.set(order.id);
    this.vendedorService.updateOrderStatus(order.id, next).subscribe({
      next: updated => {
        this.orders.update(list => list.map(o => o.id === updated.id ? updated : o));
        this.updating.set(null);
      },
      error: () => this.updating.set(null)
    });
  }

  toggleProducts(orderId: number): void {
    this.expandedOrders.update(set => {
      const next = new Set(set);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  openChat(orderId: number): void {
    this.router.navigate(['/chat/order', orderId, 'VENDEDOR_REPARTIDOR']);
  }

  formatDate(d?: string): string {
    return formatMadridDateTime(d);
  }

  exportCsv(): void {
    const orders = this.ordersForExport();
    const headers = ['ID', 'Cliente', 'Estado', 'Total (EUR)', 'Direccion', 'CP', 'Fecha creacion', 'Fecha entrega'];
    const rows = orders.map(o => [
      o.id,
      o.clientEmail ?? '',
      this.statusLabels[o.status] ?? o.status,
      o.total?.toFixed(2) ?? '0.00',
      (o.shippingAddress ?? '').replace(/,/g, ' '),
      o.postalCode ?? '',
      this.formatDate(o.createdAt),
      this.formatDate(o.deliveredAt)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos-${this.exportPeriod()}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.toastService.showMessage({ body: `CSV exportado: ${orders.length} pedidos` });
  }
}
