import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-repartidor',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './repartidor.component.html',
  styleUrl: './repartidor.component.css'
})
export class RepartidorComponent {
  constructor(public authService: AuthService) {}
}
