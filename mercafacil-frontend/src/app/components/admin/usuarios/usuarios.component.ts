import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { ToastService } from '../../../services/toast.service';
import { UserAdmin, Role } from '../../../models/models';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosAdminComponent implements OnInit {
  users      = signal<UserAdmin[]>([]);
  loading    = signal(true);
  error      = signal('');
  editingId  = signal<number | null>(null);
  editingRol = signal<Role>('CLIENTE');
  saving     = signal(false);

  readonly roles: Role[] = ['ADMIN', 'CLIENTE', 'VENDEDOR', 'REPARTIDOR', 'PROVEEDOR'];

  constructor(
    private adminService: AdminService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.adminService.getUsers().subscribe({
      next: u => { this.users.set(u); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar los usuarios'); this.loading.set(false); }
    });
  }

  startEdit(user: UserAdmin): void {
    this.editingId.set(user.id);
    this.editingRol.set(user.rol);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveRole(userId: number): void {
    this.saving.set(true);
    this.adminService.changeRole(userId, this.editingRol()).subscribe({
      next: updated => {
        this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.editingId.set(null);
        this.saving.set(false);
      },
      error: () => { this.saving.set(false); }
    });
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
