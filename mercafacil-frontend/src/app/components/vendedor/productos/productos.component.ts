import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VendedorService } from '../../../services/vendedor.service';
import { ToastService } from '../../../services/toast.service';
import { ProductDetail, Store } from '../../../models/models';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'app-vendedor-productos',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosComponent implements OnInit {
  products = signal<ProductDetail[]>([]);
  stores = signal<Store[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  editing = signal<ProductDetail | null>(null);
  showForm = signal(false);

  form = new FormGroup({
    name: new FormControl('', Validators.required),
    category: new FormControl('', Validators.required),
    description: new FormControl(''),
    unit: new FormControl('', Validators.required),
    image: new FormControl(''),
    storeId: new FormControl<number | null>(null)
  });

  constructor(
    private vendedorService: VendedorService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.vendedorService.getStores().subscribe(s => this.stores.set(s));
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.vendedorService.getProducts().subscribe({
      next: list => { this.products.set(list); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar productos'); this.loading.set(false); }
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.reset();
    this.showForm.set(true);
  }

  openEdit(p: ProductDetail): void {
    this.editing.set(p);
    this.form.patchValue({ name: p.name, category: p.category, description: p.description, unit: p.unit, image: p.image });
    this.showForm.set(true);
  }

  cancel(): void { this.showForm.set(false); }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const { name, category, description, unit, image, storeId } = this.form.value;
    const current = this.editing();
    if (!current && !storeId) {
      this.error.set('Selecciona una tienda');
      this.saving.set(false);
      return;
    }
    const data = { name: name!, category: category!, description: description ?? '', unit: unit!, image: image ?? '' };

    const req = current
      ? this.vendedorService.updateProduct(current.id, data)
      : this.vendedorService.createProduct(data, storeId!);

    req.subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.loadProducts(); },
      error: () => { this.saving.set(false); this.error.set('Error al guardar el producto'); }
    });
  }

  async delete(p: ProductDetail): Promise<void> {
    const ok = await this.toastService.confirm(`¿Eliminar "${p.name}"?`, 'Eliminar producto');
    if (!ok) return;
    this.vendedorService.deleteProduct(p.id).subscribe({
      next: () => this.products.update(list => list.filter(x => x.id !== p.id)),
      error: () => this.toastService.showError('No se pudo eliminar el producto')
    });
  }
}
