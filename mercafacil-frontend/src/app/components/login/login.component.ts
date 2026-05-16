import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  readonly errorMsg = signal('');
  readonly loading = signal(false);

  readonly demoAccounts = [
    { role: 'Admin',       email: 'admin@mercafacil.com',       password: 'admin123' },
    { role: 'Cliente',     email: 'cliente@mercafacil.com',     password: 'cliente123' },
    { role: 'Vendedor',    email: 'vendedor@mercafacil.com',    password: 'vendedor123' },
    { role: 'Repartidor',  email: 'repartidor@mercafacil.com',  password: 'repartidor123' },
    { role: 'Proveedor',   email: 'proveedor@mercafacil.com',   password: 'proveedor123' },
  ];

  fillDemo(account: { email: string; password: string }): void {
    this.email = account.email;
    this.password = account.password;
    this.errorMsg.set('');
  }

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  onSubmit(): void {
    this.errorMsg.set('');
    this.loading.set(true);
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: () => {
        this.errorMsg.set('Credenciales incorrectas. Inténtalo de nuevo.');
        this.loading.set(false);
      }
    });
  }
}
