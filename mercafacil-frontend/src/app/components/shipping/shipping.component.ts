import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Store, DeliveryZone } from '../../models/models';
import { IconComponent } from '../icon/icon.component';
import { FREE_DELIVERY_THRESHOLD_EUR } from '../../utils/business-rules';

@Component({
  selector: 'app-shipping',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './shipping.component.html',
  styleUrl: './shipping.component.css'
})
export class ShippingComponent implements OnInit {
  readonly freeDeliveryThreshold = FREE_DELIVERY_THRESHOLD_EUR;
  readonly stores = signal<Store[]>([]);
  readonly deliveryZones = signal<DeliveryZone[]>([]);
  readonly loading = signal(true);
  readonly zipCode = signal('');
  readonly checking = signal(false);
  readonly checkResult = signal<'available' | 'nearby' | 'too_far' | null>(null);

  readonly zoneName = computed(() => {
    const code = this.zipCode();
    if (code.startsWith('230')) return 'Jaén Capital';
    if (['231', '232', '233'].some(p => code.startsWith(p))) return 'Martos / Alcalá la Real';
    if (['234', '235'].some(p => code.startsWith(p))) return 'Úbeda / Baeza';
    return 'Jaén';
  });

  get timeSlots() {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return [
      { time: '09:00 – 12:00', label: 'Mañana', start: 9 * 60, end: 12 * 60 },
      { time: '12:00 – 15:00', label: 'Mediodía', start: 12 * 60, end: 15 * 60 },
      { time: '15:00 – 18:00', label: 'Tarde', start: 15 * 60, end: 18 * 60 },
      { time: '18:00 – 21:00', label: 'Tarde-noche', start: 18 * 60, end: 21 * 60 },
    ].map(s => ({
      ...s,
      past: nowMin >= s.end,
      active: nowMin >= s.start && nowMin < s.end,
      available: nowMin < s.end,
    }));
  }

  faqs = [
    { q: '¿Puedo cambiar mi dirección de entrega después de hacer el pedido?', a: 'Sí, puedes modificar la dirección de entrega hasta 30 minutos después de realizar el pedido, siempre que el estado sea \'En preparación\'.' },
    { q: '¿Qué pasa si no estoy en casa cuando llegue el repartidor?', a: 'El repartidor intentará contactarte por teléfono. Si no es posible la entrega, dejará un aviso y te programará una segunda entrega sin coste adicional.' },
    { q: '¿Los productos llegan en las mismas condiciones que en la tienda?', a: 'Sí. Los supermercados seleccionan los productos con la misma calidad. Los productos frescos y congelados se transportan en bolsas isotérmicas.' },
    { q: '¿Puedo pedir de varias tiendas en el mismo pedido?', a: 'Actualmente el sistema gestiona un pedido por tienda. Sin embargo, puedes hacer pedidos simultáneos de diferentes tiendas.' },
    { q: '¿Cómo funciona la política de devoluciones?', a: 'Si un producto llega en mal estado o no es lo que pediste, contáctanos en las primeras 24h y te gestionamos un reembolso o sustitución sin coste.' }
  ];

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    let pending = 2;
    const done = () => { if (--pending === 0) this.loading.set(false); };
    this.api.getStores().subscribe({ next: s => this.stores.set(s), complete: done, error: done });
    this.api.getDeliveryZones().subscribe({ next: z => this.deliveryZones.set(z), complete: done, error: done });
  }

  handleCheckZip(): void {
    const code = this.zipCode();
    if (code.length < 3 || this.checking()) return;
    this.checking.set(true);
    this.checkResult.set(null);
    setTimeout(() => {
      const covered = ['230', '231', '232', '233', '234', '235'];
      if (covered.some(p => code.startsWith(p))) {
        this.checkResult.set('available');
      } else if (code.startsWith('23')) {
        this.checkResult.set('nearby');
      } else {
        this.checkResult.set('too_far');
      }
      this.checking.set(false);
    }, 650);
  }

  onZipInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const clean = input.value.replace(/\D/g, '').slice(0, 5);
    if (clean !== input.value) input.value = clean;
    this.zipCode.set(clean);
    if (clean.length < 3) this.checkResult.set(null);
  }
}
