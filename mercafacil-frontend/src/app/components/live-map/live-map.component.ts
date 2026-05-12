import { Component, OnInit, computed, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { MapsLoaderService } from '../../services/maps-loader.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-live-map',
  standalone: true,
  imports: [GoogleMap, MapMarker, DecimalPipe, IconComponent],
  templateUrl: './live-map.component.html',
  styleUrl: './live-map.component.css'
})
export class LiveMapComponent implements OnInit {
  readonly lat = input.required<number>();
  readonly lng = input.required<number>();
  readonly zoom = input(16);
  readonly label = input<string>('');

  readonly mapsReady = signal(false);
  readonly mapsError = signal(false);

  readonly center = computed<google.maps.LatLngLiteral>(() => ({ lat: this.lat(), lng: this.lng() }));
  readonly options = computed<google.maps.MapOptions>(() => ({
    disableDefaultUI: false,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    zoomControl: true,
    gestureHandling: 'greedy'
  }));

  constructor(private loader: MapsLoaderService) { }

  ngOnInit(): void {
    this.loader.load().then(ok => {
      this.mapsReady.set(ok);
      this.mapsError.set(!ok);
    });
  }
}
