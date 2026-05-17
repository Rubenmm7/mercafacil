import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { ToastService } from '../../../services/toast.service';
import { CreateUserRequest, UpdateUserRequest, UserAdmin, Role, StoreAdmin } from '../../../models/models';
import { IconComponent, IconName } from '../../icon/icon.component';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value as string;
  const confirm = group.get('confirmPassword')?.value as string;
  if (!pass && !confirm) return null;
  return pass === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosAdminComponent implements OnInit, OnDestroy {
  users = signal<UserAdmin[]>([]);
  loading = signal(true);
  error = signal('');
  saving = signal(false);

  searchQuery = signal('');
  sortCol = signal<'id' | 'nombre' | 'email' | 'rol'>('id');
  sortDir = signal<'asc' | 'desc'>('asc');

  readonly pageSize = 10;
  currentPage = signal(0);
  totalElements = signal(0);
  totalPages = signal(0);

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);

    const pages: number[] = [0];
    if (current > 2) pages.push(-1);
    for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 3) pages.push(-1);
    pages.push(total - 1);
    return pages;
  });

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  showModal = signal(false);
  modalMode = signal<'create' | 'edit'>('create');
  editUserId = signal<number | null>(null);
  modalRol = signal<string>('CLIENTE');

  allStores = signal<StoreAdmin[]>([]);
  storesLoading = signal(false);
  savingStore = signal<number | null>(null);
  showStoreModal = signal(false);
  storeSearch = signal('');

  currentVendorStore = computed(() =>
    this.allStores().find(s => s.vendedorId === this.editUserId()) ?? null
  );
  filteredStores = computed(() => {
    const q = this.storeSearch().toLowerCase();
    if (!q) return this.allStores();
    return this.allStores().filter(s =>
      s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)
    );
  });

  readonly roles: Role[] = ['ADMIN', 'CLIENTE', 'VENDEDOR', 'REPARTIDOR', 'PROVEEDOR'];

  form: FormGroup;

  constructor(
    private adminService: AdminService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      apellidos: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      rol: ['CLIENTE', Validators.required],
      password: [''],
      confirmPassword: ['']
    }, { validators: passwordsMatch });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.adminService.getUsers({
      search: this.searchQuery(),
      page: this.currentPage(),
      size: this.pageSize,
      sort: this.sortCol(),
      dir: this.sortDir()
    }).subscribe({
      next: result => {
        this.users.set(result.content);
        this.totalElements.set(result.totalElements);
        this.totalPages.set(result.totalPages);
        this.loading.set(false);
      },
      error: () => { this.error.set('No se pudieron cargar los usuarios'); this.loading.set(false); }
    });
  }

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.currentPage.set(0);
      this.loadUsers();
    }, 300);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
    this.loadUsers();
  }

  rangeStart(): number {
    return this.totalElements() === 0 ? 0 : this.currentPage() * this.pageSize + 1;
  }

  rangeEnd(): number {
    return Math.min(this.currentPage() * this.pageSize + this.users().length, this.totalElements());
  }

  openCreateModal(): void {
    this.modalMode.set('create');
    this.editUserId.set(null);
    this.modalRol.set('CLIENTE');
    this.form.reset({ rol: 'CLIENTE' });
    this.form.get('password')!.setValidators(Validators.required);
    this.form.get('confirmPassword')!.setValidators(Validators.required);
    this.form.get('password')!.updateValueAndValidity();
    this.form.get('confirmPassword')!.updateValueAndValidity();
    this.showModal.set(true);
  }

  openEditModal(user: UserAdmin): void {
    this.modalMode.set('edit');
    this.editUserId.set(user.id);
    this.modalRol.set(user.rol);
    this.form.reset({
      nombre: user.nombre,
      apellidos: user.apellidos,
      email: user.email,
      rol: user.rol,
      password: '',
      confirmPassword: ''
    });
    this.form.get('password')!.clearValidators();
    this.form.get('confirmPassword')!.clearValidators();
    this.form.get('password')!.updateValueAndValidity();
    this.form.get('confirmPassword')!.updateValueAndValidity();
    if (user.rol === 'VENDEDOR') {
      this.loadStores();
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.showStoreModal.set(false);
  }

  openStoreModal(): void {
    this.storeSearch.set('');
    if (this.allStores().length === 0) this.loadStores();
    this.showStoreModal.set(true);
  }

  closeStoreModal(): void {
    this.showStoreModal.set(false);
  }

  onRolChange(event: Event): void {
    const rol = (event.target as HTMLSelectElement).value;
    this.modalRol.set(rol);
    if (rol === 'VENDEDOR' && this.allStores().length === 0) {
      this.loadStores();
    }
  }

  loadStores(): void {
    this.storesLoading.set(true);
    this.adminService.getStores().subscribe({
      next: s => { this.allStores.set(s); this.storesLoading.set(false); },
      error: () => this.storesLoading.set(false)
    });
  }

  selectStore(store: StoreAdmin): void {
    const userId = this.editUserId();
    if (!userId || this.savingStore() !== null) return;
    const isAssigned = store.vendedorId === userId;
    const newVendedorId = isAssigned ? null : userId;
    this.savingStore.set(store.id);
    this.adminService.assignVendedor(store.id, newVendedorId).subscribe({
      next: () => {
        this.savingStore.set(null);
        if (!isAssigned) this.closeStoreModal();
        this.reloadStores();
      },
      error: () => {
        this.savingStore.set(null);
        this.toastService.showError('No se pudo actualizar la asignación');
      }
    });
  }

  private reloadStores(): void {
    this.adminService.getStores().subscribe({
      next: s => this.allStores.set(s),
      error: () => {}
    });
  }

  storeState(store: StoreAdmin): 'mine' | 'other' | 'free' {
    if (store.vendedorId === this.editUserId()) return 'mine';
    if (store.vendedorId !== null) return 'other';
    return 'free';
  }

  submitModal(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;

    if (this.modalMode() === 'create') {
      const req: CreateUserRequest = {
        nombre: v.nombre,
        apellidos: v.apellidos,
        email: v.email,
        password: v.password,
        rol: v.rol
      };
      this.saving.set(true);
      this.adminService.createUser(req).subscribe({
        next: created => {
          this.showModal.set(false);
          this.saving.set(false);
          this.toastService.showMessage({ body: `Usuario "${created.nombre}" creado correctamente`, title: 'Usuario creado' });
          this.loadUsers();
        },
        error: err => {
          this.saving.set(false);
          this.toastService.showError(err?.error?.message ?? 'No se pudo crear el usuario');
        }
      });
    } else {
      const req: UpdateUserRequest = {
        nombre: v.nombre,
        apellidos: v.apellidos,
        email: v.email,
        rol: v.rol,
        ...(v.password ? { password: v.password } : {})
      };
      this.saving.set(true);
      this.adminService.updateUser(this.editUserId()!, req).subscribe({
        next: updated => {
          this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
          this.showModal.set(false);
          this.saving.set(false);
          this.toastService.showMessage({ body: `Usuario "${updated.nombre}" actualizado`, title: 'Cambios guardados' });
        },
        error: err => {
          this.saving.set(false);
          this.toastService.showError(err?.error?.message ?? 'No se pudo actualizar el usuario');
        }
      });
    }
  }

  async deleteUser(userId: number, nombre: string): Promise<void> {
    const ok = await this.toastService.confirm(
      `¿Eliminar al usuario "${nombre}"? Esta acción no se puede deshacer.`,
      'Eliminar usuario'
    );
    if (!ok) return;
    this.adminService.deleteUser(userId).subscribe({
      next: () => {
        if (this.users().length === 1 && this.currentPage() > 0) {
          this.currentPage.update(p => p - 1);
        }
        this.loadUsers();
      },
      error: () => this.toastService.showError('No se pudo eliminar el usuario')
    });
  }

  sortBy(col: 'id' | 'nombre' | 'email' | 'rol'): void {
    if (this.sortCol() === col) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortCol.set(col);
      this.sortDir.set('asc');
    }
    this.currentPage.set(0);
    this.loadUsers();
  }

  sortIcon(col: 'id' | 'nombre' | 'email' | 'rol'): string {
    if (this.sortCol() !== col) return '↕';
    return this.sortDir() === 'asc' ? '↑' : '↓';
  }

  fieldError(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  get passwordMismatch(): boolean {
    return !!(this.form.hasError('passwordMismatch') &&
      this.form.get('confirmPassword')?.touched);
  }

  rolLabel(rol: Role): string {
    const labels: Record<Role, string> = {
      ADMIN: 'Admin',
      CLIENTE: 'Cliente',
      VENDEDOR: 'Vendedor',
      REPARTIDOR: 'Repartidor',
      PROVEEDOR: 'Proveedor'
    };
    return labels[rol];
  }

  rolIcon(rol: Role): IconName {
    const icons: Record<Role, IconName> = {
      ADMIN: 'shield',
      CLIENTE: 'shopping-bag',
      VENDEDOR: 'store',
      REPARTIDOR: 'bike',
      PROVEEDOR: 'package'
    };
    return icons[rol];
  }

  rolClass(rol: Role): string {
    const classes: Record<Role, string> = {
      ADMIN: 'badge-admin',
      CLIENTE: 'badge-cliente',
      VENDEDOR: 'badge-vendedor',
      REPARTIDOR: 'badge-repartidor',
      PROVEEDOR: 'badge-proveedor'
    };
    return classes[rol];
  }
}
