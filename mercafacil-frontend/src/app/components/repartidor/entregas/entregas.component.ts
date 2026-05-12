import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { RepartidorService } from '../../../services/repartidor.service';
import { TrackingService } from '../../../services/tracking.service';
import { AuthService } from '../../../services/auth.service';
import { Order, OrderStatus } from '../../../models/models';
import { LiveMapComponent } from '../../live-map/live-map.component';
import { IconComponent } from '../../icon/icon.component';

type Tab = 'mis' | 'disponibles';

@Component({
  selector: 'app-repartidor-entregas',
  standalone: true,
  imports: [DecimalPipe, LiveMapComponent, IconComponent],
  templateUrl: './entregas.component.html',
  styleUrl: './entregas.component.css'
})
export class EntregasComponent implements OnInit, OnDestroy {
  myOrders = signal<Order[]>([]);
  available = signal<Order[]>([]);
  activeTab = signal<Tab>('mis');
  loading = signal(true);
  updating = signal<number | null>(null);
  error = signal('');
  // ID del pedido cuya simulación GPS está activa
  simulatingOrderId = signal<number | null>(null);
  // Última posición enviada por la simulación (refleja la ubicación del repartidor en tiempo real en el mapa)
  simPosition = signal<{ lat: number; lng: number } | null>(null);

  shownOrders = computed(() =>
    this.activeTab() === 'mis' ? this.myOrders() : this.available()
  );

  readonly statusLabels: Record<OrderStatus, string> = {
    PENDIENTE: 'Pendiente',
    PREPARACION: 'En preparación',
    EN_RUTA: 'En ruta',
    ENTREGADO: 'Entregado'
  };

  readonly nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
    PREPARACION: 'EN_RUTA',
    EN_RUTA: 'ENTREGADO'
  };

  readonly nextStatusLabel: Partial<Record<OrderStatus, string>> = {
    PREPARACION: 'Recoger pedido',
    EN_RUTA: 'Marcar entregado'
  };

  // Coordenadas actuales de la simulación (se van actualizando con cada tick)
  private simInterval: ReturnType<typeof setInterval> | null = null;
  private simLat = 40.4168;
  private simLng = -3.7038;

  constructor(
    private repartidorService: RepartidorService,
    private trackingService: TrackingService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.stopSimulation();
  }

  loadAll(): void {
    this.loading.set(true);
    forkJoin({
      my: this.repartidorService.getMyOrders(),
      avail: this.repartidorService.getAvailableOrders()
    }).subscribe({
      next: ({ my, avail }) => {
        this.myOrders.set(my);
        this.available.set(avail);
        this.loading.set(false);
        const enRuta = my.find(o => o.status === 'EN_RUTA');
        if (enRuta && this.simulatingOrderId() === null) this.startSimulation(enRuta.id);
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
        // Al pasar a EN_RUTA arranca la simulación GPS; al entregarlo la detiene
        if (updated.status === 'EN_RUTA') this.startSimulation(updated.id);
        if (updated.status === 'ENTREGADO') this.stopSimulation();
      },
      error: () => { this.error.set('Error al actualizar estado'); this.updating.set(null); }
    });
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

  // Inicia la simulación GPS para el pedido: envía coordenadas cada 4 segundos
  private startSimulation(orderId: number): void {
    this.stopSimulation();
    const token = this.authService.getToken();
    if (!token) return;

    // Punto de partida aleatorio cerca del centro de Madrid
    this.simLat = 40.4168 + (Math.random() - 0.5) * 0.01;
    this.simLng = -3.7038 + (Math.random() - 0.5) * 0.01;
    this.simulatingOrderId.set(orderId);
    this.simPosition.set({ lat: this.simLat, lng: this.simLng });

    this.simInterval = setInterval(() => {
      // Desplazamiento aleatorio de ~50-100 m por tick
      this.simLat += (Math.random() - 0.5) * 0.001;
      this.simLng += (Math.random() - 0.5) * 0.001;
      this.simPosition.set({ lat: this.simLat, lng: this.simLng });
      this.trackingService.sendLocation(orderId, this.simLat, this.simLng)
        .subscribe({ error: () => { } });
    }, 4000);
  }

  // Detiene la simulación GPS y limpia el intervalo
  private stopSimulation(): void {
    if (this.simInterval !== null) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }
    this.simulatingOrderId.set(null);
    this.simPosition.set(null);
  }

  mapsNavUrl(order: Order): string {
    const dest = encodeURIComponent(order.shippingAddress ?? '');
    return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
  }
}
