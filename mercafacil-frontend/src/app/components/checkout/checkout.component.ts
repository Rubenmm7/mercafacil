import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder, FormGroup, Validators,
  AbstractControl, ValidationErrors, ReactiveFormsModule
} from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { ApiService } from '../../services/api.service';

function luhnCheck(control: AbstractControl): ValidationErrors | null {
  const val: string = (control.value ?? '').replace(/\s/g, '');
  if (!/^\d{16}$/.test(val)) return null;
  let sum = 0;
  let alt = false;
  for (let i = val.length - 1; i >= 0; i--) {
    let n = parseInt(val[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0 ? null : { luhn: true };
}

function expiryNotPast(control: AbstractControl): ValidationErrors | null {
  const val: string = control.value ?? '';
  const match = val.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (!match) return null;
  const month = parseInt(match[1], 10);
  const year  = 2000 + parseInt(match[2], 10);
  return new Date(year, month, 1) <= new Date() ? { expiryPast: true } : null;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent {
  readonly cartItems   = computed(() => this.cartService.items());
  readonly subtotal    = computed(() =>
    this.cartItems().reduce((sum, i) => sum + i.price * i.quantity, 0)
  );
  readonly deliveryFee = 2.50;
  readonly total       = computed(() => this.subtotal() + this.deliveryFee);
  readonly submitting  = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private api: ApiService,
    private router: Router
  ) {
    this.form = this.fb.group({
      calle:      ['', [Validators.required, Validators.minLength(3)]],
      numero:     ['', [Validators.required, Validators.pattern(/^\d+\w*$/)]],
      piso:       [''],
      cp:         ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      ciudad:     ['', [Validators.required, Validators.minLength(2)]],
      provincia:  ['', [Validators.required, Validators.minLength(2)]],
      notas:      ['', [Validators.maxLength(300)]],
      cardName:   ['', [Validators.required, Validators.minLength(3)]],
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/), luhnCheck]],
      expiry:     ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/), expiryNotPast]],
      cvv:        ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]]
    });
  }

  get last4(): string {
    const n: string = this.form.get('cardNumber')?.value ?? '';
    return n.length >= 4 ? n.slice(-4) : '••••';
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  getError(field: string): string {
    const c = this.form.get(field);
    if (!c || !c.errors) return '';
    if (c.errors['required'])    return 'Campo obligatorio';
    if (c.errors['minlength'])   return `Mínimo ${c.errors['minlength'].requiredLength} caracteres`;
    if (c.errors['maxlength'])   return `Máximo ${c.errors['maxlength'].requiredLength} caracteres`;
    if (c.errors['pattern'])     return 'Formato no válido';
    if (c.errors['luhn'])        return 'Número de tarjeta no válido';
    if (c.errors['expiryPast'])  return 'Tarjeta caducada';
    return 'Valor no válido';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.submitting()) return;

    const v = this.form.value;
    const piso = (v.piso as string)?.trim() ? ` - ${(v.piso as string).trim()}` : '';
    const shippingAddress = `${v.calle}, ${v.numero}${piso}, ${v.cp} ${v.ciudad} (${v.provincia})`;
    const deliveryNotes: string | undefined = (v.notas as string)?.trim() || undefined;

    this.submitting.set(true);
    this.submitError.set(null);

    this.api.createOrder(this.cartItems(), shippingAddress, deliveryNotes).subscribe({
      next: () => {
        this.submitting.set(false);
        this.cartService.clear();
        this.router.navigate(['/pedidos']);
      },
      error: () => {
        this.submitError.set('No se pudo procesar el pedido. Inténtalo de nuevo.');
        this.submitting.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/carrito']);
  }
}
