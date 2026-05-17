import { Component, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder, FormGroup, Validators,
  AbstractControl, ValidationErrors, ReactiveFormsModule
} from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { ApiService } from '../../services/api.service';
import { MapsLoaderService } from '../../services/maps-loader.service';
import { IconComponent } from '../icon/icon.component';

type Prediction = { description: string; placeId: string };

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
  const year = 2000 + parseInt(match[2], 10);
  return new Date(year, month, 1) <= new Date() ? { expiryPast: true } : null;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, IconComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit, OnDestroy {
  readonly cartItems = computed(() => this.cartService.items());
  readonly subtotal = computed(() =>
    this.cartItems().reduce((sum, i) => sum + i.price * i.quantity, 0)
  );
  readonly deliveryFee = 2.50;
  readonly total = computed(() => this.subtotal() + this.deliveryFee);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly mapsReady = signal(false);
  readonly predictions = signal<Prediction[]>([]);
  readonly searchQuery = signal('');
  readonly showDropdown = signal(false);
  readonly confirmedAddress = signal<string | null>(null);
  readonly selectedLat = signal<number | null>(null);
  readonly selectedLng = signal<number | null>(null);

  readonly estimatedMinutes = signal<number | null>(null);

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;
  private cpSub: Subscription | null = null;

  readonly form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private api: ApiService,
    private router: Router,
    private mapsLoader: MapsLoaderService
  ) {
    this.form = this.fb.group({
      calle: ['', [Validators.required, Validators.minLength(3)]],
      numero: ['', [Validators.required, Validators.pattern(/^\d+\w*$/)]],
      piso: [''],
      cp: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      ciudad: ['', [Validators.required, Validators.minLength(2)]],
      provincia: ['', [Validators.required, Validators.minLength(2)]],
      notas: ['', [Validators.maxLength(300)]],
      cardName: ['', [Validators.required, Validators.minLength(3)]],
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/), luhnCheck]],
      expiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/), expiryNotPast]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]]
    });
  }

  ngOnInit(): void {
    this.mapsLoader.load().then(ok => this.mapsReady.set(ok));
    this.cpSub = this.form.get('cp')!.valueChanges.subscribe((cp: string) => {
      this.estimatedMinutes.set(this.calcularMinutos(cp));
    });
  }

  ngOnDestroy(): void {
    if (this.searchTimeout !== null) clearTimeout(this.searchTimeout);
    this.cpSub?.unsubscribe();
  }

  private calcularMinutos(cp: string | null): number | null {
    if (!cp || !/^\d{5}$/.test(cp.trim())) return null;
    const clean = cp.trim();
    if (clean.startsWith('230')) {
      const lastTwo = parseInt(clean.substring(3, 5), 10);
      if (lastTwo <= 19) return 14;
      if (lastTwo <= 39) return 15;
      if (lastTwo <= 59) return 16;
      if (lastTwo <= 79) return 17;
      return 18;
    }
    if (clean.startsWith('231')) return 19;
    if (clean.startsWith('232')) return 20;
    if (clean.startsWith('233')) return 21;
    if (clean.startsWith('234')) return 22;
    if (clean.startsWith('235')) return 23;
    return 18;
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    if (!value.trim()) { this.predictions.set([]); this.showDropdown.set(false); return; }
    if (this.searchTimeout !== null) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      if (typeof google === 'undefined' || !google?.maps?.places?.AutocompleteService) return;
      new google.maps.places.AutocompleteService().getPlacePredictions(
        { input: value, componentRestrictions: { country: 'ES' }, types: ['address'] },
        (results: any, status: any) => {
          if (status === 'OK' && results?.length) {
            this.predictions.set(results.map((r: any) => ({ description: r.description, placeId: r.place_id })));
            this.showDropdown.set(true);
          } else {
            this.predictions.set([]);
            this.showDropdown.set(false);
          }
        }
      );
    }, 300);
  }

  selectPrediction(p: Prediction): void {
    this.searchQuery.set(p.description);
    this.showDropdown.set(false);
    if (typeof google === 'undefined' || !google?.maps?.Geocoder) return;
    new google.maps.Geocoder().geocode({ placeId: p.placeId }, (results: any, status: any) => {
      if (status !== 'OK' || !results?.[0]) return;
      const result = results[0];
      const comps: any[] = result.address_components ?? [];
      const get = (type: string) => comps.find((c: any) => c.types.includes(type))?.long_name ?? '';

      const calle = get('route');
      const numero = get('street_number');
      const cp = get('postal_code');
      const ciudad = get('locality') || get('administrative_area_level_2');
      const provincia = get('administrative_area_level_2') || get('administrative_area_level_1');
      if (calle) this.form.get('calle')?.setValue(calle);
      if (numero) this.form.get('numero')?.setValue(numero);
      if (cp) this.form.get('cp')?.setValue(cp);
      if (ciudad) this.form.get('ciudad')?.setValue(ciudad);
      if (provincia) this.form.get('provincia')?.setValue(provincia);
      ['calle', 'numero', 'cp', 'ciudad', 'provincia'].forEach(f => this.form.get(f)?.markAsDirty());

      // Guardar dirección canónica de Google y coordenadas exactas
      this.confirmedAddress.set(result.formatted_address ?? null);
      const loc = result.geometry?.location;
      if (loc) {
        this.selectedLat.set(typeof loc.lat === 'function' ? loc.lat() : loc.lat);
        this.selectedLng.set(typeof loc.lng === 'function' ? loc.lng() : loc.lng);
      }
    });
  }

  hideDropdown(): void {
    setTimeout(() => this.showDropdown.set(false), 150);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.predictions.set([]);
    this.showDropdown.set(false);
    this.confirmedAddress.set(null);
    this.selectedLat.set(null);
    this.selectedLng.set(null);
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
    if (c.errors['required']) return 'Campo obligatorio';
    if (c.errors['minlength']) return `Mínimo ${c.errors['minlength'].requiredLength} caracteres`;
    if (c.errors['maxlength']) return `Máximo ${c.errors['maxlength'].requiredLength} caracteres`;
    if (c.errors['pattern']) return 'Formato no válido';
    if (c.errors['luhn']) return 'Número de tarjeta no válido';
    if (c.errors['expiryPast']) return 'Tarjeta caducada';
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
    const confirmed = this.confirmedAddress();
    const shippingAddress = confirmed
      ? `${confirmed}${piso}`
      : `${v.calle}, ${v.numero}${piso}, ${v.cp} ${v.ciudad}, ${v.provincia}`;
    const deliveryNotes: string | undefined = (v.notas as string)?.trim() || undefined;
    const deliveryLat = this.selectedLat() ?? undefined;
    const deliveryLng = this.selectedLng() ?? undefined;
    const postalCode = (v.cp as string)?.trim() || undefined;

    this.submitting.set(true);
    this.submitError.set(null);

    this.api.createOrder(this.cartItems(), shippingAddress, deliveryNotes, deliveryLat, deliveryLng, postalCode).subscribe({
      next: () => {
        this.submitting.set(false);
        this.cartService.clear();
        this.router.navigate(['/pedidos']);
      },
      error: (err) => {
        const msg = err?.error?.message;
        this.submitError.set(msg ?? 'No se pudo procesar el pedido. Inténtalo de nuevo.');
        this.submitting.set(false);
      }
    });
  }

  fillTestData(): void {
    this.form.patchValue({
      cardName: 'Juan García López',
      cardNumber: '4532015112830366',
      expiry: '12/27',
      cvv: '123'
    });
    ['cardName', 'cardNumber', 'expiry', 'cvv'].forEach(f => this.form.get(f)?.markAsDirty());
  }

  goBack(): void {
    this.router.navigate(['/carrito']);
  }
}
