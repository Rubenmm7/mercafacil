import { Injectable, signal } from '@angular/core';
import { ChatType } from '../models/models';

export interface ToastItem {
  id: string;
  type: 'message' | 'error';
  body: string;
  title?: string;
  senderRoleLabel?: string;
  borderColor?: string;
  orderId?: number;
  shopId?: number;
  chatType?: ChatType;
}

export interface ConfirmState {
  message: string;
  title?: string;
  resolve: (ok: boolean) => void;
}

const ROLE_COLOR: Record<string, string> = {
  'Repartidor': '#4a6fa5',
  'Vendedor': '#27ae60',
  'Proveedor': '#8e44ad',
  'Cliente': '#666666',
};

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastItem[]>([]);
  readonly confirmState = signal<ConfirmState | null>(null);

  showMessage(params: {
    body: string;
    title?: string;
    senderRoleLabel?: string;
    orderId?: number;
    shopId?: number;
    chatType?: ChatType;
  }): void {
    const borderColor = params.senderRoleLabel
      ? (ROLE_COLOR[params.senderRoleLabel] ?? '#4a6fa5')
      : '#4a6fa5';

    const toast: ToastItem = {
      id: crypto.randomUUID(),
      type: 'message',
      body: params.body,
      title: params.title,
      senderRoleLabel: params.senderRoleLabel,
      borderColor,
      orderId: params.orderId,
      shopId: params.shopId,
      chatType: params.chatType,
    };

    this.toasts.update(list => {
      const next = [...list, toast];
      return next.length > 3 ? next.slice(next.length - 3) : next;
    });

    setTimeout(() => this.dismiss(toast.id), 4000);
  }

  showError(message: string): void {
    const toast: ToastItem = {
      id: crypto.randomUUID(),
      type: 'error',
      body: message,
      borderColor: '#e74c3c',
    };
    this.toasts.update(list => {
      const next = [...list, toast];
      return next.length > 3 ? next.slice(next.length - 3) : next;
    });
    setTimeout(() => this.dismiss(toast.id), 5000);
  }

  dismiss(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  confirm(message: string, title?: string): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.confirmState.set({ message, title, resolve });
    });
  }

  resolveConfirm(ok: boolean): void {
    const state = this.confirmState();
    if (state) {
      this.confirmState.set(null);
      state.resolve(ok);
    }
  }
}
