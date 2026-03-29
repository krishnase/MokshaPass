export interface InventoryItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface SaleRecord {
  id: string;
  customerName: string;
  phone: string;
  item: string;
  itemId: string;
  qty: number;
  price: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  delivery: boolean;
  address?: string;
  payment: 'Cash' | 'Zelle';
  screenshot?: string;
  date: string;
  timestamp: number;
}

export interface Guest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  roomNumber: string;
  scheduleDetails: string;
  checkedIn?: boolean;
  checkInTime?: string;
}

export type UserRole = 'admin' | 'user' | null;

export interface CheckInEntry {
  guestPhone: string;
  guestName: string;
  time: string;
  date: string;
}
