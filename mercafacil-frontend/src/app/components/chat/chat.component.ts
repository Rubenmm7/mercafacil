import {
  Component, OnInit, OnDestroy,
  signal, computed, ViewChild, ElementRef
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ChatType, MarkReadRequest, MessageRequest, MessageResponse } from '../../models/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesArea') private messagesArea!: ElementRef<HTMLElement>;
  @ViewChild('messageInput') private messageInput?: ElementRef<HTMLTextAreaElement>;

  orderId = signal<number | null>(null);
  shopId = signal<number | null>(null);
  chatType = signal<ChatType>('CLIENTE_REPARTIDOR');

  messages = signal<MessageResponse[]>([]);
  newMessage = signal('');
  replyingTo = signal<MessageResponse | null>(null);
  loading = signal(true);
  error = signal('');

  currentUserId = computed(() => {
    const token = this.authService.getToken();
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1])).sub as string;
    } catch {
      return null;
    }
  });

  isAtBottom = signal(true);
  autoScrollLock = signal(true);
  unreadCount = signal(0);

  private subscription?: Subscription;
  private readonly BOTTOM_THRESHOLD = 80;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private chatService: ChatService,
    public authService: AuthService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    const params = this.route.snapshot.params;
    const qp = this.route.snapshot.queryParams;

    if (params['orderId']) {
      this.orderId.set(+params['orderId']);
      this.chatType.set((params['chatType'] ?? qp['type'] ?? 'CLIENTE_REPARTIDOR') as ChatType);
    } else if (params['shopId']) {
      this.shopId.set(+params['shopId']);
      this.chatType.set('PROVEEDOR_VENDEDOR');
    }

    const chatKey = this.buildChatKey();
    this.notificationService.setActiveChat(chatKey);
    this.markThreadRead();

    this.loadHistory();
    this.connectWs();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.chatService.disconnect();
    this.notificationService.clearActiveChat();
  }

  onScroll(): void {
    const el = this.messagesArea?.nativeElement;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom <= this.BOTTOM_THRESHOLD;
    this.isAtBottom.set(atBottom);
    if (atBottom) this.unreadCount.set(0);
  }

  toggleAutoScrollLock(): void {
    const next = !this.autoScrollLock();
    this.autoScrollLock.set(next);
    if (next) {
      this.unreadCount.set(0);
      this.scheduleScrollToBottom();
    }
  }

  jumpToBottom(): void {
    this.unreadCount.set(0);
    this.isAtBottom.set(true);
    this.scheduleScrollToBottom();
  }

  private loadHistory(): void {
    const orderId = this.orderId();
    const shopId = this.shopId();
    let url: string;

    if (orderId != null) {
      url = `${environment.apiUrl}/messages/order/${orderId}?type=${this.chatType()}`;
    } else if (shopId != null) {
      url = `${environment.apiUrl}/messages/shop/${shopId}?type=PROVEEDOR_VENDEDOR`;
    } else {
      this.loading.set(false);
      return;
    }

    this.http.get<MessageResponse[]>(url).subscribe({
      next: msgs => {
        this.messages.set(msgs);
        this.loading.set(false);
        this.scheduleScrollToBottom();
      },
      error: () => {
        this.error.set('No se pudo cargar el historial');
        this.loading.set(false);
      }
    });
  }

  private connectWs(): void {
    const token = this.authService.getToken();
    if (!token) return;

    this.chatService.connect(token).then(() => {
      const orderId = this.orderId();
      const shopId = this.shopId();

      let obs$;
      if (orderId != null) {
        obs$ = this.chatService.subscribeToOrder(orderId, this.chatType());
      } else if (shopId != null) {
        obs$ = this.chatService.subscribeToShop(shopId);
      } else {
        return;
      }

      this.subscription = obs$.subscribe(msg => {
        const own = this.isOwnMessage(msg);
        this.messages.update(list => [...list, msg]);
        if (own || this.autoScrollLock() || this.isAtBottom()) {
          this.scheduleScrollToBottom();
        } else {
          this.unreadCount.update(n => n + 1);
        }
      });
    }).catch(() => {
      this.error.set('No se pudo conectar al chat');
    });
  }

  send(): void {
    const text = this.newMessage().trim();
    if (!text) return;

    if (!this.chatService.isConnected()) {
      this.error.set('Sin conexión al chat. Recarga la página.');
      return;
    }

    const orderId = this.orderId();
    const shopId = this.shopId();

    const req: MessageRequest = {
      chatType: this.chatType(),
      orderId: orderId ?? undefined,
      shopId: shopId ?? undefined,
      replyToMessageId: this.replyingTo()?.id,
      mensaje: text
    };

    if (orderId != null) {
      this.chatService.sendToOrder(orderId, req);
    } else if (shopId != null) {
      this.chatService.sendToShop(shopId, req);
    }

    this.newMessage.set('');
    this.replyingTo.set(null);
    this.scheduleScrollToBottom();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  setReplyTarget(msg: MessageResponse): void {
    this.replyingTo.set(msg);
    this.focusMessageInput();
  }

  clearReplyTarget(): void {
    this.replyingTo.set(null);
  }

  replyPreview(text?: string): string {
    if (!text) return '';
    return text.length > 80 ? `${text.slice(0, 80)}...` : text;
  }

  isOwnMessage(msg: MessageResponse): boolean {
    return msg.senderId === this.authService.user()?.id;
  }

  chatTitle(): string {
    const orderId = this.orderId();
    const shopId = this.shopId();
    if (orderId != null) return `Pedido #${orderId}`;
    if (shopId != null) return `Tienda #${shopId}`;
    return 'Chat';
  }

  chatSubtitle(): string {
    const map: Record<ChatType, string> = {
      CLIENTE_REPARTIDOR: 'Cliente · Repartidor',
      VENDEDOR_REPARTIDOR: 'Vendedor · Repartidor',
      PROVEEDOR_VENDEDOR: 'Proveedor · Vendedor'
    };
    return map[this.chatType()];
  }

  formatTime(fecha: string): string {
    const iso = fecha.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(fecha) ? fecha : `${fecha}Z`;
    return new Date(iso).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid'
    });
  }

  private buildChatKey(): string {
    const orderId = this.orderId();
    const shopId = this.shopId();
    return orderId != null
      ? `order-${orderId}-${this.chatType()}`
      : `shop-${shopId}-${this.chatType()}`;
  }

  private markThreadRead(): void {
    const orderId = this.orderId();
    const shopId = this.shopId();
    const req: MarkReadRequest = {
      chatType: this.chatType(),
      orderId: orderId ?? undefined,
      shopId: shopId ?? undefined,
    };
    this.http.post(`${environment.apiUrl}/messages/read`, req).subscribe();
  }

  private scheduleScrollToBottom(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.scrollToBottom());
    });
  }

  private scrollToBottom(): void {
    const el = this.messagesArea?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    this.isAtBottom.set(true);
  }

  private focusMessageInput(): void {
    requestAnimationFrame(() => {
      const el = this.messageInput?.nativeElement;
      if (!el) return;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    });
  }
}
