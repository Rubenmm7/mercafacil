import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProveedorService } from '../../../services/proveedor.service';
import { ProveedorStats } from '../../../models/models';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'app-proveedor-resumen',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './resumen.component.html',
  styleUrl: './resumen.component.css'
})
export class ResumenProveedorComponent implements OnInit {
  stats   = signal<ProveedorStats | null>(null);
  loading = signal(true);
  error   = signal('');

  constructor(private proveedorService: ProveedorService) {}

  ngOnInit(): void {
    this.proveedorService.getStats().subscribe({
      next: s => { this.stats.set(s); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar las estadísticas'); this.loading.set(false); }
    });
  }
}
