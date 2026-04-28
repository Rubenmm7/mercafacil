import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Order, OrderStatus } from '../../models/models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly errorMsg = signal<string | null>(null);

  private readonly statusLabels: Record<OrderStatus, string> = {
    PENDIENTE: 'Pendiente',
    PREPARACION: 'En preparación',
    EN_RUTA: 'En ruta',
    ENTREGADO: 'Entregado'
  };

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.api.getMyOrders().subscribe({
      next: orders => {
        this.orders.set(orders);
        this.loading.set(false);
      },
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
    if (!createdAt) return '—';
    return new Date(createdAt).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  openChat(orderId: number): void {
    this.router.navigate(['/chat/order', orderId, 'CLIENTE_REPARTIDOR']);
  }

  goToSearch(): void {
    this.router.navigate(['/buscar']);
  }
}
