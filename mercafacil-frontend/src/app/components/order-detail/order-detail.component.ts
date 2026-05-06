import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { TrackingService } from '../../services/tracking.service';
import { Order, OrderStatus, TrackingPosition } from '../../models/models';
import { LiveMapComponent } from '../live-map/live-map.component';

interface TimelineStep {
  key: OrderStatus;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, DecimalPipe, LiveMapComponent],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css'
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly tracking = signal<TrackingPosition | null>(null);
  readonly trackingLoading = signal(false);

  private readonly timeline: TimelineStep[] = [
    { key: 'PENDIENTE',   title: 'Pedido confirmado',  desc: 'Tu compra fue registrada correctamente.' },
    { key: 'PREPARACION', title: 'En preparación',     desc: 'La tienda está preparando tu pedido.' },
    { key: 'EN_RUTA',     title: 'En ruta',            desc: 'El repartidor va camino a la entrega.' },
    { key: 'ENTREGADO',   title: 'Entregado',          desc: 'Pedido entregado con éxito.' }
  ];

  private trackingSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private authService: AuthService,
    private trackingService: TrackingService
  ) {}

  ngOnInit(): void {
    const orderId = Number(this.route.snapshot.paramMap.get('id'));
    if (!orderId || Number.isNaN(orderId)) {
      this.error.set('ID de pedido inválido.');
      this.loading.set(false);
      return;
    }
    this.loadOrder(orderId);
  }

  ngOnDestroy(): void {
    this.trackingSub?.unsubscribe();
    this.trackingService.disconnect();
  }

  loadOrder(orderId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getMyOrderById(orderId).subscribe({
      next: order => {
        this.order.set(order);
        this.loading.set(false);
        this.connectTracking(order.id);
      },
      error: () => {
        this.error.set('No pudimos cargar el pedido o no tienes permiso para verlo.');
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/pedidos']);
  }

  navigateToChat(): void {
    const orderId = this.order()?.id;
    if (!orderId) return;
    this.router.navigate(['/chat/order', orderId, 'CLIENTE_REPARTIDOR']);
  }

  timelineSteps(): TimelineStep[] {
    return this.timeline;
  }

  isDone(step: OrderStatus): boolean {
    const current = this.order()?.status;
    if (!current) return false;
    return this.timelineIndex(step) <= this.timelineIndex(current);
  }

  isCurrent(step: OrderStatus): boolean {
    return this.order()?.status === step;
  }

  statusLabel(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      PENDIENTE:   'Pendiente',
      PREPARACION: 'En preparación',
      EN_RUTA:     'En ruta',
      ENTREGADO:   'Entregado'
    };
    return map[status] ?? status;
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    return new Date(value).toLocaleString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  private timelineIndex(status: OrderStatus): number {
    return this.timeline.findIndex(step => step.key === status);
  }

  private connectTracking(orderId: number): void {
    this.loadLastTracking(orderId);
    const token = this.authService.getToken();
    if (!token) return;

    if (this.trackingService.isConnected()) {
      this.subscribeTracking(orderId);
    } else {
      this.trackingService.connect(token)
        .then(() => this.subscribeTracking(orderId))
        .catch(() => {});
    }
  }

  private loadLastTracking(orderId: number): void {
    this.trackingLoading.set(true);
    this.trackingService.getLastLocation(orderId).subscribe({
      next:  pos => { this.tracking.set(pos); this.trackingLoading.set(false); },
      error: ()  => { this.trackingLoading.set(false); }
    });
  }

  private subscribeTracking(orderId: number): void {
    this.trackingSub?.unsubscribe();
    this.trackingSub = this.trackingService.subscribeToOrder(orderId).subscribe(pos => {
      this.tracking.set(pos);
      this.trackingLoading.set(false);
    });
  }
}
