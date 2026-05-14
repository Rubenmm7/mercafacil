import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);

  private readonly _unreadCounts = signal<Map<string, number>>(new Map());
  readonly unreadCounts = this._unreadCounts.asReadonly();
  readonly totalUnread = computed(() => {
    let sum = 0;
    this._unreadCounts().forEach(v => { sum += v; });
    return sum;
  });

  constructor() {
    effect(() => {
      if (this.authService.user()) {
        this.reloadUnreadCounts();
      } else {
        this._unreadCounts.set(new Map());
      }
    });
  }

  reloadUnreadCounts(): void {
    this.http.get<Record<string, number>>(`${environment.apiUrl}/messages/unread-counts`).subscribe({
      next: counts => {
        this._unreadCounts.set(
          new Map(Object.entries(counts).map(([key, value]) => [key, Number(value)]))
        );
      },
      error: () => {
        this._unreadCounts.set(new Map());
      }
    });
  }
}
