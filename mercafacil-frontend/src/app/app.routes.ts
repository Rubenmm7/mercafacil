import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

const loadHome = () => import('./components/home/home.component').then(m => m.HomeComponent);
const loadSearch = () => import('./components/search/search.component').then(m => m.SearchComponent);
const loadStores = () => import('./components/stores/stores.component').then(m => m.StoresComponent);
const loadShipping = () => import('./components/shipping/shipping.component').then(m => m.ShippingComponent);
const loadCart = () => import('./components/cart/cart.component').then(m => m.CartComponent);
const loadLogin = () => import('./components/login/login.component').then(m => m.LoginComponent);
const loadRegister = () => import('./components/register/register.component').then(m => m.RegisterComponent);
const loadChat = () => import('./components/chat/chat.component').then(m => m.ChatComponent);
const loadChatsList = () => import('./components/chats-list/chats-list.component').then(m => m.ChatsListComponent);
const loadOrders = () => import('./components/orders/orders.component').then(m => m.OrdersComponent);
const loadOrderDetail = () => import('./components/order-detail/order-detail.component').then(m => m.OrderDetailComponent);
const loadVendedor = () => import('./components/vendedor/vendedor.component').then(m => m.VendedorComponent);
const loadVendedorChatsList = () => import('./components/chats-list/chats-list.component').then(m => m.ChatsListComponent);
const loadVendedorChat = () => import('./components/chat/chat.component').then(m => m.ChatComponent);
const loadVendedorResumen = () => import('./components/vendedor/resumen/resumen.component').then(m => m.ResumenComponent);
const loadVendedorPedidos = () => import('./components/vendedor/pedidos/pedidos.component').then(m => m.PedidosComponent);
const loadVendedorProductos = () => import('./components/vendedor/productos/productos.component').then(m => m.ProductosComponent);
const loadVendedorOfertas = () => import('./components/vendedor/ofertas/ofertas.component').then(m => m.OfertasComponent);
const loadVendedorStock = () => import('./components/vendedor/stock/stock.component').then(m => m.StockComponent);
const loadRepartidor = () => import('./components/repartidor/repartidor.component').then(m => m.RepartidorComponent);
const loadRepartidorResumen = () => import('./components/repartidor/resumen/resumen.component').then(m => m.ResumenRepartidorComponent);
const loadEntregas = () => import('./components/repartidor/entregas/entregas.component').then(m => m.EntregasComponent);
const loadProveedor = () => import('./components/proveedor/proveedor.component').then(m => m.ProveedorComponent);
const loadProveedorResumen = () => import('./components/proveedor/resumen/resumen.component').then(m => m.ResumenProveedorComponent);
const loadProveedorTiendas = () => import('./components/proveedor/tiendas/tiendas.component').then(m => m.TiendasProveedorComponent);
const loadProveedorStock = () => import('./components/proveedor/stock/stock.component').then(m => m.StockProveedorComponent);
const loadAdmin = () => import('./components/admin/admin.component').then(m => m.AdminComponent);
const loadAdminResumen = () => import('./components/admin/resumen/resumen.component').then(m => m.ResumenAdminComponent);
const loadAdminUsuarios = () => import('./components/admin/usuarios/usuarios.component').then(m => m.UsuariosAdminComponent);
const loadAdminTiendas = () => import('./components/admin/tiendas/tiendas.component').then(m => m.TiendasAdminComponent);
const loadCheckout = () => import('./components/checkout/checkout.component').then(m => m.CheckoutComponent);
const loadProductDetail = () => import('./components/product-detail/product-detail.component').then(m => m.ProductDetailComponent);
const loadInfoPage = () => import('./components/info-page/info-page.component').then(m => m.InfoPageComponent);

