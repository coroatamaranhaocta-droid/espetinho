/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating?: number;
  isPopular?: boolean;
  isAvailable: boolean;
  options?: ProductOption[];
  sizes?: ProductSize[];
}

export interface ProductOption {
  id: string;
  name: string;
  price: number;
}

export interface ProductSize {
  id: string;
  name: string;
  priceAdjustment: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: ProductSize;
  selectedOptions: ProductOption[];
  observation: string;
}

export type OrderStatus = 'Recebido' | 'Em preparo' | 'Saiu para entrega' | 'Entregue' | 'Cancelado';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: {
    street: string;
    number: string;
    neighborhood: string;
    complement?: string;
    reference?: string;
  };
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    selectedSize?: string;
    selectedOptions: string[];
    observation?: string;
  }[];
  paymentMethod: 'PIX' | 'Dinheiro';
  paymentDetails?: {
    changeFor?: number;
  };
  deliveryFee: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  receiptBase64?: string; // Loaded receipt image or pdf
  receiptFileName?: string;
  pixVerified?: boolean;
  deliveryProgress?: number;
  riderName?: string;
  riderPhone?: string;
  riderVehicle?: string;
}

export interface Coupon {
  code: string;
  discountType: 'fixed' | 'percentage';
  value: number;
  minOrderValue?: number;
}

export interface Rider {
  id: string;
  name: string;
  vehicleModel: string;
  plate?: string;
  phone?: string;
}

export interface User {
  email: string;
  name: string;
  photoUrl?: string;
  role: 'customer' | 'admin';
}

export interface StoreSettings {
  name: string;
  phone: string;
  address: string;
  deliveryFee: number;
  isOpen: boolean;
  pixKey: string;
  pixReceiverName: string;
  pixCity: string;
  coupons: Coupon[];
  customBanners: { id: string; image: string; title: string; subtitle?: string; link?: string }[];
  riders?: Rider[];
}

export interface DashboardStats {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  dailyRevenue: number;
  ordersByStatus: { name: string; value: number }[];
  revenueLast7Days: { date: string; value: number }[];
}
