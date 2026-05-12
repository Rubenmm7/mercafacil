import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { TrackingPosition } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TrackingService {
  private readonly base = `${environment.apiUrl}/tracking`;
  private client: Client | null = null;
  private connected = false;

  constructor(private http: HttpClient) { }

  // --- REST ---

  // El repartidor envía su posición actual al servidor
  sendLocation(orderId: number, latitud: number, longitud: number): Observable<TrackingPosition> {
    return this.http.post<TrackingPosition>(
      `${this.base}/orders/${orderId}/location`,
      { latitud, longitud }
    );
  }

  // Devuelve el historial completo de posiciones de un pedido
  getHistory(orderId: number): Observable<TrackingPosition[]> {
    return this.http.get<TrackingPosition[]>(`${this.base}/orders/${orderId}/history`);
  }

  // Devuelve la última posición conocida (HTTP 204 si aún no hay ninguna)
  getLastLocation(orderId: number): Observable<TrackingPosition> {
    return this.http.get<TrackingPosition>(`${this.base}/orders/${orderId}/location`);
  }

  // --- STOMP ---

  // Abre la conexión WebSocket con el token JWT del usuario
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new Client({
        webSocketFactory: () => new SockJS(environment.wsUrl) as WebSocket,
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 0,
        onConnect: () => { this.connected = true; resolve(); },
        onStompError: frame => reject(new Error(frame.headers['message'])),
        onDisconnect: () => { this.connected = false; },
      });
      this.client.activate();
    });
  }

  // Se suscribe al topic de tracking de un pedido; cancela el sub STOMP al desubscribirse
  subscribeToOrder(orderId: number): Observable<TrackingPosition> {
    const subject = new Subject<TrackingPosition>();
    let stompSub: StompSubscription | undefined;

    stompSub = this.client?.subscribe(
      `/topic/tracking/order/${orderId}`,
      (msg: IMessage) => subject.next(JSON.parse(msg.body) as TrackingPosition)
    );

    // Al cancelar la suscripción RxJS también se cierra el canal STOMP en el broker
    return new Observable(observer => {
      const rxjsSub = subject.subscribe(observer);
      return () => { rxjsSub.unsubscribe(); stompSub?.unsubscribe(); };
    });
  }

  disconnect(): void {
    this.client?.deactivate();
    this.client = null;
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
