import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProveedorService } from '../../../services/proveedor.service';
import { EnvioStock, StoreOfferDetail, StoreWithLogo } from '../../../models/models';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'app-proveedor-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.css'
})
export class StockProveedorComponent implements OnInit, OnDestroy {
  stores = signal<StoreWithLogo[]>([]);
  selectedStore = signal<StoreWithLogo | null>(null);
  offers = signal<StoreOfferDetail[]>([]);
  envios = signal<EnvioStock[]>([]);
  cantidades: Record<number, number> = {};

  loadingOffers = signal(false);
  sending = signal(false);
  error = signal('');

  // Tick que actualiza el countdown cada segundo
  now = signal(Date.now());
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private proveedorService: ProveedorService) { }

  ngOnInit(): void {
    this.proveedorService.getStores().subscribe({
      next: list => this.stores.set(list),
      error: () => this.error.set('Error al cargar las tiendas')
    });
    this.proveedorService.getEnviosEnCurso().subscribe({
      next: list => this.envios.set(list)
    });
    this.intervalId = setInterval(() => {
      this.now.set(Date.now());
      // Eliminar envíos que ya han llegado
      this.envios.update(list =>
        list.filter(e => new Date(e.llegadaEstimada).getTime() > Date.now())
      );
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  selectStore(store: StoreWithLogo): void {
    this.selectedStore.set(store);
    this.cantidades = {};
    this.loadingOffers.set(true);
    this.error.set('');
    this.proveedorService.getStoreOffers(store.id).subscribe({
      next: list => { this.offers.set(list); this.loadingOffers.set(false); },
      error: () => { this.error.set('Error al cargar los productos'); this.loadingOffers.set(false); }
    });
  }

  tieneItems(): boolean {
    return Object.values(this.cantidades).some(v => v > 0);
  }

  enviar(): void {
    const store = this.selectedStore();
    if (!store) return;
    const items = Object.entries(this.cantidades)
      .filter(([, v]) => v > 0)
      .map(([offerId, cantidad]) => ({ offerId: Number(offerId), cantidad }));
    if (items.length === 0) return;

    this.sending.set(true);
    this.proveedorService.reponer({ storeId: store.id, items }).subscribe({
      next: envio => {
        this.envios.update(list => [...list, envio]);
        this.cantidades = {};
        this.sending.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Error al enviar el reaprovisionamiento');
        this.sending.set(false);
      }
    });
  }

  countdown(llegadaEstimada: string): string {
    const ms = new Date(llegadaEstimada).getTime() - this.now();
    if (ms <= 0) return 'Llegando...';
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }
}
