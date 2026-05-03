import { Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { TrackingService } from '../../services/tracking.service';
import { ChatType, MessageRequest, MessageResponse, Order, OrderStatus, TrackingPosition } from '../../models/models';
import { environment } from '../../../environments/environment';

interface TimelineStep {
  key: OrderStatus;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css'
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  @ViewChild('messageBox') private messageBox?: ElementRef<HTMLTextAreaElement>;

  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly tracking = signal<TrackingPosition | null>(null);
  readonly trackingLoading = signal(false);

  readonly messages = signal<MessageResponse[]>([]);
  readonly chatLoading = signal(false);
  readonly newMessage = signal('');
  readonly chatError = signal<string | null>(null);
  readonly chatConnecting = signal(false);
  readonly replyingTo = signal<MessageResponse | null>(null);

  readonly chatType: ChatType = 'CLIENTE_REPARTIDOR';

  private readonly timeline: TimelineStep[] = [
    { key: 'PENDIENTE', title: 'Pedido confirmado', desc: 'Tu compra fue registrada correctamente.' },
    { key: 'PREPARACION', title: 'En preparación', desc: 'La tienda está preparando tu pedido.' },
    { key: 'EN_RUTA', title: 'En ruta', desc: 'El repartidor va camino a la entrega.' },
    { key: 'ENTREGADO', title: 'Entregado', desc: 'Pedido entregado con éxito.' }
  ];

  private chatSub: Subscription | null = null;
  private trackingSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private http: HttpClient,
    private authService: AuthService,
    private chatService: ChatService,
    private trackingService: TrackingService
  ) {}

  ngOnInit(): void {
    const orderId = Number(this.route.snapshot.paramMap.get('id'));
    if (!orderId || Number.isNaN(orderId)) {
      this.error.set('ID de pedido inválido.');
      this.loading.set(false);
      return;
    }

    this.loadOrder(orderId);
  }

  ngOnDestroy(): void {
    this.chatSub?.unsubscribe();
    this.trackingSub?.unsubscribe();
    this.chatService.disconnect();
    this.trackingService.disconnect();
  }

  loadOrder(orderId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getMyOrderById(orderId).subscribe({
      next: order => {
        this.order.set(order);
        this.loading.set(false);
        this.connectRealtime(order.id);
      },
      error: () => {
        this.error.set('No pudimos cargar el pedido o no tienes permiso para verlo.');
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/pedidos']);
  }

  timelineIndex(status: OrderStatus): number {
    return this.timeline.findIndex(step => step.key === status);
  }

  timelineSteps(): TimelineStep[] {
    return this.timeline;
  }

  isDone(step: OrderStatus): boolean {
    const current = this.order()?.status;
    if (!current) return false;
    return this.timelineIndex(step) <= this.timelineIndex(current);
  }

  isCurrent(step: OrderStatus): boolean {
    return this.order()?.status === step;
  }

  statusLabel(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      PENDIENTE: 'Pendiente',
      PREPARACION: 'En preparación',
      EN_RUTA: 'En ruta',
      ENTREGADO: 'Entregado'
    };
    return map[status] ?? status;
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    return new Date(value).toLocaleString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  sendMessage(): void {
    const order = this.order();
    const text = this.newMessage().trim();
    if (!order || !text) return;

    const req: MessageRequest = {
      chatType: this.chatType,
      orderId: order.id,
      replyToMessageId: this.replyingTo()?.id,
      mensaje: text
    };

    const publish = () => {
      this.chatService.sendToOrder(order.id, req);
      this.newMessage.set('');
      this.replyingTo.set(null);
      this.resizeInput();
    };

    if (this.chatService.isConnected()) {
      publish();
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      this.chatError.set('No hay sesión activa para enviar mensajes.');
      return;
    }

    this.chatConnecting.set(true);
    this.chatError.set(null);
    this.chatService.connect(token).then(() => {
      this.chatConnecting.set(false);
      this.subscribeChat(order.id);
      publish();
    }).catch(() => {
      this.chatConnecting.set(false);
      this.chatError.set('No se pudo conectar al chat. Intenta de nuevo.');
    });
  }

  onMessageInput(value: string): void {
    this.newMessage.set(value);
    this.resizeInput();
  }

  onMessageKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  setReplyTarget(msg: MessageResponse): void {
    this.replyingTo.set(msg);
  }

  clearReplyTarget(): void {
    this.replyingTo.set(null);
  }

  replyPreview(text?: string): string {
    if (!text) return '';
    return text.length > 90 ? `${text.slice(0, 90)}...` : text;
  }

  isOwnMessage(msg: MessageResponse): boolean {
    const user = this.authService.user();
    if (!user) return false;
    return msg.senderName === `${user.nombre} ${user.apellidos}`;
  }

  private connectRealtime(orderId: number): void {
    this.loadChatHistory(orderId);
    this.loadLastTracking(orderId);

    const token = this.authService.getToken();
    if (!token) return;

    if (this.chatService.isConnected()) {
      this.subscribeChat(orderId);
    } else {
      this.chatConnecting.set(true);
      this.chatService.connect(token)
        .then(() => {
          this.chatConnecting.set(false);
          this.subscribeChat(orderId);
        })
        .catch(() => {
          this.chatConnecting.set(false);
          this.chatError.set('No se pudo conectar al chat en tiempo real.');
        });
    }

    if (this.trackingService.isConnected()) {
      this.subscribeTracking(orderId);
    } else {
      this.trackingService.connect(token)
        .then(() => this.subscribeTracking(orderId))
        .catch(() => {});
    }
  }

  private loadChatHistory(orderId: number): void {
    this.chatLoading.set(true);
    this.http.get<MessageResponse[]>(`${environment.apiUrl}/messages/order/${orderId}?type=${this.chatType}`).subscribe({
      next: msgs => {
        this.messages.set(msgs);
        this.chatLoading.set(false);
      },
      error: () => {
        this.chatLoading.set(false);
        this.chatError.set('No se pudo cargar el historial del chat.');
      }
    });
  }

  private loadLastTracking(orderId: number): void {
    this.trackingLoading.set(true);
    this.trackingService.getLastLocation(orderId).subscribe({
      next: pos => {
        this.tracking.set(pos);
        this.trackingLoading.set(false);
      },
      error: () => {
        this.trackingLoading.set(false);
      }
    });
  }

  private subscribeChat(orderId: number): void {
    this.chatSub?.unsubscribe();
    this.chatSub = this.chatService.subscribeToOrder(orderId, this.chatType).subscribe(msg => {
      this.messages.update(list => [...list, msg]);
    });
  }

  private subscribeTracking(orderId: number): void {
    this.trackingSub?.unsubscribe();
    this.trackingSub = this.trackingService.subscribeToOrder(orderId).subscribe(pos => {
      this.tracking.set(pos);
      this.trackingLoading.set(false);
    });
  }

  private resizeInput(): void {
    const el = this.messageBox?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }
}
