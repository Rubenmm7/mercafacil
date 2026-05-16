import { Component, OnInit, OnDestroy, signal, computed, effect, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { RepartidorService } from '../../../services/repartidor.service';
import { TrackingService } from '../../../services/tracking.service';
import { AuthService } from '../../../services/auth.service';
import { MapsLoaderService } from '../../../services/maps-loader.service';
import { Order, OrderStatus } from '../../../models/models';
import { LiveMapComponent } from '../../live-map/live-map.component';
import { IconComponent } from '../../icon/icon.component';
import { formatMadridDateTime } from '../../../utils/date-time';

// Tipo de pestaña que define cuáles entregas ver: las asignadas al repartidor o las disponibles.
type Tab = 'mis' | 'disponibles';

/**
 * Componente de entregas del repartidor.
 * 
 * Responsabilidades:
 * - Mostrar entregas asignadas y disponibles con cambio de pestaña.
 * - Aceptar entregas disponibles.
 * - Avanzar el estado de una entrega (PENDIENTE -> EN_RUTA -> ENTREGADO).
 * - Conectar con WebSocket para recibir la ubicación GPS en tiempo real cuando está EN_RUTA.
 * - Calcular y mostrar rutas usando Google Maps Directions API.
 * - Permitir chat con cliente y vendedor por pedido.
 */

@Component({
  selector: 'app-repartidor-entregas',
  standalone: true,
  imports: [DecimalPipe, LiveMapComponent, IconComponent],
  templateUrl: './entregas.component.html',
  styleUrl: './entregas.component.css'
})

export class EntregasComponent implements OnInit, OnDestroy {
  // Entregas asignadas al repartidor autenticado.
  myOrders = signal<Order[]>([]);
  
  // Entregas disponibles que el repartidor puede aceptar.
  available = signal<Order[]>([]);
  
  // Pestaña actualmente visible: 'mis' (entregas asignadas) o 'disponibles'.
  activeTab = signal<Tab>('mis');
  
  // Indica si se está cargando la lista inicial de entregas.
  loading = signal(true);
  
  // ID de la entrega que se está actualizando. null si ninguna se está actualizando.
  // Se usa para deshabilitar botones mientras hay una petición en progreso.
  updating = signal<number | null>(null);
  
  // Mensaje de error para mostrar al usuario (vacío si no hay error).
  error = signal('');
  
  // Última posición GPS conocida del repartidor (cuando está EN_RUTA).
  // Incluye latitud y longitud. null si no hay posición.
  trackingPosition = signal<{ lat: number; lng: number } | null>(null);
  
  // Indica si el script de Google Maps se cargó correctamente.
  // Se usa para mostrar/ocultar mapas según disponibilidad de la API.
  mapsLoaded = signal(false);
  
  /**
   * Caché de coordenadas ya geocodificadas por ID de entrega.
   * Evita geocodificar varias veces la misma dirección.
   */
  geocodedDestinations = signal<Record<number, { lat: number; lng: number }>>({});
  
  /**
   * Rutas de vista previa (array de puntos) para cada entrega.
   * Se carga cuando el usuario abre el modal de ruta.
   * Clave: orderId, valor: array de coordenadas.
   */
  routePreviewPaths = signal<Record<number, { lat: number; lng: number }[]>>({});
  
  // ID de la entrega cuya ruta se está visualizando en el modal.
  // null si ningún modal está abierto.
  openRouteOrderId = signal<number | null>(null);

  /**
   * Entregas visibles actualmente según la pestaña activa.
   * Se recalcula automáticamente cuando cambia activeTab, myOrders o available.
   */
  shownOrders = computed(() =>
    this.activeTab() === 'mis' ? this.myOrders() : this.available()
  );

  /**
   * Entrega cuya ruta se está mostrando en el modal.
   * Se obtiene buscando el orden con ID = openRouteOrderId() en la lista de todas las entregas.
   * Devuelve null si no hay modal abierto o no se encuentra la entrega.
   */
  openRouteOrder = computed(() => {
    const id = this.openRouteOrderId();
    if (id === null) return null;
    return [...this.myOrders(), ...this.available()].find(o => o.id === id) ?? null;
  });

  // Etiquetas legibles para cada estado de entrega.
  // Se usa en la plantilla para mostrar al usuario el estado actual.
  readonly statusLabels: Record<OrderStatus, string> = {
    PENDIENTE: 'Pendiente',
    PREPARACION: 'En preparación',
    EN_RUTA: 'En ruta',
    ENTREGADO: 'Entregado',
    CANCELADO: 'Cancelado'
  };

  // Mapa de transiciones de estado permitidas.
  // Define a qué estado pasar cuando el repartidor avanza una entrega.
  readonly nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
    PENDIENTE: 'EN_RUTA',
    PREPARACION: 'EN_RUTA',
    EN_RUTA: 'ENTREGADO'
  };

  // Etiquetas de botón correspondientes a cada transición de estado.
  // Se muestra en el botón de acción para que el usuario entienda qué sucederá.
  readonly nextStatusLabel: Partial<Record<OrderStatus, string>> = {
    PENDIENTE: 'Salir a entregar',
    PREPARACION: 'Recoger pedido',
    EN_RUTA: 'Marcar entregado'
  };

  // Suscripción activa al stream de posición GPS en tiempo real.
  // Se crea cuando se conecta al tracking y se cancela cuando la entrega se entrega o se desconecta.
  private trackingSub: Subscription | null = null;
  private estadoSub: Subscription | null = null;
  
  // Coordenadas del centro comercial (punto de origen de todas las entregas).
  // Ubicación: Paraje de las Lagunillas, 23009 Jaén.
  private readonly MALL_LAT = 37.7906159;
  private readonly MALL_LNG = -3.7740386;

  /**
   * Constructor que inyecta servicios y configura el efecto reactivo de geocodificación.
   * 
   * El effect se ejecuta cada vez que cambien myOrders, available o mapsLoaded.
   * Automatiza la geocodificación de direcciones sin coordenadas y cachea resultados.
   */
  constructor(
    private repartidorService: RepartidorService,
    private trackingService: TrackingService,
    private authService: AuthService,
    private router: Router,
    private mapsLoader: MapsLoaderService
  ) {
    /**
     * Efecto que geocodifica automáticamente direcciones de entregas cuando es necesario.
     * - Primero: cachea las entregas que ya tienen coordenadas (deliveryLat/Lng).
     * - Luego: geocodifica las que tienen dirección de envío pero sin coordenadas.
     * Solo se ejecuta si Google Maps está cargado.
     */
    effect(() => {
      const myOrders = this.myOrders();
      const available = this.available();
      const loaded = this.mapsLoaded();
      if (!loaded) return;
      untracked(() => {
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

  /**
   * Hook del ciclo de vida: se ejecuta al montar el componente.
   * Carga las entregas asignadas y disponibles, e inicia la carga de Google Maps de forma asincrónica.
   */
  ngOnInit(): void {
    this.loadAll();
    this.mapsLoader.load().then(ok => this.mapsLoaded.set(ok));
  }

  /**
   * Hook del ciclo de vida: se ejecuta al desmontar el componente.
   * Cancela la suscripción al tracking GPS y desconecta el WebSocket.
   */
  ngOnDestroy(): void {
    this.trackingSub?.unsubscribe();
    this.estadoSub?.unsubscribe();
    this.trackingService.disconnect();
  }

  /**
   * Carga las entregas asignadas y disponibles de forma paralela.
   * Si hay alguna entrega EN_RUTA, conecta automáticamente al WebSocket de tracking.
   * Actualiza el estado de carga y muestra errores si es necesario.
   */
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
        if (enRuta) this.connectTracking(enRuta.id);
      },
      error: () => { this.error.set('Error al cargar entregas'); this.loading.set(false); }
    });
  }

  // Cambia la pestaña visible entre 'mis' entregas y 'disponibles'.
  setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  /**
   * Acepta una entrega disponible:
   * - La elimina de la lista de disponibles.
   * - La añade a las entregas asignadas (mis entregas).
   * - Cambia automáticamente a la pestaña 'mis'.
   */
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

  /**
   * Avanza una entrega al siguiente estado (según nextStatus).
   * - Si se pasa a EN_RUTA: conecta al tracking GPS y envía la ruta al backend.
   * - Si se pasa a ENTREGADO: detiene el tracking y desconecta el WebSocket.
   */
  advance(order: Order): void {
    const next = this.nextStatus[order.status];
    if (!next) return;
    this.updating.set(order.id);
    this.repartidorService.updateOrderStatus(order.id, next).subscribe({
      next: updated => {
        this.myOrders.update(list => list.map(o => o.id === updated.id ? updated : o));
        this.updating.set(null);
        if (updated.status === 'EN_RUTA') {
          this.connectTracking(updated.id);
          void this.enviarRutaAlBackend(updated);
        }
        if (updated.status === 'ENTREGADO') this.stopTracking();
      },
      error: () => { this.error.set('Error al actualizar estado'); this.updating.set(null); }
    });
  }

  // Navega al chat entre repartidor y vendedor para una entrega específica.
  openVendedorChat(orderId: number): void {
    this.router.navigate(['/chat/order', orderId, 'VENDEDOR_REPARTIDOR']);
  }

  // Navega al chat entre repartidor y cliente para una entrega específica.
  openClienteChat(orderId: number): void {
    this.router.navigate(['/chat/order', orderId, 'CLIENTE_REPARTIDOR']);
  }

  // Formatea una fecha para mostrar en zona horaria de Madrid.
  // Delegación de utilidad a formatMadridDateTime.
  formatDate(d?: string): string {
    return formatMadridDateTime(d);
  }

  // Abre el modal que muestra la ruta de una entrega.
  // Carga la vista previa de la ruta si no existe en el caché.
  openRouteModal(orderId: number): void {
    this.openRouteOrderId.set(orderId);
    const order = [...this.myOrders(), ...this.available()].find(o => o.id === orderId);
    if (order) void this.loadRoutePreview(order);
  }

  // Cierra el modal de ruta estableciendo openRouteOrderId a null.
  closeRouteModal(): void {
    this.openRouteOrderId.set(null);
  }

  // Genera URL de Google Maps para mostrar la ruta desde el centro comercial hasta el destino.
  // Devuelve una URL con origen y destino para que Google Maps calcule la ruta automáticamente.
  routeUrl(order: Order): string {
    const origin = `${this.MALL_LAT},${this.MALL_LNG}`;
    const dest = (order.deliveryLat != null && order.deliveryLng != null)
      ? `${order.deliveryLat},${order.deliveryLng}`
      : encodeURIComponent(`${order.shippingAddress ?? ''}, España`);
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`;
  }

  // Genera URL de Google Maps con solo el destino (para navegación).
  // Se usa para abrir Google Maps con la dirección de entrega.
  // Devuelve una URL que solo incluye el destino, útil para navegación GPS.
  mapsNavUrl(order: Order): string {
    const dest = (order.deliveryLat != null && order.deliveryLng != null)
      ? `${order.deliveryLat},${order.deliveryLng}`
      : encodeURIComponent(`${order.shippingAddress ?? ''}, España`);
    return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
  }

  /**
   * Método privado que resuelve el destino y calcula la ruta real con Google Maps DirectionsService.
   * Envía la ruta calculada al backend para que la use en la simulación GPS.
   * Se llama automáticamente cuando la entrega pasa a EN_RUTA.
   */
  private async enviarRutaAlBackend(order: Order): Promise<void> {
    const destination = await this.resolveDestination(order);
    if (!destination) return;
    const route = await this.resolveRoutePath({ lat: this.MALL_LAT, lng: this.MALL_LNG }, destination);
    if (route.length < 2) return;
    this.repartidorService.setOrderRoute(order.id, route).subscribe();
  }

  // Conecta al WebSocket de tracking si aún no está conectado.
  // Una vez conectado, se suscribe a las actualizaciones de posición de la entrega.
  private connectTracking(orderId: number): void {
    const token = this.authService.getToken();
    if (!token) return;
    if (this.trackingService.isConnected()) {
      this.subscribeTracking(orderId);
    } else {
      this.trackingService.connect(token)
        .then(() => this.subscribeTracking(orderId))
        .catch(() => { });
    }
  }

  // Se suscribe al stream de posición GPS en tiempo real de una entrega específica.
  // Actualiza trackingPosition cada vez que llega una nueva ubicación.
  // Cancela la suscripción anterior si existe.
  private subscribeTracking(orderId: number): void {
    this.trackingSub?.unsubscribe();
    this.trackingSub = this.trackingService.subscribeToOrder(orderId).subscribe(pos => {
      this.trackingPosition.set({ lat: pos.latitud, lng: pos.longitud });
    });

    this.estadoSub?.unsubscribe();
    this.estadoSub = this.trackingService.subscribeToOrderEstado(orderId).subscribe(status => {
      if (status === 'ENTREGADO') {
        this.myOrders.update(list =>
          list.map(o => o.id === orderId ? { ...o, status: 'ENTREGADO' as OrderStatus } : o)
        );
        this.stopTracking();
      }
    });
  }

  private stopTracking(): void {
    this.trackingSub?.unsubscribe();
    this.trackingSub = null;
    this.estadoSub?.unsubscribe();
    this.estadoSub = null;
    this.trackingPosition.set(null);
  }

  // Carga la vista previa de la ruta para una entrega: resuelve el destino y calcula la ruta.
  // Almacena el resultado en routePreviewPaths para que el modal la muestre.
  private async loadRoutePreview(order: Order): Promise<void> {
    const destination = await this.resolveDestination(order);
    if (!destination) return;
    const route = await this.resolveRoutePath({ lat: this.MALL_LAT, lng: this.MALL_LNG }, destination);
    this.routePreviewPaths.update(prev => ({ ...prev, [order.id]: route }));
  }

  /**
   * Resuelve las coordenadas del destino de una entrega.
   * 
   * Estrategia:
   * 1. Si la entrega tiene deliveryLat/Lng: devolverlos directamente.
   * 2. Si tiene dirección de envío: geocodificarla usando Google Maps Geocoder.
   * 3. Si no hay datos: devolver null.
   * 
   * @returns Promesa que se resuelve a { lat, lng } o null si no se pudo resolver.
   */
  private async resolveDestination(order: Order): Promise<{ lat: number; lng: number } | null> {
    if (order.deliveryLat != null && order.deliveryLng != null) {
      return { lat: order.deliveryLat, lng: order.deliveryLng };
    }
    if (order.shippingAddress && typeof google !== 'undefined' && google?.maps?.Geocoder) {
      const geocoder = new google.maps.Geocoder();
      return new Promise(resolve => {
        geocoder.geocode({ address: order.shippingAddress! }, (results: any, status: any) => {
          if (status === 'OK' && results?.[0]?.geometry?.location) {
            const loc = results[0].geometry.location;
            resolve({ lat: loc.lat(), lng: loc.lng() });
          } else {
            resolve(null);
          }
        });
      });
    }
    return null;
  }

  /**
   * Calcula la ruta en carretera desde el origen al destino usando Google Maps Directions API.
   * 
   * Devuelve un array de puntos ({ lat, lng }) que representan el camino.
   * Si hay error o Google Maps no está disponible, devuelve una ruta lineal (dos puntos: origen y destino).
   * 
   * @param origin Coordenadas del centro comercial.
   * @param destination Coordenadas del destino de la entrega.
   * @returns Promesa que se resuelve a array de coordenadas.
   */
  private async resolveRoutePath(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{ lat: number; lng: number }[]> {
    try {
      await this.mapsLoader.load();
      if (typeof google === 'undefined' || !google?.maps?.importLibrary) {
        return [origin, destination];
      }
      const routesLib = await google.maps.importLibrary('routes') as google.maps.RoutesLibrary;
      const service = new routesLib.DirectionsService();
      const result = await service.route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING
      });
      const route = result.routes[0];
      const path = (route?.overview_path ?? []).map(point => ({ lat: point.lat(), lng: point.lng() }));
      return path.length > 1 ? path : [origin, destination];
    } catch {
      return [origin, destination];
    }
  }

  // Geocodifica una dirección de texto a coordenadas usando Google Maps Geocoder.
  // Almacena el resultado en geocodedDestinations para evitar geocodificaciones repetidas.
  // Se usa en el effect del constructor para cachear direcciones automáticamente.
  private geocodeAddress(orderId: number, address: string): void {
    if (typeof google === 'undefined' || !google?.maps?.Geocoder) return;
    new google.maps.Geocoder().geocode({ address }, (results: any, status: any) => {
      if (status === 'OK' && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        this.geocodedDestinations.update(prev => ({ ...prev, [orderId]: { lat: loc.lat(), lng: loc.lng() } }));
      }
    });
  }
}
