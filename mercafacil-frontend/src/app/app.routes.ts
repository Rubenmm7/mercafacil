import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { SearchComponent } from './components/search/search.component';
import { StoresComponent } from './components/stores/stores.component';
import { ShippingComponent } from './components/shipping/shipping.component';
import { CartComponent } from './components/cart/cart.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '',       component: HomeComponent },
  { path: 'buscar', component: SearchComponent },
  { path: 'tiendas', component: StoresComponent },
  { path: 'envio',  component: ShippingComponent },
  { path: 'carrito', component: CartComponent, canActivate: [authGuard] },
  { path: 'login',   component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: '**', redirectTo: '' }
];
