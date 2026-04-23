import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Store, DeliveryZone } from '../../models/models';

@Component({
  selector: 'app-shipping',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shipping.component.html',
  styleUrl: './shipping.component.css'
})
export class ShippingComponent implements OnInit {
  readonly stores = signal<Store[]>([]);
  readonly deliveryZones = signal<DeliveryZone[]>([]);
  readonly loading = signal(true);
  readonly zipCode = signal('');
  readonly checkResult = signal<'available' | 'unavailable' | null>(null);

  timeSlots = [
    { time: '09:00 - 12:00', available: true },
    { time: '12:00 - 15:00', available: true },
    { time: '15:00 - 18:00', available: false },
    { time: '18:00 - 21:00', available: true }
  ];

  faqs = [
    { q: '¿Puedo cambiar mi dirección de entrega después de hacer el pedido?', a: 'Sí, puedes modificar la dirección de entrega hasta 30 minutos después de realizar el pedido, siempre que el estado sea \'En preparación\'.' },
    { q: '¿Qué pasa si no estoy en casa cuando llegue el repartidor?', a: 'El repartidor intentará contactarte por teléfono. Si no es posible la entrega, dejará un aviso y te programará una segunda entrega sin coste adicional.' },
    { q: '¿Los productos llegan en las mismas condiciones que en la tienda?', a: 'Sí. Los supermercados seleccionan los productos con la misma calidad. Los productos frescos y congelados se transportan en bolsas isotérmicas.' },
    { q: '¿Puedo pedir de varias tiendas en el mismo pedido?', a: 'Actualmente el sistema gestiona un pedido por tienda. Sin embargo, puedes hacer pedidos simultáneos de diferentes tiendas.' },
    { q: '¿Cómo funciona la política de devoluciones?', a: 'Si un producto llega en mal estado o no es lo que pediste, contáctanos en las primeras 24h y te gestionamos un reembolso o sustitución sin coste.' }
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    let pending = 2;
    const done = () => { if (--pending === 0) this.loading.set(false); };
    this.api.getStores().subscribe({ next: s => this.stores.set(s), complete: done, error: done });
    this.api.getDeliveryZones().subscribe({ next: z => this.deliveryZones.set(z), complete: done, error: done });
  }

  handleCheckZip(): void {
    const code = this.zipCode();
    if (code.length === 5) {
      const jaenPrefixes = ['230', '231', '232', '233', '234', '235'];
      this.checkResult.set(jaenPrefixes.some(p => code.startsWith(p)) ? 'available' : 'unavailable');
    }
  }

  onZipInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.zipCode.set(input.value.replace(/\D/g, '').slice(0, 5));
  }
}
