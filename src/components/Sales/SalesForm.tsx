'use client';

import { useState, useEffect } from 'react';
import { getInventory, saveSale, reduceInventoryQty } from '@/lib/storage';
import { postToSheet } from '@/lib/api';
import { InventoryItem } from '@/types';

const DELIVERY_FEE = 15;

type CartItem = { item: InventoryItem; qty: number };

export default function SalesForm() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [delivery, setDelivery] = useState(false);
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState<'Cash' | 'Zelle'>('Cash');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setInventory(getInventory()); }, []);

  const cartQty = (itemId: string) => cart.find((c) => c.item.id === itemId)?.qty ?? 0;

  const updateCart = (item: InventoryItem, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      const newQty = (existing?.qty ?? 0) + delta;
      if (newQty <= 0) return prev.filter((c) => c.item.id !== item.id);
      if (newQty > item.qty) return prev; // can't exceed stock
      if (existing) return prev.map((c) => c.item.id === item.id ? { ...c, qty: newQty } : c);
      return [...prev, { item, qty: newQty }];
    });
  };

  const subtotal = cart.reduce((sum, c) => sum + c.item.price * c.qty, 0);
  const deliveryFee = delivery ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setScreenshot(result);
      setScreenshotPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    if (!customerName.trim()) return 'Customer name is required';
    if (!phone.trim()) return 'Phone number is required';
    if (cart.length === 0) return 'Please add at least one item';
    if (delivery && !address.trim()) return 'Delivery address is required';
    if (payment === 'Zelle' && !screenshot) return 'Please upload Zelle payment screenshot';
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    // Save one sale record per cart item
    cart.forEach((c, idx) => {
      const itemDeliveryFee = idx === 0 ? deliveryFee : 0; // delivery fee only on first item
      const sale = saveSale({
        customerName: customerName.trim(),
        phone: phone.trim(),
        item: c.item.name,
        itemId: c.item.id,
        qty: c.qty,
        price: c.item.price,
        subtotal: c.item.price * c.qty,
        deliveryFee: itemDeliveryFee,
        total: c.item.price * c.qty + itemDeliveryFee,
        delivery,
        address: delivery ? address.trim() : undefined,
        payment,
        screenshot: screenshot || undefined,
      });

      postToSheet({
        type: 'sale',
        id: sale.id,
        date: sale.date,
        customerName: sale.customerName,
        phone: sale.phone,
        item: sale.item,
        qty: sale.qty,
        price: sale.price,
        subtotal: sale.subtotal,
        deliveryFee: sale.deliveryFee,
        total: sale.total,
        delivery: sale.delivery,
        payment: sale.payment,
        address: sale.address || '',
        timestamp: sale.timestamp,
      });

      reduceInventoryQty(c.item.id, c.qty);
    });

    setInventory(getInventory());
    setSubmitted(true);
  };

  const reset = () => {
    setCustomerName(''); setPhone(''); setCart([]);
    setDelivery(false); setAddress('');
    setPayment('Cash'); setScreenshot(null); setScreenshotPreview(null);
    setError(''); setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">✅</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Sale Recorded!</h2>
        <p className="text-gray-600 mb-3">{customerName}</p>
        <div className="w-full max-w-xs space-y-1 mb-3">
          {cart.map((c) => (
            <div key={c.item.id} className="flex justify-between text-sm text-gray-600">
              <span>{c.item.name} x{c.qty}</span>
              <span>${(c.item.price * c.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <p className="text-2xl font-bold text-purple-600 mb-2">${total.toFixed(2)}</p>
        {delivery && <p className="text-sm text-gray-500 mb-1">🚚 Delivery to: {address}</p>}
        <p className="text-sm text-gray-500 mb-6">Payment: {payment}</p>
        <button onClick={reset} className="bg-purple-600 text-white px-8 py-3 rounded-2xl font-semibold text-lg active:scale-95 transition-transform">
          New Sale
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto pb-24">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">New Sale</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Customer</h3>
          <input
            type="text"
            placeholder="Customer Name *"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <input
            type="tel"
            placeholder="Phone Number *"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        {/* Item Selection */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">
            Items {totalItems > 0 && <span className="text-purple-600">({totalItems} selected)</span>}
          </h3>
          <div className="space-y-2">
            {inventory.map((item) => {
              const inCart = cartQty(item.id);
              const outOfStock = item.qty === 0;
              return (
                <div key={item.id}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 border transition-all ${
                    inCart > 0 ? 'bg-purple-50 border-purple-300' : outOfStock ? 'bg-gray-50 border-gray-100 opacity-50' : 'bg-gray-50 border-gray-100'
                  }`}>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${inCart > 0 ? 'text-purple-800' : 'text-gray-800'}`}>{item.name}</p>
                    <p className="text-xs text-gray-500">${item.price.toFixed(2)} · {item.qty} left</p>
                  </div>
                  {outOfStock ? (
                    <span className="text-xs text-gray-400 font-medium">Out of stock</span>
                  ) : inCart === 0 ? (
                    <button type="button" onClick={() => updateCart(item, 1)}
                      className="w-8 h-8 rounded-full bg-purple-600 text-white text-xl font-bold flex items-center justify-center active:scale-95">
                      +
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => updateCart(item, -1)}
                        className="w-8 h-8 rounded-full bg-white border border-purple-300 text-purple-700 text-xl font-bold flex items-center justify-center active:scale-95">
                        −
                      </button>
                      <span className="text-base font-bold text-purple-700 w-5 text-center">{inCart}</span>
                      <button type="button" onClick={() => updateCart(item, 1)}
                        className="w-8 h-8 rounded-full bg-purple-600 text-white text-xl font-bold flex items-center justify-center active:scale-95">
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Order summary */}
          {cart.length > 0 && (
            <div className="mt-3 bg-purple-50 rounded-xl p-3 space-y-1 text-sm">
              {cart.map((c) => (
                <div key={c.item.id} className="flex justify-between text-gray-600">
                  <span>{c.item.name} x{c.qty}</span>
                  <span>${(c.item.price * c.qty).toFixed(2)}</span>
                </div>
              ))}
              {delivery && (
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>+${DELIVERY_FEE.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-purple-200 pt-1 mt-1">
                <span className="font-bold text-purple-700">Total</span>
                <span className="font-bold text-purple-700 text-lg">${total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Delivery */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-700">Delivery Required</h3>
              <p className="text-sm text-gray-500">+$15.00 delivery fee</p>
            </div>
            <button
              type="button"
              onClick={() => setDelivery(!delivery)}
              className={`w-14 h-7 rounded-full transition-colors duration-200 relative ${delivery ? 'bg-purple-600' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${delivery ? 'translate-x-7' : 'translate-x-0.5'}`} />
            </button>
          </div>
          {delivery && (
            <textarea
              placeholder="Delivery Address *"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
            />
          )}
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Payment</h3>
          <div className="grid grid-cols-2 gap-3">
            {(['Cash', 'Zelle'] as const).map((method) => (
              <button key={method} type="button" onClick={() => setPayment(method)}
                className={`py-3 rounded-xl font-semibold text-base transition-all active:scale-95 ${payment === method ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-700'}`}>
                {method === 'Cash' ? '💵 Cash' : '📱 Zelle'}
              </button>
            ))}
          </div>
          {payment === 'Zelle' && (
            <div className="space-y-2">
              <label className="block text-sm text-gray-600 font-medium">Upload Payment Screenshot *</label>
              <input type="file" accept="image/*" onChange={handleScreenshot}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-purple-100 file:text-purple-700 file:font-medium" />
              {screenshotPreview && (
                <img src={screenshotPreview} alt="Payment screenshot"
                  className="w-full max-h-48 object-contain rounded-xl border border-gray-200 mt-2" />
              )}
            </div>
          )}
        </div>

        <button type="submit"
          className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform mt-2">
          Complete Sale {cart.length > 0 && `— $${total.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}
