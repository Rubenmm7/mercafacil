import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { VendedorService } from '../../../services/vendedor.service';
import { Order, OrderStatus } from '../../../models/models';
import { IconComponent } from '../../icon/icon.component';

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

  constructor(private vendedorService: VendedorService, private router: Router) { }

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

  openChat(orderId: number): void {
    this.router.navigate(['/chat/order', orderId, 'VENDEDOR_REPARTIDOR']);
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
