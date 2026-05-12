import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.css'
})
export class ConfirmModalComponent {
  readonly toastService = inject(ToastService);

  confirm(): void { this.toastService.resolveConfirm(true); }
  cancel(): void { this.toastService.resolveConfirm(false); }
}
