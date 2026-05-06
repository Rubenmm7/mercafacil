import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { TrackingService } from '../../services/tracking.service';
import { AuthService } from '../../services/auth.service';
import { Order, OrderStatus, TrackingPosition } from '../../models/models';
import { LiveMapComponent } from '../live-map/live-map.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DecimalPipe, LiveMapComponent],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit, OnDestroy {
  readonly orders      = signal<Order[]>([]);
  readonly loading     = signal(true);
  readonly errorMsg    = signal<string | null>(null);

  readonly trackingOrderId  = signal<number | null>(null);
  readonly trackingPosition = signal<TrackingPosition | null>(null);
  readonly trackingLoading  = signal(false);

  private trackingSub: Subscription | null = null;

  private readonly statusLabels: Record<OrderStatus, string> = {
    PENDIENTE:   'Pendiente',
    PREPARACION: 'En preparación',
    EN_RUTA:     'En ruta',
    ENTREGADO:   'Entregado'
  };

  constructor(
    private api: ApiService,
    private trackingService: TrackingService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.closeTracking();
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
    if (!createdAt) return '—';
    return new Date(createdAt).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  formatTrackingDate(ts: string | undefined): string {
    if (!ts) return '—';
    return new Date(ts).toLocaleTimeString('es-ES', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  openChat(orderId: number): void {
    this.router.navigate(['/chat/order', orderId, 'CLIENTE_REPARTIDOR']);
  }

  goToSearch(): void {
    this.router.navigate(['/buscar']);
  }

  openDetail(orderId: number): void {
    this.router.navigate(['/pedidos', orderId]);
  }

  openTracking(orderId: number): void {
    this.trackingOrderId.set(orderId);
    this.trackingPosition.set(null);
    this.trackingLoading.set(true);

    this.trackingService.getLastLocation(orderId).subscribe({
      next: pos  => { this.trackingPosition.set(pos); this.trackingLoading.set(false); },
      error: ()  => { this.trackingLoading.set(false); }
    });

    const token = this.authService.getToken();
    if (!token) return;

    const doSubscribe = () => {
      this.trackingSub = this.trackingService.subscribeToOrder(orderId).subscribe(pos => {
        this.trackingPosition.set(pos);
      });
    };

    if (this.trackingService.isConnected()) {
      doSubscribe();
    } else {
      this.trackingService.connect(token).then(doSubscribe);
    }
  }

  closeTracking(): void {
    this.trackingSub?.unsubscribe();
    this.trackingSub = null;
    this.trackingService.disconnect();
    this.trackingOrderId.set(null);
    this.trackingPosition.set(null);
  }
}
