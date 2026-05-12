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
import { OrderDetailComponent } from './components/order-detail/order-detail.component';
import { VendedorComponent } from './components/vendedor/vendedor.component';
import { ResumenComponent } from './components/vendedor/resumen/resumen.component';
import { PedidosComponent } from './components/vendedor/pedidos/pedidos.component';
import { ProductosComponent } from './components/vendedor/productos/productos.component';
import { OfertasComponent } from './components/vendedor/ofertas/ofertas.component';
import { RepartidorComponent } from './components/repartidor/repartidor.component';
import { ResumenRepartidorComponent } from './components/repartidor/resumen/resumen.component';
import { EntregasComponent } from './components/repartidor/entregas/entregas.component';
import { ProveedorComponent } from './components/proveedor/proveedor.component';
import { ResumenProveedorComponent } from './components/proveedor/resumen/resumen.component';
import { TiendasProveedorComponent } from './components/proveedor/tiendas/tiendas.component';
import { AdminComponent } from './components/admin/admin.component';
import { ResumenAdminComponent } from './components/admin/resumen/resumen.component';
import { UsuariosAdminComponent } from './components/admin/usuarios/usuarios.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { InfoPageComponent } from './components/info-page/info-page.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '',        component: HomeComponent },
  { path: 'buscar',  component: SearchComponent },
  { path: 'tiendas', component: StoresComponent },
  { path: 'envio',   component: ShippingComponent },
  { path: 'carrito',  component: CartComponent,     canActivate: [authGuard] },
  { path: 'pago', component: CheckoutComponent, canActivate: [roleGuard('CLIENTE')] },
  { path: 'pedidos', component: OrdersComponent, canActivate: [roleGuard('CLIENTE')] },
  { path: 'pedidos/:id', component: OrderDetailComponent, canActivate: [roleGuard('CLIENTE')] },
  { path: 'login',   component: LoginComponent },
  { path: 'registro', component: RegisterComponent },

  // Páginas de información / soporte
  { path: 'ayuda',        component: InfoPageComponent, data: { pageId: 'ayuda' } },
  { path: 'devoluciones', component: InfoPageComponent, data: { pageId: 'devoluciones' } },
  { path: 'contacto',     component: InfoPageComponent, data: { pageId: 'contacto' } },
  { path: 'terminos',     component: InfoPageComponent, data: { pageId: 'terminos' } },
  { path: 'privacidad',   component: InfoPageComponent, data: { pageId: 'privacidad' } },

  // Dashboard Vendedor
  {
    path: 'vendedor',
    component: VendedorComponent,
    canActivate: [roleGuard('VENDEDOR')],
    children: [
      { path: '',        redirectTo: 'resumen', pathMatch: 'full' },
      { path: 'resumen',   component: ResumenComponent },
      { path: 'pedidos',   component: PedidosComponent },
      { path: 'productos', component: ProductosComponent },
      { path: 'ofertas',   component: OfertasComponent }
    ]
  },

  // Dashboard Repartidor
  {
    path: 'repartidor',
    component: RepartidorComponent,
    canActivate: [roleGuard('REPARTIDOR')],
    children: [
      { path: '',         redirectTo: 'resumen', pathMatch: 'full' },
      { path: 'resumen',  component: ResumenRepartidorComponent },
      { path: 'entregas', component: EntregasComponent }
    ]
  },

  // Dashboard Proveedor
  {
    path: 'proveedor',
    component: ProveedorComponent,
    canActivate: [roleGuard('PROVEEDOR')],
    children: [
      { path: '',        redirectTo: 'resumen', pathMatch: 'full' },
      { path: 'resumen', component: ResumenProveedorComponent },
      { path: 'tiendas', component: TiendasProveedorComponent }
    ]
  },

  // Dashboard Admin
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [roleGuard('ADMIN')],
    children: [
      { path: '',         redirectTo: 'resumen', pathMatch: 'full' },
      { path: 'resumen',  component: ResumenAdminComponent },
      { path: 'usuarios', component: UsuariosAdminComponent }
    ]
  },

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
