import { Component, OnInit, signal } from '@angular/core';
import { AdminService } from '../../../services/admin.service';
import { ToastService } from '../../../services/toast.service';
import { StoreAdmin, UserAdmin } from '../../../models/models';

@Component({
  selector: 'app-admin-tiendas',
  standalone: true,
  imports: [],
  templateUrl: './tiendas.component.html',
  styleUrl: './tiendas.component.css'
})
export class TiendasAdminComponent implements OnInit {
  stores = signal<StoreAdmin[]>([]);
  vendedores = signal<UserAdmin[]>([]);
  loading = signal(true);
  saving = signal<number | null>(null);
  error = signal('');

  constructor(
    private adminService: AdminService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.adminService.getStores().subscribe({
      next: stores => {
        this.stores.set(stores);
        this.adminService.getUsers().subscribe({
          next: users => {
            this.vendedores.set(users.filter(u => u.rol === 'VENDEDOR'));
            this.loading.set(false);
          },
          error: () => { this.error.set('Error al cargar usuarios'); this.loading.set(false); }
        });
      },
      error: () => { this.error.set('Error al cargar tiendas'); this.loading.set(false); }
    });
  }

  onVendedorChange(store: StoreAdmin, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const vendedorId = select.value ? Number(select.value) : null;
    this.saving.set(store.id);
    this.adminService.assignVendedor(store.id, vendedorId).subscribe({
      next: updated => {
        this.stores.update(list => list.map(s => s.id === updated.id ? updated : s));
        this.saving.set(null);
        const nombre = updated.vendedorNombre ?? 'ninguno';
        this.toastService.showMessage({ body: `Vendedor de "${updated.name}" actualizado a ${nombre}`, title: 'Guardado' });
      },
      error: () => {
        this.saving.set(null);
        this.toastService.showError('No se pudo asignar el vendedor');
      }
    });
  }
}
