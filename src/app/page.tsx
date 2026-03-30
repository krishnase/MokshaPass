'use client';

import { useState, useEffect } from 'react';
import PinLogin from '@/components/Auth/PinLogin';
import HomeScreen from '@/components/Home/HomeScreen';
import SalesForm from '@/components/Sales/SalesForm';
import InventoryManager from '@/components/Inventory/InventoryManager';
import CheckInSystem from '@/components/CheckIn/CheckInSystem';
import Image from 'next/image';
import { getSession, clearSession } from '@/lib/storage';
import { UserRole } from '@/types';

type Tab = 'home' | 'sales' | 'inventory' | 'checkin';

const tabs: { id: Tab; label: string; icon: string; adminOnly?: boolean }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'sales', label: 'MokshaMart', icon: '🪷' },
  { id: 'inventory', label: 'Inventory', icon: '📦', adminOnly: true },
  { id: 'checkin', label: 'Check-In', icon: '✅' },
];

export default function Home() {
  const [role, setRole] = useState<UserRole>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showInfo, setShowInfo] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const session = getSession();
    setRole(session);
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  if (!role) {
    return <PinLogin onLogin={(r) => { setActiveTab('home'); setRole(r); }} />;
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
          <div className="w-9 h-9 relative shrink-0">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
          </div>
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
        {activeTab === 'home' && (
          <HomeScreen onNavigate={(tab) => setActiveTab(tab as Tab)} />
        )}
        {activeTab === 'sales' && <SalesForm />}
        {activeTab === 'inventory' && role === 'admin' && <InventoryManager />}
        {activeTab === 'checkin' && <CheckInSystem />}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] z-40">
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${visibleTabs.length + 1}, 1fr)` }}
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
              <span className={`text-2xl transition-transform ${activeTab === tab.id ? 'scale-110' : 'scale-100'}`}>
                {tab.icon}
              </span>
              <span className={`text-[11px] font-semibold ${activeTab === tab.id ? 'text-purple-600' : 'text-gray-400'}`}>
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <span className="w-1 h-1 rounded-full bg-purple-600 mt-0.5" />
              )}
            </button>
          ))}

          {/* Info Tab */}
          <button
            onClick={() => setShowInfo(true)}
            className="flex flex-col items-center justify-center py-3 gap-0.5 transition-colors active:scale-95 text-gray-400 hover:text-gray-600"
          >
            <span className="text-2xl">ℹ️</span>
            <span className="text-[11px] font-semibold">Info</span>
          </button>
        </div>
        <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </nav>

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={() => setShowInfo(false)}>
          <div
            className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 mb-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Retreat Info</h2>
              <button onClick={() => setShowInfo(false)} className="text-gray-400 text-2xl leading-none">✕</button>
            </div>

            {/* Room Service */}
            <div className="flex items-start gap-3 bg-purple-50 rounded-2xl p-4">
              <span className="text-2xl shrink-0">🏡</span>
              <div>
                <p className="font-semibold text-gray-800">LoneOak Ranch — Room Service</p>
                <a
                  href="tel:9406682855"
                  className="text-purple-600 font-bold text-lg mt-0.5 block"
                >
                  940-668-2855
                </a>
              </div>
            </div>

            {/* WiFi */}
            <div className="flex items-start gap-3 bg-blue-50 rounded-2xl p-4">
              <span className="text-2xl shrink-0">📶</span>
              <div>
                <p className="font-semibold text-gray-800">WiFi Password</p>
                <p className="text-blue-700 font-bold text-lg mt-0.5 tracking-wide">loneoak1</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
