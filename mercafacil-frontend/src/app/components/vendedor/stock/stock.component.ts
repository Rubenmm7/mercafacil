import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VendedorService } from '../../../services/vendedor.service';
import { ToastService } from '../../../services/toast.service';
import { StoreOfferDetail } from '../../../models/models';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'app-vendedor-stock',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.css'
})
export class StockComponent implements OnInit {
  offers = signal<StoreOfferDetail[]>([]);
  loading = signal(true);
  saving = signal<number | null>(null);
  sending = signal(false);
  editing = signal<StoreOfferDetail | null>(null);
  requesting = signal<StoreOfferDetail | null>(null);
  error = signal('');

  stockForm = new FormGroup({
    stock: new FormControl<number>(0, [Validators.required, Validators.min(0)])
  });

  requestControl = new FormControl('', Validators.required);

  constructor(
    private vendedorService: VendedorService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.vendedorService.getLowStockOffers().subscribe({
      next: list => {
        this.offers.set(list.sort((a, b) => a.stock - b.stock));
        this.loading.set(false);
      },
      error: () => { this.error.set('Error al cargar las alertas de stock'); this.loading.set(false); }
    });
  }

  stockLevel(stock: number): 'none' | 'critical' | 'low' {
    if (stock === 0) return 'none';
    if (stock < 5) return 'critical';
    return 'low';
  }

  startEdit(offer: StoreOfferDetail): void {
    this.editing.set(offer);
    this.stockForm.setValue({ stock: offer.stock });
  }

  cancelEdit(): void { this.editing.set(null); }

  saveStock(): void {
    const offer = this.editing();
    if (!offer || this.stockForm.invalid) return;
    const stock = this.stockForm.value.stock!;
    this.saving.set(offer.id);
    this.vendedorService.updateOffer(offer.id, {
      price: offer.price,
      originalPrice: offer.originalPrice,
      stock,
      brand: offer.brand ?? ''
    }).subscribe({
      next: updated => {
        this.offers.update(list =>
          stock < 10
            ? list.map(o => o.id === updated.id ? updated : o).sort((a, b) => a.stock - b.stock)
            : list.filter(o => o.id !== updated.id)
        );
        this.editing.set(null);
        this.saving.set(null);
      },
      error: () => { this.toastService.showError('Error al guardar el stock'); this.saving.set(null); }
    });
  }

  openRequest(offer: StoreOfferDetail): void {
    this.requesting.set(offer);
    this.requestControl.setValue(
      `Necesito reponer "${offer.productName}" (stock actual: ${offer.stock} uds.) en ${offer.storeName}. ¿Cuándo podéis abastecer?`
    );
  }

  cancelRequest(): void { this.requesting.set(null); }

  sendRequest(): void {
    const offer = this.requesting();
    const mensaje = this.requestControl.value?.trim();
    if (!offer || !mensaje) return;
    this.sending.set(true);
    this.vendedorService.pedirAlProveedor(offer.id, mensaje).subscribe({
      next: () => {
        this.sending.set(false);
        this.requesting.set(null);
        this.toastService.showMessage({ body: 'Solicitud enviada al proveedor', senderRoleLabel: 'Vendedor' });
      },
      error: () => {
        this.sending.set(false);
        this.toastService.showError('Error al enviar la solicitud');
      }
    });
  }
}
