import { Component, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { ToastService } from '../../../services/toast.service';
import { CreateUserRequest, UpdateUserRequest, UserAdmin, Role } from '../../../models/models';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pass    = group.get('password')?.value as string;
  const confirm = group.get('confirmPassword')?.value as string;
  if (!pass && !confirm) return null;
  return pass === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosAdminComponent implements OnInit {
  users   = signal<UserAdmin[]>([]);
  loading = signal(true);
  error   = signal('');
  saving  = signal(false);

  showModal  = signal(false);
  modalMode  = signal<'create' | 'edit'>('create');
  editUserId = signal<number | null>(null);

  readonly roles: Role[] = ['ADMIN', 'CLIENTE', 'VENDEDOR', 'REPARTIDOR', 'PROVEEDOR'];

  form: FormGroup;

  constructor(
    private adminService: AdminService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      nombre:          ['', Validators.required],
      apellidos:       ['', Validators.required],
      email:           ['', [Validators.required, Validators.email]],
      rol:             ['CLIENTE', Validators.required],
      password:        [''],
      confirmPassword: ['']
    }, { validators: passwordsMatch });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.adminService.getUsers().subscribe({
      next: u  => { this.users.set(u); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar los usuarios'); this.loading.set(false); }
    });
  }

  openCreateModal(): void {
    this.modalMode.set('create');
    this.editUserId.set(null);
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
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
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
          this.users.update(list => [...list, created]);
          this.showModal.set(false);
          this.saving.set(false);
          this.toastService.showMessage({ body: `Usuario "${created.nombre}" creado correctamente`, title: '✓ Creado' });
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
          this.toastService.showMessage({ body: `Usuario "${updated.nombre}" actualizado`, title: '✓ Guardado' });
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
      next: () => this.users.update(list => list.filter(u => u.id !== userId)),
      error: () => this.toastService.showError('No se pudo eliminar el usuario')
    });
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
      ADMIN: '🛡️ Admin',
      CLIENTE: '🛍️ Cliente',
      VENDEDOR: '🏪 Vendedor',
      REPARTIDOR: '🛵 Repartidor',
      PROVEEDOR: '📦 Proveedor'
    };
    return labels[rol];
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
