import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-vendedor',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './vendedor.component.html',
  styleUrl: './vendedor.component.css'
})
export class VendedorComponent {
  constructor(public authService: AuthService) {}
}
