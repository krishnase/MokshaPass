'use client';

import Image from 'next/image';

interface HomeScreenProps {
  onNavigate: (tab: 'checkin' | 'sales' | 'info' | 'volunteer') => void;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  return (
    <div className="min-h-full flex flex-col items-center px-4 pt-6 pb-28 bg-gradient-to-b from-orange-50 via-white to-purple-50">

      {/* Welcome Header */}
      <div className="text-center mb-6 max-w-md mt-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-2">
          Welcome to the Retreat
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-snug">
          A 3-Day Retreat for Spiritual Transformation<br />
          and Astral Healing 🚀
        </h1>
      </div>

      {/* Action Cards */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-4 mb-4">
        <button
          onClick={() => onNavigate('checkin')}
          className="flex flex-col items-center justify-center gap-3 bg-white rounded-3xl shadow-md border border-purple-100 py-8 px-4 active:scale-95 transition-transform hover:shadow-lg hover:border-purple-300"
        >
          <span className="text-5xl sm:text-6xl">✅</span>
          <span className="text-base sm:text-lg font-bold text-gray-800">Check-In</span>
          <span className="text-xs text-gray-400 text-center">Check in guests</span>
        </button>

        <button
          onClick={() => onNavigate('sales')}
          className="flex flex-col items-center justify-center gap-3 bg-white rounded-3xl shadow-md border border-orange-100 py-8 px-4 active:scale-95 transition-transform hover:shadow-lg hover:border-orange-300"
        >
          <span className="text-5xl sm:text-6xl">🪷</span>
          <span className="text-base sm:text-lg font-bold text-gray-800">MokshaMart</span>
          <span className="text-xs text-gray-400 text-center">Browse &amp; purchase</span>
        </button>
      </div>

      {/* Info + Volunteer Cards */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => onNavigate('info')}
          className="flex flex-col items-center justify-center gap-2 bg-white rounded-3xl shadow-md border border-blue-100 py-5 px-4 active:scale-95 transition-transform hover:shadow-lg hover:border-blue-300"
        >
          <span className="text-4xl">ℹ️</span>
          <span className="text-base font-bold text-gray-800">Retreat Info</span>
          <span className="text-xs text-gray-400 text-center">WiFi · Room Service</span>
        </button>
        <button
          onClick={() => onNavigate('volunteer')}
          className="flex flex-col items-center justify-center gap-2 bg-white rounded-3xl shadow-md border border-green-100 py-5 px-4 active:scale-95 transition-transform hover:shadow-lg hover:border-green-300"
        >
          <span className="text-4xl">🤲</span>
          <span className="text-base font-bold text-gray-800">Volunteer</span>
          <span className="text-xs text-gray-400 text-center">Join our team</span>
        </button>
      </div>

      {/* Divider */}
      <div className="w-16 h-0.5 bg-orange-200 rounded-full mb-8" />

      {/* Host Profile */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-purple-100 overflow-hidden">
        <div className="relative w-full aspect-[4/3] overflow-hidden">
          <Image
            src="/host.jpg"
            alt="Anirudha Miryala"
            fill
            className="object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-300 mb-0.5">
              Hosted by
            </p>
            <h2 className="text-xl font-bold leading-tight">Anirudha Miryala</h2>
            <p className="text-sm text-white/80">Founder, WayToMoksha</p>
          </div>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-xs text-gray-400 italic">Anoo&apos;s Sister</p>
        </div>
      </div>

    </div>
  );
}
