import { Component, OnInit, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { RepartidorService } from '../../../services/repartidor.service';
import { Order, OrderStatus } from '../../../models/models';

type Tab = 'mis' | 'disponibles';

@Component({
  selector: 'app-repartidor-entregas',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './entregas.component.html',
  styleUrl: './entregas.component.css'
})
export class EntregasComponent implements OnInit {
  myOrders       = signal<Order[]>([]);
  available      = signal<Order[]>([]);
  activeTab      = signal<Tab>('mis');
  loading        = signal(true);
  updating       = signal<number | null>(null);
  error          = signal('');

  shownOrders = computed(() =>
    this.activeTab() === 'mis' ? this.myOrders() : this.available()
  );

  readonly statusLabels: Record<OrderStatus, string> = {
    PENDIENTE:   'Pendiente',
    PREPARACION: 'En preparación',
    EN_RUTA:     'En ruta',
    ENTREGADO:   'Entregado'
  };

  readonly nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
    PREPARACION: 'EN_RUTA',
    EN_RUTA:     'ENTREGADO'
  };

  readonly nextStatusLabel: Partial<Record<OrderStatus, string>> = {
    PREPARACION: 'Recoger pedido',
    EN_RUTA:     'Marcar entregado'
  };

  constructor(private repartidorService: RepartidorService, private router: Router) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.repartidorService.getMyOrders().subscribe({
      next: list => {
        this.myOrders.set(list);
        this.repartidorService.getAvailableOrders().subscribe({
          next: avail => { this.available.set(avail); this.loading.set(false); },
          error: () => { this.loading.set(false); }
        });
      },
      error: () => { this.error.set('Error al cargar entregas'); this.loading.set(false); }
    });
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  accept(order: Order): void {
    this.updating.set(order.id);
    this.repartidorService.acceptOrder(order.id).subscribe({
      next: updated => {
        this.available.update(list => list.filter(o => o.id !== updated.id));
        this.myOrders.update(list => [updated, ...list]);
        this.updating.set(null);
        this.activeTab.set('mis');
      },
      error: () => { this.error.set('Error al aceptar entrega'); this.updating.set(null); }
    });
  }

  advance(order: Order): void {
    const next = this.nextStatus[order.status];
    if (!next) return;
    this.updating.set(order.id);
    this.repartidorService.updateOrderStatus(order.id, next).subscribe({
      next: updated => {
        this.myOrders.update(list => list.map(o => o.id === updated.id ? updated : o));
        this.updating.set(null);
      },
      error: () => { this.error.set('Error al actualizar estado'); this.updating.set(null); }
    });
  }

  openClientChat(orderId: number): void {
    this.router.navigate(['/chat/order', orderId, 'CLIENTE_REPARTIDOR']);
  }

  openVendedorChat(orderId: number): void {
    this.router.navigate(['/chat/order', orderId, 'VENDEDOR_REPARTIDOR']);
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
