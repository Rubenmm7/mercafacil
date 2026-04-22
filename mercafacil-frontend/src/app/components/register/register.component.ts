import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  nombre = '';
  apellidos = '';
  email = '';
  password = '';
  confirmPassword = '';
  errorMsg = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    if (this.password !== this.confirmPassword) {
      this.errorMsg = 'Las contraseñas no coinciden.';
      return;
    }
    this.errorMsg = '';
    this.loading = true;
    this.auth.register(this.nombre, this.apellidos, this.email, this.password).subscribe({
      next: () => this.router.navigate(['/']),
      error: err => {
        this.errorMsg = err.error?.message || 'Error al registrarse. El email podría estar en uso.';
        this.loading = false;
      }
    });
  }
}
