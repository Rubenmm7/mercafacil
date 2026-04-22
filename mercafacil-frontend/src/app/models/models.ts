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
