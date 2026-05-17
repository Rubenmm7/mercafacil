import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ApiService } from '../../services/api.service';
import { ChatType, MarkReadRequest, MessageRequest, MessageResponse } from '../../models/models';
import { environment } from '../../../environments/environment';
import { formatMadridTime } from '../../utils/date-time';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesArea') private messagesArea!: ElementRef<HTMLElement>;

  orderId = signal<number | null>(null);
  shopId = signal<number | null>(null);
  shopName = signal<string>('');
  chatType = signal<ChatType>('CLIENTE_REPARTIDOR');

  messages = signal<MessageResponse[]>([]);
  newMessage = signal('');
  loading = signal(true);
  error = signal('');

  private subscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private chatService: ChatService,
    public authService: AuthService,
    private notificationService: NotificationService,
    private apiService: ApiService
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
      this.apiService.getStores().subscribe(stores => {
        const store = stores.find(s => s.id === this.shopId());
        if (store) this.shopName.set(store.name);
      });
    }

    this.markThreadRead();
    this.loadHistory();
    this.connectWs();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.chatService.disconnect();
  }

  goBack(): void {
    const backPath: string = this.route.snapshot.data['backPath'] ?? '/chats';
    this.router.navigate([backPath]);
  }

  send(): void {
    const text = this.newMessage().trim();
    if (!text) return;

    if (!this.chatService.isConnected()) {
      this.error.set('Sin conexión al chat. Recarga la página.');
      return;
    }

    const req: MessageRequest = {
      chatType: this.chatType(),
      orderId: this.orderId() ?? undefined,
      shopId: this.shopId() ?? undefined,
      mensaje: text
    };

    if (this.orderId() != null) {
      this.chatService.sendToOrder(this.orderId()!, req);
    } else if (this.shopId() != null) {
      this.chatService.sendToShop(this.shopId()!, req);
    }

    this.newMessage.set('');
    this.scrollToBottom();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  isOwnMessage(msg: MessageResponse): boolean {
    return msg.senderId === this.authService.user()?.id;
  }

  chatTitle(): string {
    if (this.orderId() != null) return `Pedido #${this.orderId()}`;
    if (this.shopId() != null) return this.shopName() || `Tienda #${this.shopId()}`;
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
    return formatMadridTime(fecha);
  }

  private loadHistory(): void {
    const orderId = this.orderId();
    const shopId = this.shopId();
    const url = orderId != null
      ? `${environment.apiUrl}/messages/order/${orderId}?type=${this.chatType()}`
      : shopId != null
        ? `${environment.apiUrl}/messages/shop/${shopId}?type=PROVEEDOR_VENDEDOR`
        : null;

    if (!url) {
      this.loading.set(false);
      return;
    }

    this.http.get<MessageResponse[]>(url).subscribe({
      next: msgs => {
        this.messages.set(msgs);
        this.loading.set(false);
        this.scrollToBottom();
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
      if (orderId == null && shopId == null) return;

      const stream$ = orderId != null
        ? this.chatService.subscribeToOrder(orderId, this.chatType())
        : this.chatService.subscribeToShop(shopId!);

      this.subscription = stream$.subscribe(msg => {
        this.messages.update(list => [...list, msg]);
        this.scrollToBottom();
      });
    }).catch(() => {
      this.error.set('No se pudo conectar al chat');
    });
  }

  private markThreadRead(): void {
    const req: MarkReadRequest = {
      chatType: this.chatType(),
      orderId: this.orderId() ?? undefined,
      shopId: this.shopId() ?? undefined,
    };
    this.http.post(`${environment.apiUrl}/messages/read`, req).subscribe({
      next: () => this.notificationService.reloadUnreadCounts(),
      error: () => { }
    });
  }

  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      const el = this.messagesArea?.nativeElement;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
  }

}
