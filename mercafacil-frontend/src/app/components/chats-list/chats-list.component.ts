import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ChatThread, ChatType } from '../../models/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chats-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chats-list.component.html',
  styleUrl: './chats-list.component.css'
})
export class ChatsListComponent implements OnInit {
  threads = signal<ChatThread[]>([]);
  loading = signal(true);
  error = signal('');

  private readonly chatTypeLabels: Record<ChatType, string> = {
    CLIENTE_REPARTIDOR: 'Cliente · Repartidor',
    VENDEDOR_REPARTIDOR: 'Vendedor · Repartidor',
    PROVEEDOR_VENDEDOR: 'Proveedor · Vendedor'
  };

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.http.get<ChatThread[]>(`${environment.apiUrl}/messages/threads`).subscribe({
      next: list => {
        this.threads.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los chats');
        this.loading.set(false);
      }
    });
  }

  chatTypeLabel(type: ChatType): string {
    return this.chatTypeLabels[type];
  }

  formatDate(date: string): string {
    const iso = date.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(date) ? date : `${date}Z`;
    return new Date(iso).toLocaleString('es-ES', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Europe/Madrid'
    });
  }

  open(thread: ChatThread): void {
    if (thread.orderId != null) {
      this.router.navigate(['/chat/order', thread.orderId, thread.chatType]);
    } else if (thread.shopId != null) {
      this.router.navigate(['/chat/shop', thread.shopId]);
    }
  }
}
