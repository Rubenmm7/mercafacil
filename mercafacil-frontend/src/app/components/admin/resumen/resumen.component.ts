import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { AdminStats } from '../../../models/models';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'app-admin-resumen',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './resumen.component.html',
  styleUrl: './resumen.component.css'
})
export class ResumenAdminComponent implements OnInit {
  stats = signal<AdminStats | null>(null);
  loading = signal(true);
  error = signal('');

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.adminService.getStats().subscribe({
      next: s => { this.stats.set(s); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar las estadísticas'); this.loading.set(false); }
    });
  }
}
