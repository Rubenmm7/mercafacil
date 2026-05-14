import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { ToastService } from '../../services/toast.service';
import { Order, OrderStatus } from '../../models/models';
import { IconComponent } from '../icon/icon.component';
import { formatMadridDateTime } from '../../utils/date-time';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DecimalPipe, IconComponent],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly errorMsg = signal<string | null>(null);
  readonly showHistory = signal(false);

  private readonly notificationService = inject(NotificationService);

  readonly activeOrders = computed(() =>
    this.orders().filter(o => o.status !== 'ENTREGADO' && o.status !== 'CANCELADO')
  );
  readonly historyOrders = computed(() =>
    this.orders().filter(o => o.status === 'ENTREGADO' || o.status === 'CANCELADO')
  );

  private readonly statusLabels: Record<OrderStatus, string> = {
    PENDIENTE: 'Pendiente',
    PREPARACION: 'En preparación',
    EN_RUTA: 'En ruta',
    ENTREGADO: 'Entregado',
    CANCELADO: 'Cancelado'
  };

  constructor(
    private api: ApiService,
    private router: Router,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.api.getMyOrders().subscribe({
      next: orders => { this.orders.set(orders); this.loading.set(false); },
      error: (_error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMsg.set('No se pudieron cargar tus pedidos. Inténtalo de nuevo.');
      }
    });
  }

  statusLabel(status: OrderStatus): string {
    return this.statusLabels[status] ?? status;
  }

  formatDate(createdAt: string | undefined): string {
    return formatMadridDateTime(createdAt);
  }

  unreadForOrder(orderId: number): number {
    return this.notificationService.unreadCounts().get(`order-${orderId}-CLIENTE_REPARTIDOR`) ?? 0;
  }

  openChat(orderId: number): void {
    this.router.navigate(['/chat/order', orderId, 'CLIENTE_REPARTIDOR']);
  }

  toggleHistory(): void {
    this.showHistory.update(v => !v);
  }

  async cancelOrder(order: Order): Promise<void> {
    const ok = await this.toast.confirm(
      `¿Cancelar el pedido #${order.id}? Esta acción no se puede deshacer.`,
      'Cancelar pedido'
    );
    if (!ok) return;

    this.api.cancelOrder(order.id).subscribe({
      next: () => {
        this.orders.update(list =>
          list.map(o => o.id === order.id ? { ...o, status: 'CANCELADO' as OrderStatus } : o)
        );
      },
      error: () => this.toast.showError('No se pudo cancelar el pedido. Inténtalo de nuevo.')
    });
  }

  goToSearch(): void {
    this.router.navigate(['/buscar']);
  }

  openDetail(orderId: number): void {
    this.router.navigate(['/pedidos', orderId]);
  }
}
