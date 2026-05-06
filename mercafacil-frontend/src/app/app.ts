import { Component, inject } from '@angular/core';
import { LayoutComponent } from './components/layout/layout.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal.component';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LayoutComponent, ToastContainerComponent, ConfirmModalComponent],
  template: `
    <app-layout></app-layout>
    <app-toast-container></app-toast-container>
    <app-confirm-modal></app-confirm-modal>
  `
})
export class AppComponent {
  constructor() {
    inject(NotificationService);
  }
}
