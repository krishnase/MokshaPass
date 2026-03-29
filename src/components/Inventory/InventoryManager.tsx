'use client';

import { useState, useEffect } from 'react';
import {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from '@/lib/storage';
import { InventoryItem } from '@/types';

export default function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const refresh = () => setItems(getInventory());
  useEffect(() => { refresh(); }, []);

  const openAdd = () => {
    setEditItem(null);
    setName(''); setPrice(''); setQty('');
    setError('');
    setShowForm(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditItem(item);
    setName(item.name);
    setPrice(String(item.price));
    setQty(String(item.qty));
    setError('');
    setShowForm(true);
  };

  const validate = () => {
    if (!name.trim()) return 'Item name is required';
    if (!price || isNaN(Number(price)) || Number(price) < 0) return 'Valid price is required';
    if (!qty || isNaN(Number(qty)) || Number(qty) < 0) return 'Valid quantity is required';
    return '';
  };

  const handleSave = () => {
    const err = validate();
    if (err) { setError(err); return; }

    if (editItem) {
      updateInventoryItem({
        ...editItem,
        name: name.trim(),
        price: parseFloat(price),
        qty: parseInt(qty),
      });
    } else {
      addInventoryItem(name.trim(), parseFloat(price), parseInt(qty));
    }
    refresh();
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    deleteInventoryItem(id);
    refresh();
    setDeleteConfirm(null);
  };

  const totalValue = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className="p-4 max-w-lg mx-auto pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Inventory</h2>
        <button
          onClick={openAdd}
          className="bg-purple-600 text-white px-4 py-2 rounded-xl font-semibold text-sm active:scale-95 transition-transform flex items-center gap-1"
        >
          + Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-purple-50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-purple-700">{items.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Products</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-green-700">${totalValue.toFixed(0)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Stock Value</p>
        </div>
      </div>

      {/* Items Table */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <span className="text-5xl block mb-3">📦</span>
          <p>No items yet. Add your first product!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-purple-600 font-medium">${item.price.toFixed(2)}</span>
                  <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${
                    item.qty === 0
                      ? 'bg-red-100 text-red-600'
                      : item.qty < 10
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {item.qty === 0 ? 'Out of Stock' : `${item.qty} left`}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openEdit(item)}
                  className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg active:scale-95"
                >
                  ✏️
                </button>
                <button
                  onClick={() => setDeleteConfirm(item.id)}
                  className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-lg active:scale-95"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-800">
              {editItem ? 'Edit Item' : 'Add New Item'}
            </h3>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">⚠️ {error}</p>
            )}

            <input
              type="text"
              placeholder="Item Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Price ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Quantity</label>
                <input
                  type="number"
                  placeholder="0"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  min="0"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="py-3 rounded-xl bg-purple-600 text-white font-semibold active:scale-95"
              >
                {editItem ? 'Update' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center">
            <p className="text-4xl mb-3">🗑️</p>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Item?</h3>
            <p className="text-gray-500 text-sm mb-4">This cannot be undone.</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="py-3 rounded-xl bg-red-600 text-white font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
