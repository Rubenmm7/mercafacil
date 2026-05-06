import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';
import { ChatType, MessageRequest, MessageResponse } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private client: Client | null = null;
  private connected = false;

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new Client({
        webSocketFactory: () => new SockJS(environment.wsUrl) as WebSocket,
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 0,
        onConnect: () => {
          this.connected = true;
          resolve();
        },
        onStompError: frame => reject(new Error(frame.headers['message'])),
        onDisconnect: () => { this.connected = false; },
      });
      this.client.activate();
    });
  }

  subscribeToOrder(orderId: number, chatType: ChatType): Observable<MessageResponse> {
    const subject = new Subject<MessageResponse>();
    const suffix = chatType.toLowerCase().replace(/_/g, '-');
    this.client?.subscribe(`/topic/chat/order/${orderId}/${suffix}`, (msg: IMessage) => {
      subject.next(JSON.parse(msg.body) as MessageResponse);
    });
    return subject.asObservable();
  }

  subscribeToShop(shopId: number): Observable<MessageResponse> {
    const subject = new Subject<MessageResponse>();
    this.client?.subscribe(`/topic/chat/shop/${shopId}/proveedor-vendedor`, (msg: IMessage) => {
      subject.next(JSON.parse(msg.body) as MessageResponse);
    });
    return subject.asObservable();
  }

  sendToOrder(orderId: number, req: MessageRequest): void {
    this.client?.publish({ destination: `/app/chat/order/${orderId}`, body: JSON.stringify(req) });
  }

  sendToShop(shopId: number, req: MessageRequest): void {
    this.client?.publish({ destination: `/app/chat/shop/${shopId}`, body: JSON.stringify(req) });
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
