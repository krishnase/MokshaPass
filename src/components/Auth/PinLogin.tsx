'use client';

import { useState } from 'react';
import Image from 'next/image';
import { setSession } from '@/lib/storage';

const ADMIN_PIN = '9999';

interface Props {
  onLogin: (role: 'admin' | 'user') => void;
}

export default function PinLogin({ onLogin }: Props) {
  const [mode, setMode] = useState<'select' | 'admin-pin'>('select');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleUserLogin = () => {
    setSession('user');
    onLogin('user');
  };

  const handleKey = (digit: string) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError('');

    if (next.length === 4) {
      setTimeout(() => {
        if (next === ADMIN_PIN) {
          setSession('admin');
          onLogin('admin');
        } else {
          setError('Incorrect PIN');
          setShake(true);
          setTimeout(() => { setPin(''); setShake(false); }, 600);
        }
      }, 150);
    }
  };

  const handleBack = () => setPin((p) => p.slice(0, -1));

  const dots = Array.from({ length: 4 }, (_, i) => i < pin.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-violet-900 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-24 h-24 relative mx-auto mb-4">
          <Image src="/logo.png" alt="MokshaPass Logo" fill className="object-contain" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-wide">MokshaPass</h1>
        <p className="text-purple-300 mt-1">
          {mode === 'select' ? 'Who are you?' : 'Enter Admin PIN'}
        </p>
      </div>

      {/* Role Selection */}
      {mode === 'select' && (
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
          <button
            onClick={handleUserLogin}
            className="flex flex-col items-center justify-center gap-3 bg-white/10 border border-white/20 rounded-3xl py-8 px-4 active:scale-95 transition-transform hover:bg-white/20"
          >
            <span className="text-5xl">🙏</span>
            <span className="text-white font-bold text-lg">Guest</span>
          </button>

          <button
            onClick={() => setMode('admin-pin')}
            className="flex flex-col items-center justify-center gap-3 bg-white/10 border border-white/20 rounded-3xl py-8 px-4 active:scale-95 transition-transform hover:bg-white/20"
          >
            <span className="text-5xl">🔐</span>
            <span className="text-white font-bold text-lg">Admin</span>
          </button>
        </div>
      )}

      {/* Admin PIN Entry */}
      {mode === 'admin-pin' && (
        <>
          <div className={`flex gap-4 mb-6 ${shake ? 'animate-shake' : ''}`}>
            {dots.map((filled, i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                  filled ? 'bg-white border-white scale-110' : 'bg-transparent border-white/50'
                }`}
              />
            ))}
          </div>

          {error && <p className="text-red-400 text-sm mb-4 font-medium">{error}</p>}

          <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
            {['1','2','3','4','5','6','7','8','9','*','0','⌫'].map((key) => (
              <button
                key={key}
                onClick={() => key === '⌫' ? handleBack() : key !== '*' ? handleKey(key) : null}
                disabled={key === '*'}
                className={`h-16 rounded-2xl text-xl font-semibold transition-all duration-150 active:scale-95 ${
                  key === '*'
                    ? 'invisible'
                    : key === '⌫'
                    ? 'bg-white/10 text-white/70 hover:bg-white/20'
                    : 'bg-white/15 text-white hover:bg-white/25 border border-white/10'
                }`}
              >
                {key}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setMode('select'); setPin(''); setError(''); }}
            className="mt-6 text-purple-300 text-sm hover:text-white transition-colors"
          >
            ← Back
          </button>
        </>
      )}

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}
