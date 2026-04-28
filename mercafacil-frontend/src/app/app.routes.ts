import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { SearchComponent } from './components/search/search.component';
import { StoresComponent } from './components/stores/stores.component';
import { ShippingComponent } from './components/shipping/shipping.component';
import { CartComponent } from './components/cart/cart.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ChatComponent } from './components/chat/chat.component';
import { ChatsListComponent } from './components/chats-list/chats-list.component';
import { OrdersComponent } from './components/orders/orders.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '',        component: HomeComponent },
  { path: 'buscar',  component: SearchComponent },
  { path: 'tiendas', component: StoresComponent },
  { path: 'envio',   component: ShippingComponent },
  { path: 'carrito', component: CartComponent, canActivate: [authGuard] },
  { path: 'pedidos', component: OrdersComponent, canActivate: [roleGuard('CLIENTE')] },
  { path: 'login',   component: LoginComponent },
  { path: 'registro', component: RegisterComponent },

  // Bandeja de chats
  {
    path: 'chats',
    component: ChatsListComponent,
    canActivate: [roleGuard('CLIENTE', 'VENDEDOR', 'REPARTIDOR', 'PROVEEDOR')]
  },

  // Chat por pedido: /chat/order/:orderId/:chatType
  {
    path: 'chat/order/:orderId/:chatType',
    component: ChatComponent,
    canActivate: [roleGuard('CLIENTE', 'VENDEDOR', 'REPARTIDOR')]
  },
  // Chat por tienda: /chat/shop/:shopId
  {
    path: 'chat/shop/:shopId',
    component: ChatComponent,
    canActivate: [roleGuard('VENDEDOR', 'PROVEEDOR')]
  },

  { path: '**', redirectTo: '' }
];
