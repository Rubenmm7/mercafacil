import { Component, OnInit, HostListener } from '@angular/core';

type FontSize = 'normal' | 'large' | 'xl';

@Component({
  selector: 'app-accessibility-widget',
  standalone: true,
  imports: [],
  templateUrl: './accessibility-widget.component.html',
  styleUrl: './accessibility-widget.component.css'
})
export class AccessibilityWidgetComponent implements OnInit {
  open = false;
  fontSize: FontSize = 'normal';
  highContrast = false;
  colorblind = false;

  ngOnInit(): void {
    try {
      const saved = localStorage.getItem('a11y');
      if (saved) {
        const prefs = JSON.parse(saved);
        this.fontSize = prefs.fontSize ?? 'normal';
        this.highContrast = prefs.highContrast ?? false;
        this.colorblind = prefs.colorblind ?? false;
      }
    } catch { /* ignorar datos corruptos */ }
    this.applyAll();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open = false;
  }

  togglePanel(): void {
    this.open = !this.open;
  }

  setFontSize(size: FontSize): void {
    this.fontSize = size;
    this.save();
    this.applyAll();
  }

  toggleContrast(): void {
    this.highContrast = !this.highContrast;
    this.save();
    this.applyAll();
  }

  toggleColorblind(): void {
    this.colorblind = !this.colorblind;
    this.save();
    this.applyAll();
  }

  private applyAll(): void {
    const html = document.documentElement;

    html.classList.remove('font-large', 'font-xl');
    if (this.fontSize === 'large') html.classList.add('font-large');
    else if (this.fontSize === 'xl') html.classList.add('font-xl');

    html.classList.toggle('high-contrast', this.highContrast);
    html.classList.toggle('colorblind', this.colorblind);
  }

  private save(): void {
    localStorage.setItem('a11y', JSON.stringify({
      fontSize: this.fontSize,
      highContrast: this.highContrast,
      colorblind: this.colorblind
    }));
  }
}
