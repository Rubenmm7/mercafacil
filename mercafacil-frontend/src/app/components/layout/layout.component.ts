import { Component, HostListener, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ApiService } from '../../services/api.service';
import { Store } from '../../models/models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule, IconComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit {
  mobileMenuOpen = false;
  searchQuery = '';

  readonly isDark = signal(
    localStorage.getItem('mf-dark') === '1' ||
    (!localStorage.getItem('mf-dark') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  private readonly _footerStores = signal<Store[]>([]);
  get footerStores(): Store[] { return this._footerStores(); }

  readonly showScrollBtn = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.showScrollBtn.set(window.scrollY > 300);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navLinks = [
    { path: '/', label: 'Inicio' },
    { path: '/tiendas', label: 'Tiendas' },
    { path: '/envio', label: 'Envío' }
  ];

  get showChatsLink(): boolean {
    const rol = this.authService.user()?.rol;
    return rol === 'VENDEDOR' || rol === 'REPARTIDOR' || rol === 'PROVEEDOR';
  }

  footerNavLinks = [
    { path: '/', label: 'Inicio' },
    { path: '/tiendas', label: 'Tiendas' },
    { path: '/buscar', label: 'Buscar productos' },
    { path: '/politicas-envio', label: 'Políticas de envío' }
  ];

  footerSupport = [
    { label: 'Ayuda y FAQ', path: '/ayuda' },
    { label: 'Políticas de envío', path: '/politicas-envio' },
    { label: 'Devoluciones', path: '/devoluciones' },
    { label: 'Contacto', path: '/contacto' },
    { label: 'Términos de uso', path: '/terminos' },
    { label: 'Privacidad', path: '/privacidad' },
  ];

  constructor(
    public cartService: CartService,
    public authService: AuthService,
    public notificationService: NotificationService,
    private router: Router,
    private api: ApiService
  ) {
    document.documentElement.classList.toggle('dark', this.isDark());
  }

  ngOnInit(): void {
    this.api.getStores().subscribe(stores => this._footerStores.set(stores));
  }

  navigateToStore(store: Store): void {
    this.router.navigate(['/buscar'], { queryParams: { storeId: store.id } });
  }

  toggleDark(): void {
    const next = !this.isDark();
    this.isDark.set(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('mf-dark', next ? '1' : '0');
  }

  handleSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/buscar'], { state: { q: this.searchQuery.trim() } });
    }
  }

  toggleMobileMenu(): void { this.mobileMenuOpen = !this.mobileMenuOpen; }
  closeMobileMenu(): void { this.mobileMenuOpen = false; }

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
  }
}
