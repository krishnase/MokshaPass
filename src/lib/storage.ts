import { InventoryItem, SaleRecord, CheckInEntry } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// ─── Inventory ────────────────────────────────────────────────────────────────

const INVENTORY_KEY = 'moksha_inventory';

export function getInventory(): InventoryItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(INVENTORY_KEY);
  if (!raw) {
    const defaults: InventoryItem[] = [
      { id: uuidv4(), name: 'Herbal Tea Set', price: 25.0, qty: 50 },
      { id: uuidv4(), name: 'Aromatherapy Candle', price: 18.0, qty: 80 },
      { id: uuidv4(), name: 'Yoga Mat', price: 45.0, qty: 30 },
      { id: uuidv4(), name: 'Essential Oil Blend', price: 32.0, qty: 60 },
      { id: uuidv4(), name: 'Meditation Cushion', price: 55.0, qty: 20 },
    ];
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(raw);
}

export function saveInventory(items: InventoryItem[]): void {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
}

export function addInventoryItem(name: string, price: number, qty: number): InventoryItem {
  const items = getInventory();
  const item: InventoryItem = { id: uuidv4(), name, price, qty };
  items.push(item);
  saveInventory(items);
  return item;
}

export function updateInventoryItem(updated: InventoryItem): void {
  const items = getInventory().map((i) => (i.id === updated.id ? updated : i));
  saveInventory(items);
}

export function deleteInventoryItem(id: string): void {
  saveInventory(getInventory().filter((i) => i.id !== id));
}

export function reduceInventoryQty(itemId: string, qty: number): void {
  const items = getInventory().map((i) =>
    i.id === itemId ? { ...i, qty: Math.max(0, i.qty - qty) } : i
  );
  saveInventory(items);
}

// ─── Sales ────────────────────────────────────────────────────────────────────

const SALES_KEY = 'moksha_sales';

export function getSales(): SaleRecord[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(SALES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveSale(record: Omit<SaleRecord, 'id' | 'date' | 'timestamp'>): SaleRecord {
  const sales = getSales();
  const now = new Date();
  const sale: SaleRecord = {
    ...record,
    id: uuidv4(),
    date: now.toLocaleDateString(),
    timestamp: now.getTime(),
  };
  sales.push(sale);
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));
  return sale;
}

// ─── Check-In Log ─────────────────────────────────────────────────────────────

const CHECKIN_KEY = 'moksha_checkins';

export function getCheckIns(): CheckInEntry[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(CHECKIN_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function logCheckIn(entry: Omit<CheckInEntry, 'time' | 'date'>): CheckInEntry {
  const entries = getCheckIns();
  const now = new Date();
  const full: CheckInEntry = {
    ...entry,
    time: now.toLocaleTimeString(),
    date: now.toLocaleDateString(),
  };
  entries.push(full);
  localStorage.setItem(CHECKIN_KEY, JSON.stringify(entries));
  return full;
}

export function getTodayCheckInCount(): number {
  const today = new Date().toLocaleDateString();
  return getCheckIns().filter((c) => c.date === today).length;
}

export function isCheckedInToday(phone: string): boolean {
  const today = new Date().toLocaleDateString();
  return getCheckIns().some((c) => c.guestPhone === phone && c.date === today);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

const SESSION_KEY = 'moksha_session';

export function getSession(): 'admin' | 'user' | null {
  if (typeof window === 'undefined') return null;
  return (localStorage.getItem(SESSION_KEY) as 'admin' | 'user') || null;
}

export function setSession(role: 'admin' | 'user'): void {
  localStorage.setItem(SESSION_KEY, role);
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
