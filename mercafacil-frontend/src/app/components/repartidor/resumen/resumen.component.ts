import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RepartidorService } from '../../../services/repartidor.service';
import { RepartidorStats } from '../../../models/models';

@Component({
  selector: 'app-repartidor-resumen',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './resumen.component.html',
  styleUrl: './resumen.component.css'
})
export class ResumenRepartidorComponent implements OnInit {
  stats   = signal<RepartidorStats | null>(null);
  loading = signal(true);
  error   = signal('');

  constructor(private repartidorService: RepartidorService) {}

  ngOnInit(): void {
    this.repartidorService.getStats().subscribe({
      next: s => { this.stats.set(s); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar estadísticas'); this.loading.set(false); }
    });
  }
}
