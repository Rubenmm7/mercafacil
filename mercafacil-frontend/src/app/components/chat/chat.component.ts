import {
  Component, OnInit, OnDestroy,
  signal, computed, ViewChild, ElementRef, AfterViewChecked
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { ChatType, MessageRequest, MessageResponse } from '../../models/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesArea') private messagesArea!: ElementRef<HTMLElement>;

  orderId  = signal<number | null>(null);
  shopId   = signal<number | null>(null);
  chatType = signal<ChatType>('CLIENTE_REPARTIDOR');

  messages   = signal<MessageResponse[]>([]);
  newMessage = signal('');
  loading    = signal(true);
  error      = signal('');

  currentUserId = computed(() => {
    const token = this.authService.getToken();
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1])).sub as string;
    } catch {
      return null;
    }
  });

  private subscription?: Subscription;
  private shouldScroll = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private chatService: ChatService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.params;
    const qp     = this.route.snapshot.queryParams;

    if (params['orderId']) {
      this.orderId.set(+params['orderId']);
      this.chatType.set((params['chatType'] ?? qp['type'] ?? 'CLIENTE_REPARTIDOR') as ChatType);
    } else if (params['shopId']) {
      this.shopId.set(+params['shopId']);
      this.chatType.set('PROVEEDOR_VENDEDOR');
    }

    this.loadHistory();
    this.connectWs();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.chatService.disconnect();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private loadHistory(): void {
    const orderId = this.orderId();
    const shopId  = this.shopId();
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
        this.shouldScroll = true;
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
      const shopId  = this.shopId();

      let obs$;
      if (orderId != null) {
        obs$ = this.chatService.subscribeToOrder(orderId, this.chatType());
      } else if (shopId != null) {
        obs$ = this.chatService.subscribeToShop(shopId);
      } else {
        return;
      }

      this.subscription = obs$.subscribe(msg => {
        this.messages.update(list => [...list, msg]);
        this.shouldScroll = true;
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
    const shopId  = this.shopId();

    const req: MessageRequest = {
      chatType: this.chatType(),
      orderId:  orderId  ?? undefined,
      shopId:   shopId   ?? undefined,
      mensaje:  text
    };

    if (orderId != null) {
      this.chatService.sendToOrder(orderId, req);
    } else if (shopId != null) {
      this.chatService.sendToShop(shopId, req);
    }

    this.newMessage.set('');
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  isOwnMessage(msg: MessageResponse): boolean {
    return msg.senderName === this.authService.user()?.nombre + ' ' + this.authService.user()?.apellidos;
  }

  chatTitle(): string {
    const orderId = this.orderId();
    const shopId  = this.shopId();
    if (orderId != null) return `Pedido #${orderId}`;
    if (shopId  != null) return `Tienda #${shopId}`;
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

  private scrollToBottom(): void {
    const el = this.messagesArea?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
