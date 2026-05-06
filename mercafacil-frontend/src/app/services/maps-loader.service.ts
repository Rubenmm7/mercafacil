import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

declare const google: any;

@Injectable({ providedIn: 'root' })
export class MapsLoaderService {
  private loadPromise: Promise<boolean> | null = null;

  // Carga el script de Google Maps JS API una sola vez. Devuelve false si no
  // hay API key configurada o si falla la carga, para que la UI pueda mostrar
  // un fallback con coordenadas en texto.
  load(): Promise<boolean> {
    if (this.loadPromise) return this.loadPromise;

    if (typeof google !== 'undefined' && google?.maps) {
      this.loadPromise = Promise.resolve(true);
      return this.loadPromise;
    }

    const key = environment.googleMapsApiKey;
    if (!key) {
      this.loadPromise = Promise.resolve(false);
      return this.loadPromise;
    }

    this.loadPromise = new Promise<boolean>(resolve => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload  = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
    return this.loadPromise;
  }
}
