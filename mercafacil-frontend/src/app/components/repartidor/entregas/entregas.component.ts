import { Component, OnInit, OnDestroy, signal, computed, effect, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { RepartidorService } from '../../../services/repartidor.service';
import { TrackingService } from '../../../services/tracking.service';
import { AuthService } from '../../../services/auth.service';
import { MapsLoaderService } from '../../../services/maps-loader.service';
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
  simulatingOrderId = signal<number | null>(null);
  simPosition = signal<{ lat: number; lng: number } | null>(null);
  mapsLoaded = signal(false);
  geocodedDestinations = signal<Record<number, { lat: number; lng: number }>>({});
  openRouteOrderId = signal<number | null>(null);

  shownOrders = computed(() =>
    this.activeTab() === 'mis' ? this.myOrders() : this.available()
  );

  openRouteOrder = computed(() => {
    const id = this.openRouteOrderId();
    if (id === null) return null;
    return [...this.myOrders(), ...this.available()].find(o => o.id === id) ?? null;
  });

  readonly statusLabels: Record<OrderStatus, string> = {
    PENDIENTE: 'Pendiente',
    PREPARACION: 'En preparación',
    EN_RUTA: 'En ruta',
    ENTREGADO: 'Entregado',
    CANCELADO: 'Cancelado'
  };

  readonly nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
    PENDIENTE: 'EN_RUTA',
    PREPARACION: 'EN_RUTA',
    EN_RUTA: 'ENTREGADO'
  };

  readonly nextStatusLabel: Partial<Record<OrderStatus, string>> = {
    PENDIENTE: 'Salir a entregar',
    PREPARACION: 'Recoger pedido',
    EN_RUTA: 'Marcar entregado'
  };

  private simInterval: ReturnType<typeof setInterval> | null = null;
  private readonly MALL_LAT = 37.7906159;
  private readonly MALL_LNG = -3.7740386;

  constructor(
    private repartidorService: RepartidorService,
    private trackingService: TrackingService,
    private authService: AuthService,
    private router: Router,
    private mapsLoader: MapsLoaderService
  ) {
    effect(() => {
      const myOrders = this.myOrders();
      const available = this.available();
      const loaded = this.mapsLoaded();
      if (!loaded) return;
      untracked(() => {
        // Si ya tenemos coordenadas guardadas, las usamos directamente sin llamar al geocoder
      const withCoords = [
        ...myOrders.filter(o => o.status === 'PREPARACION'),
        ...available,
      ].filter(o => o.deliveryLat != null && o.deliveryLng != null && !this.geocodedDestinations()[o.id]);
      withCoords.forEach(o => this.geocodedDestinations.update(prev => ({
        ...prev, [o.id]: { lat: o.deliveryLat!, lng: o.deliveryLng! }
      })));

      const toGeocode = [
        ...myOrders.filter(o => o.status === 'PREPARACION'),
        ...available,
      ].filter(o => o.shippingAddress && o.deliveryLat == null && !this.geocodedDestinations()[o.id]);
      toGeocode.forEach(o => this.geocodeAddress(o.id, o.shippingAddress!));
      });
    });
  }

  ngOnInit(): void {
    this.loadAll();
    this.mapsLoader.load().then(ok => this.mapsLoaded.set(ok));
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
        if (enRuta && this.simulatingOrderId() === null) this.startSimulation(enRuta.id, enRuta.shippingAddress, enRuta.deliveryLat, enRuta.deliveryLng);
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
        if (updated.status === 'EN_RUTA') this.startSimulation(updated.id, updated.shippingAddress, updated.deliveryLat, updated.deliveryLng);
        if (updated.status === 'ENTREGADO') this.stopSimulation();
      },
      error: () => { this.error.set('Error al actualizar estado'); this.updating.set(null); }
    });
  }

  openVendedorChat(orderId: number): void {
    this.router.navigate(['/chat/order', orderId, 'VENDEDOR_REPARTIDOR']);
  }

  openClienteChat(orderId: number): void {
    this.router.navigate(['/chat/order', orderId, 'CLIENTE_REPARTIDOR']);
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  private startSimulation(orderId: number, shippingAddress?: string, deliveryLat?: number, deliveryLng?: number): void {
    this.stopSimulation();
    if (!this.authService.getToken()) return;

    this.simulatingOrderId.set(orderId);
    this.simPosition.set({ lat: this.MALL_LAT, lng: this.MALL_LNG });

    const launchRoute = (destLat: number, destLng: number) => {
      const startLat = this.MALL_LAT;
      const startLng = this.MALL_LNG;
      const totalSteps = 20; // 20 ticks × 4 s ≈ 80 s de entrega simulada
      let step = 0;
      // Envío inmediato del punto de partida para sobreescribir datos obsoletos en BD
      this.trackingService.sendLocation(orderId, startLat, startLng).subscribe({ error: () => { } });
      this.simInterval = setInterval(() => {
        step++;
        const t = Math.min(step / totalSteps, 1);
        const curLat = startLat + (destLat - startLat) * t + (Math.random() - 0.5) * 0.0002;
        const curLng = startLng + (destLng - startLng) * t + (Math.random() - 0.5) * 0.0002;
        this.simPosition.set({ lat: curLat, lng: curLng });
        this.trackingService.sendLocation(orderId, curLat, curLng).subscribe({ error: () => { } });
      }, 4000);
    };

    const fallback = () => {
      launchRoute(
        this.MALL_LAT + (Math.random() - 0.5) * 0.04,
        this.MALL_LNG + (Math.random() - 0.5) * 0.04
      );
    };

    if (deliveryLat != null && deliveryLng != null) {
      launchRoute(deliveryLat, deliveryLng);
    } else if (shippingAddress && typeof google !== 'undefined' && google?.maps?.Geocoder) {
      new google.maps.Geocoder().geocode({ address: shippingAddress }, (results: any, status: any) => {
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          launchRoute(results[0].geometry.location.lat(), results[0].geometry.location.lng());
        } else {
          fallback();
        }
      });
    } else {
      fallback();
    }
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

  private geocodeAddress(orderId: number, address: string): void {
    if (typeof google === 'undefined' || !google?.maps?.Geocoder) return;
    new google.maps.Geocoder().geocode({ address }, (results: any, status: any) => {
      if (status === 'OK' && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        this.geocodedDestinations.update(prev => ({ ...prev, [orderId]: { lat: loc.lat(), lng: loc.lng() } }));
      }
    });
  }

  openRouteModal(orderId: number): void {
    this.openRouteOrderId.set(orderId);
  }

  closeRouteModal(): void {
    this.openRouteOrderId.set(null);
  }

  routeUrl(order: Order): string {
    const origin = `${this.MALL_LAT},${this.MALL_LNG}`;
    const dest = (order.deliveryLat != null && order.deliveryLng != null)
      ? `${order.deliveryLat},${order.deliveryLng}`
      : encodeURIComponent(`${order.shippingAddress ?? ''}, España`);
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`;
  }

  mapsNavUrl(order: Order): string {
    const dest = (order.deliveryLat != null && order.deliveryLng != null)
      ? `${order.deliveryLat},${order.deliveryLng}`
      : encodeURIComponent(`${order.shippingAddress ?? ''}, España`);
    return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
  }
}