export const routes: Routes = [
  { path: '', loadComponent: loadHome },
  { path: 'buscar', loadComponent: loadSearch },
  { path: 'tiendas', loadComponent: loadStores },
  { path: 'envio', loadComponent: loadShipping },
  { path: 'carrito', loadComponent: loadCart, canActivate: [roleGuard('CLIENTE')] },
  { path: 'pago', loadComponent: loadCheckout, canActivate: [roleGuard('CLIENTE')] },
  { path: 'producto/:id', loadComponent: loadProductDetail },
  { path: 'pedidos', loadComponent: loadOrders, canActivate: [roleGuard('CLIENTE')] },
  { path: 'pedidos/:id', loadComponent: loadOrderDetail, canActivate: [roleGuard('CLIENTE')] },
  { path: 'login', loadComponent: loadLogin },
  { path: 'registro', loadComponent: loadRegister },

  // Páginas de información / soporte
  { path: 'ayuda', loadComponent: loadInfoPage, data: { pageId: 'ayuda' } },
  { path: 'devoluciones', loadComponent: loadInfoPage, data: { pageId: 'devoluciones' } },
  { path: 'contacto', loadComponent: loadInfoPage, data: { pageId: 'contacto' } },
  { path: 'terminos', loadComponent: loadInfoPage, data: { pageId: 'terminos' } },
  { path: 'privacidad', loadComponent: loadInfoPage, data: { pageId: 'privacidad' } },
  { path: 'politicas-envio', loadComponent: loadInfoPage, data: { pageId: 'politicas-envio' } },

  // Dashboard Vendedor
  {
    path: 'vendedor',
    loadComponent: loadVendedor,
    canActivate: [roleGuard('VENDEDOR')],
    children: [
      { path: '', redirectTo: 'resumen', pathMatch: 'full' },
      { path: 'resumen', loadComponent: loadVendedorResumen },
      { path: 'pedidos', loadComponent: loadVendedorPedidos },
      { path: 'productos', loadComponent: loadVendedorProductos },
      { path: 'ofertas', loadComponent: loadVendedorOfertas },
      { path: 'stock', loadComponent: loadVendedorStock },
      { path: 'chats', loadComponent: loadVendedorChatsList, data: { chatBasePath: '/vendedor/chats' } },
      { path: 'chats/order/:orderId/:chatType', loadComponent: loadVendedorChat, data: { backPath: '/vendedor/chats' } },
      { path: 'chats/shop/:shopId', loadComponent: loadVendedorChat, data: { backPath: '/vendedor/chats' } }
    ]
  },

  // Dashboard Repartidor
  {
    path: 'repartidor',
    loadComponent: loadRepartidor,
    canActivate: [roleGuard('REPARTIDOR')],
    children: [
      { path: '', redirectTo: 'resumen', pathMatch: 'full' },
      { path: 'resumen', loadComponent: loadRepartidorResumen },
      { path: 'entregas', loadComponent: loadEntregas },
      { path: 'chats', loadComponent: loadChatsList, data: { chatBasePath: '/repartidor/chats' } },
      { path: 'chats/order/:orderId/:chatType', loadComponent: loadChat, data: { backPath: '/repartidor/chats' } },
      { path: 'chats/shop/:shopId', loadComponent: loadChat, data: { backPath: '/repartidor/chats' } }
    ]
  },

  // Dashboard Proveedor
  {
    path: 'proveedor',
    loadComponent: loadProveedor,
    canActivate: [roleGuard('PROVEEDOR')],
    children: [
      { path: '', redirectTo: 'resumen', pathMatch: 'full' },
      { path: 'resumen', loadComponent: loadProveedorResumen },
      { path: 'tiendas', loadComponent: loadProveedorTiendas },
      { path: 'stock', loadComponent: loadProveedorStock },
      { path: 'chats', loadComponent: loadChatsList, data: { chatBasePath: '/proveedor/chats' } },
      { path: 'chats/shop/:shopId', loadComponent: loadChat, data: { backPath: '/proveedor/chats' } }
    ]
  },

  // Dashboard Admin
  {
    path: 'admin',
    loadComponent: loadAdmin,
    canActivate: [roleGuard('ADMIN')],
    children: [
      { path: '', redirectTo: 'resumen', pathMatch: 'full' },
      { path: 'resumen', loadComponent: loadAdminResumen },
      { path: 'usuarios', loadComponent: loadAdminUsuarios },
      { path: 'tiendas', loadComponent: loadAdminTiendas },
    ]
  },

  // Bandeja de chats
  {
    path: 'chats',
    loadComponent: loadChatsList,
    canActivate: [roleGuard('CLIENTE', 'VENDEDOR', 'REPARTIDOR', 'PROVEEDOR')]
  },

  // Chat por pedido: /chat/order/:orderId/:chatType
  {
    path: 'chat/order/:orderId/:chatType',
    loadComponent: loadChat,
    canActivate: [roleGuard('CLIENTE', 'VENDEDOR', 'REPARTIDOR')]
  },
  // Chat por tienda: /chat/shop/:shopId
  {
    path: 'chat/shop/:shopId',
    loadComponent: loadChat,
    canActivate: [roleGuard('VENDEDOR', 'PROVEEDOR')]
  },

  { path: '**', redirectTo: '' }
];
