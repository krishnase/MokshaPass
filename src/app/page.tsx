'use client';

import { useState, useEffect } from 'react';
import PinLogin from '@/components/Auth/PinLogin';
import SalesForm from '@/components/Sales/SalesForm';
import InventoryManager from '@/components/Inventory/InventoryManager';
import CheckInSystem from '@/components/CheckIn/CheckInSystem';
import MokshaMartInfo from '@/components/MokshaMart/MokshaMartInfo';
import { getSession, clearSession } from '@/lib/storage';
import { UserRole } from '@/types';

type Tab = 'sales' | 'inventory' | 'checkin' | 'mart';

const tabs: { id: Tab; label: string; icon: string; adminOnly?: boolean }[] = [
  { id: 'sales', label: 'Sales', icon: '🛒' },
  { id: 'inventory', label: 'Inventory', icon: '📦', adminOnly: true },
  { id: 'checkin', label: 'Check-In', icon: '✅' },
  { id: 'mart', label: 'MokshaMart', icon: '🕉️' },
];

export default function Home() {
  const [role, setRole] = useState<UserRole>(null);
  const [activeTab, setActiveTab] = useState<Tab>('sales');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const session = getSession();
    setRole(session);
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  if (!role) {
    return <PinLogin onLogin={(r) => setRole(r)} />;
  }

  const visibleTabs = tabs.filter((t) => !t.adminOnly || role === 'admin');

  const handleLogout = () => {
    clearSession();
    setRole(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f7]">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🕉️</span>
          <div>
            <h1 className="font-bold text-gray-800 leading-none text-lg">MokshaPass</h1>
            <p className="text-xs text-purple-500 capitalize">{role} account</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-red-500 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors font-medium"
        >
          Logout
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'sales' && <SalesForm />}
        {activeTab === 'inventory' && role === 'admin' && <InventoryManager />}
        {activeTab === 'checkin' && <CheckInSystem />}
        {activeTab === 'mart' && <MokshaMartInfo />}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] z-40">
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, 1fr)` }}
        >
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-3 gap-0.5 transition-colors active:scale-95 ${
                activeTab === tab.id
                  ? 'text-purple-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span
                className={`text-2xl transition-transform ${
                  activeTab === tab.id ? 'scale-110' : 'scale-100'
                }`}
              >
                {tab.icon}
              </span>
              <span
                className={`text-[11px] font-semibold ${
                  activeTab === tab.id ? 'text-purple-600' : 'text-gray-400'
                }`}
              >
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <span className="w-1 h-1 rounded-full bg-purple-600 mt-0.5" />
              )}
            </button>
          ))}
        </div>
        {/* Safe area spacer for notched phones */}
        <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </nav>
    </div>
  );
}
