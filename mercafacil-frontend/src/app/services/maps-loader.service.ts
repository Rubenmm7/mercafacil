import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Declaración global de la API de Google Maps.
 * Se usa para verificar si la librería ya está cargada en la ventana del navegador.
 */
declare const google: any;

/**
 * Servicio encargado de cargar de forma lazy (bajo demanda) el script de Google Maps JS API.
 * 
 * Características principales:
 * - Carga el script una sola vez, incluso si se llama múltiples veces.
 * - Retorna un Promise que se resuelve a true si la carga fue exitosa, false en caso contrario.
 * - Si no hay API key configurada en environment, devuelve false para que la UI muestre un fallback.
 * - Los componentes pueden suscribirse al Promise para saber cuándo está listo usar google.maps.
 * 
 * Uso típico:
 *   this.mapsLoaderService.load().then(success => {
 *     if (success) { usar google.maps }
 *     else { mostrar fallback con coordenadas en texto }
 *   });
 */
@Injectable({ providedIn: 'root' })
export class MapsLoaderService {
  // Almacena la promesa de carga para no volver a cargar el script si ya se está cargando o ya se cargó.
  private loadPromise: Promise<boolean> | null = null;

  /**
   * Carga el script de Google Maps JS API de forma asíncrona.
   * 
   * - Si ya se está cargando, devuelve la misma promesa (evita duplicados).
   * - Si ya se cargó, devuelve una promesa resuelta inmediatamente.
   * - Si no hay API key en el archivo environment, devuleve false sin hacer la petición.
   * - Si hay error de red o durante la carga, retorna false.
   * 
   * @returns Promise<boolean> - true si la carga fue exitosa, false si falta API key o hubo error.
   */
  load(): Promise<boolean> {
    // Si ya hay una carga en progreso o completada, reutilizarla.
    if (this.loadPromise) return this.loadPromise;

    // Si google.maps ya está cargado globalmente, devuelve true inmediatamente.
    if (typeof google !== 'undefined' && google?.maps) {
      this.loadPromise = Promise.resolve(true);
      return this.loadPromise;
    }

    // Verificar que existe una API key configurada en el environment.
    const key = environment.googleMapsApiKey;
    if (!key) {
      // Sin API key, la UI mostará un fallback con coordenadas en texto.
      this.loadPromise = Promise.resolve(false);
      return this.loadPromise;
    }

    // Crear una promesa que se resuelve cuando el script se carga correctamente.
    this.loadPromise = new Promise<boolean>(resolve => {
      // Nombre del callback global que Google Maps llamará al completarse la carga.
      const cb = '__gmapsReady';
      
      // Definir el callback en window: cuando Google Maps se carga, ejecuta esto.
      (window as any)[cb] = () => {
        delete (window as any)[cb]; // Limpiar el callback global.
        resolve(true); // Indicar que la carga fue exitosa.
      };
      
      // Crear el elemento <script> para cargar la API de Google Maps.
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=${cb}&loading=async&libraries=marker,places,routes`;
      script.async = true;
      script.defer = true;
      
      // Si hay error de red o en la carga, limpiar el callback y fallar gracefully.
      script.onerror = () => {
        delete (window as any)[cb];
        resolve(false); // Devuelve false para que la UI sepa que hay un problema.
      };
      
      // Agregar el script al <head> para que el navegador lo descargue y ejecute.
      document.head.appendChild(script);
    });
    return this.loadPromise;
  }
}
