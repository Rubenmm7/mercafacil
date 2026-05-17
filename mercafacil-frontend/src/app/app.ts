import { Component } from '@angular/core';
import { LayoutComponent } from './components/layout/layout.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal.component';
import { AccessibilityWidgetComponent } from './components/accessibility-widget/accessibility-widget.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LayoutComponent, ToastContainerComponent, ConfirmModalComponent, AccessibilityWidgetComponent],
  template: `
    <!-- Filtro SVG para modo daltónico (deuteranopia) -->
    <svg style="display:none;position:absolute;width:0;height:0" aria-hidden="true" focusable="false">
      <defs>
        <filter id="a11y-colorblind-filter">
          <feColorMatrix type="matrix"
            values="0.625 0.375 0     0 0
                    0.700 0.300 0     0 0
                    0     0.300 0.700 0 0
                    0     0     0     1 0"/>
        </filter>
      </defs>
    </svg>

    <app-layout></app-layout>
    <app-toast-container></app-toast-container>
    <app-confirm-modal></app-confirm-modal>
    <app-accessibility-widget></app-accessibility-widget>
  `
})
export class AppComponent {
}
