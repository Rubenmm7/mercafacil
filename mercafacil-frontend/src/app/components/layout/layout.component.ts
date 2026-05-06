import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  mobileMenuOpen = false;
  searchQuery = '';

  navLinks = [
    { path: '/', label: 'Inicio' },
    { path: '/tiendas', label: 'Tiendas' },
    { path: '/envio', label: 'Envío' }
  ];

  get chatVisible(): boolean {
    const rol = this.authService.user()?.rol;
    return !!rol && rol !== 'ADMIN';
  }

  get showChatsLink(): boolean {
    const rol = this.authService.user()?.rol;
    return rol === 'VENDEDOR' || rol === 'REPARTIDOR' || rol === 'PROVEEDOR';
  }

  footerNavLinks = [
    { path: '/', label: 'Inicio' },
    { path: '/tiendas', label: 'Tiendas' },
    { path: '/buscar', label: 'Buscar productos' },
    { path: '/envio', label: 'Información de envío' }
  ];

  footerStores = ['Mercadona', 'Carrefour', 'Lidl', 'Dia', 'Alcampo', 'El Corte Inglés'];
  footerSupport = ['Ayuda y FAQ', 'Política de envíos', 'Devoluciones', 'Contacto', 'Términos de uso', 'Privacidad'];

  constructor(
    public cartService: CartService,
    public authService: AuthService,
    public notificationService: NotificationService,
    private router: Router
  ) {}

  handleSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/buscar'], { state: { q: this.searchQuery.trim() } });
    }
  }

  toggleMobileMenu(): void { this.mobileMenuOpen = !this.mobileMenuOpen; }
  closeMobileMenu(): void  { this.mobileMenuOpen = false; }

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
  }
}
