import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { ChatThread, ChatType, MessageResponse } from '../models/models';
import { environment } from '../../environments/environment';

const ROLE_LABEL: Record<ChatType, Record<string, string>> = {
  CLIENTE_REPARTIDOR:  { CLIENTE: 'Repartidor', REPARTIDOR: 'Cliente' },
  VENDEDOR_REPARTIDOR: { VENDEDOR: 'Repartidor', REPARTIDOR: 'Vendedor' },
  PROVEEDOR_VENDEDOR:  { PROVEEDOR: 'Vendedor',  VENDEDOR: 'Proveedor' },
};

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly authService  = inject(AuthService);
  private readonly http         = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private client: Client | null = null;
  private userId: number | null = null;

  private readonly _unreadCounts = signal<Map<string, number>>(new Map());
  readonly unreadCounts = this._unreadCounts.asReadonly();
  readonly totalUnread  = computed(() => {
    let sum = 0;
    this._unreadCounts().forEach(v => { sum += v; });
    return sum;
  });

  private readonly _activeChat = signal<string | null>(null);

  constructor() {
    effect(() => {
      const user = this.authService.user();
      if (user) {
        this.userId = user.id;
        this.init(user.token);
      } else {
        this.destroy();
      }
    });
  }

  setActiveChat(chatKey: string): void {
    this._activeChat.set(chatKey);
    this._unreadCounts.update(m => {
      const next = new Map(m);
      next.set(chatKey, 0);
      return next;
    });
  }

  clearActiveChat(): void {
    this._activeChat.set(null);
  }

  private init(token: string): void {
    if (this.client?.active) return;
    this.connectStomp(token);
  }

  private loadUnreadCounts(): void {
    this.http.get<Record<string, number>>(`${environment.apiUrl}/messages/unread-counts`).subscribe({
      next: counts => this._unreadCounts.set(
        new Map(Object.entries(counts).map(([k, v]) => [k, Number(v)]))
      )
    });
  }

  private connectStomp(token: string): void {
    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl) as WebSocket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        this.subscribeToAllThreads();
        this.loadUnreadCounts();
      },
      onDisconnect: () => {},
    });
    this.client.onStompError = () => {};
    this.client.activate();
  }

  private subscribeToAllThreads(): void {
    this.http.get<ChatThread[]>(`${environment.apiUrl}/messages/threads`).subscribe({
      next: threads => threads.forEach(t => this.subscribeToThread(t))
    });
  }

  private subscribeToThread(thread: ChatThread): void {
    const topic = this.buildTopic(thread);
    this.client?.subscribe(topic, (frame: IMessage) => {
      this.handleMessage(JSON.parse(frame.body) as MessageResponse);
    });
  }

  private handleMessage(msg: MessageResponse): void {
    if (msg.senderId === this.userId) return;

    const chatKey = this.buildChatKey(msg);
    if (chatKey === this._activeChat()) return;

    this._unreadCounts.update(m => {
      const next = new Map(m);
      next.set(chatKey, (next.get(chatKey) ?? 0) + 1);
      return next;
    });

    const myRole      = this.authService.user()?.rol ?? 'CLIENTE';
    const roleLabel   = ROLE_LABEL[msg.chatType]?.[myRole] ?? 'Usuario';
    const threadTitle = msg.orderId != null
      ? `Pedido #${msg.orderId}`
      : `Tienda #${msg.shopId}`;

    this.toastService.showMessage({
      body:            msg.mensaje,
      title:           `${roleLabel} · ${threadTitle}`,
      senderRoleLabel: roleLabel,
      orderId:         msg.orderId,
      shopId:          msg.shopId,
      chatType:        msg.chatType,
    });
  }

  private buildChatKey(msg: MessageResponse): string {
    return msg.orderId != null
      ? `order-${msg.orderId}-${msg.chatType}`
      : `shop-${msg.shopId}-${msg.chatType}`;
  }

  private buildTopic(thread: ChatThread): string {
    if (thread.orderId != null) {
      const suffix = thread.chatType.toLowerCase().replace(/_/g, '-');
      return `/topic/chat/order/${thread.orderId}/${suffix}`;
    }
    return `/topic/chat/shop/${thread.shopId}/proveedor-vendedor`;
  }

  private destroy(): void {
    this.client?.deactivate();
    this.client = null;
    this.userId = null;
    this._unreadCounts.set(new Map());
    this._activeChat.set(null);
  }
}
