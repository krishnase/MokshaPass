'use client';

import { useState, useEffect } from 'react';
import PinLogin from '@/components/Auth/PinLogin';
import HomeScreen from '@/components/Home/HomeScreen';
import SalesForm from '@/components/Sales/SalesForm';
import InventoryManager from '@/components/Inventory/InventoryManager';
import CheckInSystem from '@/components/CheckIn/CheckInSystem';
import VolunteerList from '@/components/Sena/VolunteerList';
import VolunteerInterestForm from '@/components/Volunteer/VolunteerInterestForm';
import HanumanHealingForm from '@/components/HanumanHealing/HanumanHealingForm';
import Image from 'next/image';
import { getSession, clearSession } from '@/lib/storage';
import { UserRole } from '@/types';

type Tab = 'home' | 'sales' | 'inventory' | 'checkin' | 'sena';

const tabs: { id: Tab; label: string; icon: string; roles?: UserRole[] }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'sales', label: 'MokshaMart', icon: '🪷', roles: ['admin', 'user'] },
  { id: 'inventory', label: 'Inventory', icon: '📦', roles: ['admin'] },
  { id: 'checkin', label: 'Check-In', icon: '✅', roles: ['admin', 'user'] },
  { id: 'sena', label: 'Sena', icon: '🤝', roles: ['admin', 'sena'] },
];

export default function Home() {
  const [role, setRole] = useState<UserRole>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showInfo, setShowInfo] = useState(false);
  const [showVolunteer, setShowVolunteer] = useState(false);
  const [showHanuman, setShowHanuman] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const session = getSession();
    setRole(session);
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  if (!role) {
    return <PinLogin onLogin={(r) => { setActiveTab(r === 'sena' ? 'sena' : 'home'); setRole(r); }} />;
  }

  const visibleTabs = tabs.filter((t) => !t.roles || t.roles.includes(role));

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
          <HomeScreen onNavigate={(tab) => {
            if (tab === 'info') setShowInfo(true);
            else if (tab === 'volunteer') setShowVolunteer(true);
            else if (tab === 'hanuman') setShowHanuman(true);
            else setActiveTab(tab as Tab);
          }} />
        )}
        {activeTab === 'sales' && <SalesForm />}
        {activeTab === 'inventory' && role === 'admin' && <InventoryManager />}
        {activeTab === 'checkin' && <CheckInSystem />}
        {activeTab === 'sena' && <VolunteerList />}
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
                activeTab === tab.id ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
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

      {/* Volunteer Interest Modal */}
      {showVolunteer && <VolunteerInterestForm onClose={() => setShowVolunteer(false)} />}

      {/* Hanuman Healing Modal */}
      {showHanuman && <HanumanHealingForm onClose={() => setShowHanuman(false)} />}

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={() => setShowInfo(false)}>
          <div
            className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 mb-2 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Information</h2>
              <button onClick={() => setShowInfo(false)} className="text-gray-400 text-2xl leading-none">✕</button>
            </div>

            {/* USA Donation */}
            <div className="bg-green-50 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🏦</span>
                <p className="font-bold text-gray-800">Donate — USA</p>
              </div>
              <p className="text-xs text-gray-500 font-medium">Wells Fargo Bank</p>
              <div className="space-y-1">
                <p className="text-sm text-gray-700"><span className="font-semibold">Name:</span> WayToMoksha <span className="text-xs text-green-700 font-semibold">(501(c) Non-Profit)</span></p>
                <p className="text-sm text-gray-700"><span className="font-semibold">Account No:</span> <span className="font-mono tracking-wide">3017957717</span></p>
              </div>
              <div className="flex items-center gap-2 mt-2 bg-white rounded-xl px-3 py-2">
                <span className="text-lg">📱</span>
                <div>
                  <p className="text-xs text-gray-400">Zelle ID</p>
                  <p className="text-blue-700 font-bold text-sm">Master@waytomoksha.org</p>
                </div>
              </div>
            </div>

            {/* India Donation */}
            <div className="bg-orange-50 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🇮🇳</span>
                <p className="font-bold text-gray-800">Donate — India</p>
              </div>
              <p className="text-xs text-gray-500 font-medium">Please use UPI ID</p>
              <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2">
                <span className="text-lg">💳</span>
                <div>
                  <p className="text-xs text-gray-400">UPI ID</p>
                  <p className="text-orange-700 font-bold text-sm tracking-wide">Wayto97046356@barodampay</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
