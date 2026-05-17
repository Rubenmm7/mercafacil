export interface Store {
  id: number;
  name: string;
  logo: string;
  logoUrl?: string;
  color: string;
  bgColor: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
  rating: number;
  deliveryTime: string;
  minOrder: number;
  deliveryFee: number;
  category: string;
}

export type StoreWithLogo = Store & {
  logoUrl?: string;
};

export interface StoreOffer {
  storeId: number;
  storeName: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  brand: string;
}

// --- Admin dashboard ---
export interface StoreAdmin {
  id: number;
  name: string;
  address: string;
  city: string;
  vendedorId: number | null;
  vendedorNombre: string | null;
}

export interface AdminStats {
  totalUsers: number;
  totalStores: number;
  totalOrders: number;
  clienteCount: number;
  vendedorCount: number;
  repartidorCount: number;
  proveedorCount: number;
  adminCount: number;
}

export interface UserAdmin {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  rol: Role;
}

export interface CreateUserRequest {
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  rol: Role;
}

export interface UpdateUserRequest {
  nombre: string;
  apellidos: string;
  email: string;
  rol: Role;
  password?: string;
}

// --- Proveedor dashboard ---
export interface ProveedorStats {
  totalStores: number;
  activeChats: number;
  totalProducts: number;
}

export interface EnvioItem {
  productName: string;
  cantidad: number;
}

export interface EnvioStock {
  id: string;
  storeId: number;
  storeName: string;
  items: EnvioItem[];
  llegadaEstimada: string; // ISO datetime, e.g. "2026-05-17T10:35:00+02:00"
}

export interface ReponerItemRequest {
  offerId: number;
  cantidad: number;
}

export interface ReponerRequest {
  storeId: number;
  items: ReponerItemRequest[];
}

// --- Repartidor dashboard ---
export interface RepartidorStats {
  myOrders: number;
  pendingPool: number;
  enRutaCount: number;
  deliveredToday: number;
}

// --- Vendedor dashboard ---
export interface VendedorStats {
  totalStores: number;
  pendingOrders: number;
  lowStockOffers: number;
  todayRevenue: number;
}

export interface StoreOfferDetail {
  id: number;
  productId: number;
  productName: string;
  productUnit: string;
  storeId: number;
  storeName: string;
  price: number;
  originalPrice?: number;
  stock: number;
  inStock: boolean;
  brand: string;
}

export interface ProductDetail {
  id: number;
  name: string;
  category: string;
  image: string;
  description: string;
  unit: string;
  offers: StoreOfferDetail[];
}

export interface Product {
  id: number;
  name: string;
  category: string;
  image: string;
  description: string;
  unit: string;
  storeOffers: StoreOffer[];
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  count: number;
}

export interface DeliveryZone {
  zone: string;
  fee: number;
  minTime: string;
  maxTime: string;
  available: boolean;
}

export interface CartItem {
  productId: number;
  productName: string;
  productImage: string;
  storeId: number;
  storeName: string;
  brand: string;
  price: number;
  quantity: number;
  unit: string;
}

export type Role = 'ADMIN' | 'CLIENTE' | 'VENDEDOR' | 'REPARTIDOR' | 'PROVEEDOR';
export type OrderStatus = 'PENDIENTE' | 'PREPARACION' | 'EN_RUTA' | 'ENTREGADO' | 'CANCELADO';
export type ChatType = 'CLIENTE_REPARTIDOR' | 'VENDEDOR_REPARTIDOR' | 'PROVEEDOR_VENDEDOR';

export interface MessageRequest {
  chatType: ChatType;
  orderId?: number;
  shopId?: number;
  mensaje: string;
}

export interface ChatThread {
  chatType: ChatType;
  orderId?: number;
  shopId?: number;
  title: string;
  lastMessage: string;
  lastSenderName: string;
  lastMessageDate: string;
}

export interface MessageResponse {
  id: number;
  chatType: ChatType;
  orderId?: number;
  shopId?: number;
  senderId: number;
  senderName: string;
  mensaje: string;
  fecha: string;
}

export interface AuthResponse {
  id: number;
  token: string;
  email: string;
  nombre: string;
  apellidos: string;
  rol: Role;
}

export interface OrderItemDto {
  productId: number;
  storeId: number;
  quantity: number;
  unitPrice: number;
  productName?: string;
  productImage?: string;
}

export interface Order {
  id: number;
  clientEmail: string;
  status: OrderStatus;
  total: number;
  items: OrderItemDto[];
  createdAt?: string;
  shippingAddress?: string;
  postalCode?: string;
  deliveryNotes?: string;
  deliveredAt?: string;
  deliveryLat?: number;
  deliveryLng?: number;
}

export interface MarkReadRequest {
  chatType: ChatType;
  orderId?: number;
  shopId?: number;
}

// Posición GPS del repartidor para un pedido
export interface TrackingPosition {
  id: number;
  orderId: number;
  latitud: number;
  longitud: number;
  ultimaActualizacion: string;
}

// --- Analytics dashboard ---
export interface DayStat {
  date: string;
  orders: number;
}

export interface ProductStat {
  productName: string;
  units: number;
}

export interface StoreRevenue {
  storeName: string;
  revenue: number;
}

export interface AnalyticsData {
  dailyOrders: DayStat[];
  topProducts: ProductStat[];
  revenueByStore: StoreRevenue[];
}
