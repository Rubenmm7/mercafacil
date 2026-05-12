import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VendedorService } from '../../../services/vendedor.service';
import { Store, StoreOfferDetail } from '../../../models/models';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'app-vendedor-ofertas',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, IconComponent],
  templateUrl: './ofertas.component.html',
  styleUrl: './ofertas.component.css'
})
export class OfertasComponent implements OnInit {
  stores        = signal<Store[]>([]);
  offers        = signal<StoreOfferDetail[]>([]);
  selectedStore = signal<Store | null>(null);
  loading       = signal(false);
  saving        = signal<number | null>(null);
  editing       = signal<StoreOfferDetail | null>(null);
  error         = signal('');

  form = new FormGroup({
    price:         new FormControl<number>(0, [Validators.required, Validators.min(0)]),
    originalPrice: new FormControl<number | null>(null),
    stock:         new FormControl<number>(0, [Validators.required, Validators.min(0)]),
    brand:         new FormControl('')
  });

  constructor(private vendedorService: VendedorService) {}

  ngOnInit(): void {
    this.vendedorService.getStores().subscribe(s => {
      this.stores.set(s);
      if (s.length > 0) this.selectStore(s[0]);
    });
  }

  selectStore(store: Store): void {
    this.selectedStore.set(store);
    this.editing.set(null);
    this.loading.set(true);
    this.vendedorService.getOffersByStore(store.id).subscribe({
      next: list => { this.offers.set(list); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar ofertas'); this.loading.set(false); }
    });
  }

  startEdit(offer: StoreOfferDetail): void {
    this.editing.set(offer);
    this.form.patchValue({ price: offer.price, originalPrice: offer.originalPrice ?? null, stock: offer.stock, brand: offer.brand });
  }

  cancelEdit(): void { this.editing.set(null); }

  saveOffer(): void {
    const offer = this.editing();
    if (!offer || this.form.invalid) return;
    this.saving.set(offer.id);
    const { price, originalPrice, stock, brand } = this.form.value;
    this.vendedorService.updateOffer(offer.id, {
      price: price!, originalPrice: originalPrice ?? undefined, stock: stock!, brand: brand ?? ''
    }).subscribe({
      next: updated => {
        this.offers.update(list => list.map(o => o.id === updated.id ? updated : o));
        this.editing.set(null);
        this.saving.set(null);
      },
      error: () => { this.error.set('Error al guardar la oferta'); this.saving.set(null); }
    });
  }

  isLowStock(stock: number): boolean { return stock < 10; }
}
