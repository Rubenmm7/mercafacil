import { Component, OnInit, computed, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { GoogleMap, MapAdvancedMarker, MapPolyline } from '@angular/google-maps';
import { MapsLoaderService } from '../../services/maps-loader.service';
import { IconComponent } from '../icon/icon.component';

/**
 * Componente de mapa en vivo que muestra una ubicación actual y opcionalmente una ruta.
 * 
 * Responsabilidades:
 * - Renderizar un mapa Google Maps centrado en coordenadas dinámicas (lat/lng).
 * - Mostrar un marcador en la ubicación actual.
 * - Visualizar una polyline (ruta) si se proporciona un array de puntos.
 * - Permitir control de zoom y pantalla completa.
 * - Mostrar fallback si Google Maps no está disponible.
 * 
 * Inputs requeridos:
 * - lat: latitud del centro del mapa.
 * - lng: longitud del centro del mapa.
 * 
 * Inputs opcionales:
 * - zoom: nivel de zoom (por defecto 16).
 * - label: etiqueta que se muestra junto al marcador (por defecto vacío).
 * - routePoints: array de puntos que forman la ruta a visualizar (por defecto vacío).
 */
@Component({
  selector: 'app-live-map',
  standalone: true,
  imports: [GoogleMap, MapAdvancedMarker, MapPolyline, DecimalPipe, IconComponent],
  templateUrl: './live-map.component.html',
  styleUrl: './live-map.component.css'
})
export class LiveMapComponent implements OnInit {
  // Latitud del marcador (input requerido).
  readonly lat = input.required<number>();
  
  // Longitud del marcador (input requerido).
  readonly lng = input.required<number>();
  
  // Nivel de zoom del mapa (por defecto 16, good para vista local).
  readonly zoom = input(16);
  
  // Etiqueta que se muestra junto al marcador (ej. "Centro comercial").
  readonly label = input<string>('');
  
  // Array de puntos que forman la ruta a visualizar como polyline (por defecto vacío, sin ruta).
  readonly routePoints = input<google.maps.LatLngLiteral[]>([]);

  // Indica si el script de Google Maps se cargó exitosamente.
  readonly mapsReady = signal(false);
  
  // Indica si hubo error al cargar Google Maps (true si mapsReady es false).
  readonly mapsError = signal(false);

  // Centro del mapa: se recalcula automáticamente cuando cambian lat o lng.
  readonly center = computed<google.maps.LatLngLiteral>(() => ({ lat: this.lat(), lng: this.lng() }));

  /**
   * Ruta filtrada: elimina puntos duplicados consecutivos (mismo lat/lng).
   * Devuelve un array de puntos sin duplicados para la visualización de la polyline.
   */
  readonly routePath = computed(() => this.routePoints().filter((point, index, all) =>
    index === 0 || point.lat !== all[index - 1].lat || point.lng !== all[index - 1].lng
  ));

  // Indica si hay una ruta válida para mostrar (más de 1 punto sin duplicados).
  readonly hasRoute = computed(() => this.routePath().length > 1);
  
  /**
   * Opciones de configuración del mapa Google Maps.
   * Se recalcula cuando cambian las propiedades para aplicar cambios reactivos.
   */
  readonly options = computed<google.maps.MapOptions>(() => ({
    disableDefaultUI: false,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    zoomControl: true,
    gestureHandling: 'greedy',
    mapId: 'DEMO_MAP_ID'
  }));

  constructor(private loader: MapsLoaderService) { }

  // Intenta cargar Google Maps de forma asincrónica y actualiza el estado.
  ngOnInit(): void {
    this.loader.load().then(ok => {
      this.mapsReady.set(ok);
      this.mapsError.set(!ok);
    });
  }
}

