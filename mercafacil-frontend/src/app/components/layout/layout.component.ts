import { Component, HostListener, OnInit, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ApiService } from '../../services/api.service';
import { Store } from '../../models/models';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { FREE_DELIVERY_THRESHOLD_EUR } from '../../utils/business-rules';
import { FOOTER_NAV_LINKS, FOOTER_SUPPORT_LINKS, MAIN_NAV_LINKS, getRoleNavLinks } from '../../config/navigation';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, IconComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit {
  mobileMenuOpen = false;
  readonly freeDeliveryThreshold = FREE_DELIVERY_THRESHOLD_EUR;

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

  readonly navLinks = MAIN_NAV_LINKS;
  readonly footerNavLinks = FOOTER_NAV_LINKS;
  readonly footerSupport = FOOTER_SUPPORT_LINKS;
  readonly roleNavLinks = computed(() => getRoleNavLinks(this.authService.user()?.rol));

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

  toggleMobileMenu(): void { this.mobileMenuOpen = !this.mobileMenuOpen; }
  closeMobileMenu(): void { this.mobileMenuOpen = false; }

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
  }
}
