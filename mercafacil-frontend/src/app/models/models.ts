export interface Store {
  id: number;
  name: string;
  logo: string;
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

export interface StoreOffer {
  storeId: number;
  storeName: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  brand: string;
}

// --- Admin dashboard ---
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

// --- Proveedor dashboard ---
export interface ProveedorStats {
  totalStores: number;
  activeChats: number;
  totalProducts: number;
}

// --- Repartidor dashboard ---
export interface RepartidorStats {
  myOrders: number;
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
export type OrderStatus = 'PENDIENTE' | 'PREPARACION' | 'EN_RUTA' | 'ENTREGADO';
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
}

export interface Order {
  id: number;
  clientEmail: string;
  status: OrderStatus;
  total: number;
  items: OrderItemDto[];
  createdAt?: string;
}
