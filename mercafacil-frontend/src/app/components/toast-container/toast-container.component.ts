import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastItem, ToastService } from '../../services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.css'
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  goToChat(toast: ToastItem): void {
    this.toastService.dismiss(toast.id);
    if (toast.orderId != null && toast.chatType != null) {
      this.router.navigate(['/chat/order', toast.orderId, toast.chatType]);
    } else if (toast.shopId != null) {
      this.router.navigate(['/chat/shop', toast.shopId]);
    }
  }

  trackById(_: number, toast: ToastItem): string {
    return toast.id;
  }
}
