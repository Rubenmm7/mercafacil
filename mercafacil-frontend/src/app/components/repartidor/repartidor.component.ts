import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-repartidor',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './repartidor.component.html',
  styleUrl: './repartidor.component.css'
})
export class RepartidorComponent {
  constructor(public authService: AuthService) { }
}
