'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchGuests, searchGuests } from '@/lib/sheets';
import { postToSheet } from '@/lib/api';
import { logCheckIn, isCheckedInToday, getTodayCheckInCount } from '@/lib/storage';
import { sendCheckInEmail } from '@/lib/email';
import { Guest } from '@/types';

export default function CheckInSystem() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Guest[]>([]);
  const [selected, setSelected] = useState<Guest | null>(null);
  const [peopleCount, setPeopleCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');
  const [todayCount, setTodayCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGuests().then((data) => {
      setGuests(data);
      setLoading(false);
    });
    setTodayCount(getTodayCheckInCount());
  }, []);

  useEffect(() => {
    if (selected) return;
    if (query.trim().length >= 2) {
      const found = searchGuests(guests, query);
      setResults(found);
      setShowDropdown(found.length > 0);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }, [query, guests, selected]);

  const selectGuest = (guest: Guest) => {
    setSelected(guest);
    setQuery(`${guest.firstName} ${guest.lastName}`);
    setShowDropdown(false);
    setEmailStatus('');
    setPeopleCount(1);
  };

  const handleCheckIn = async () => {
    if (!selected) return;
    setCheckingIn(true);

    const entry = logCheckIn({
      guestPhone: selected.phone,
      guestName: `${selected.firstName} ${selected.lastName}`,
      roomNumber: selected.roomNumber,
      peopleCount,
    });

    postToSheet({ type: 'checkin', ...entry });
    setTodayCount(getTodayCheckInCount());

    const result = await sendCheckInEmail(selected);
    setEmailStatus(result.message);
    setCheckingIn(false);

    setSelected({ ...selected, checkedIn: true, checkInTime: new Date().toLocaleTimeString() });
  };

  const handleClear = () => {
    setQuery('');
    setSelected(null);
    setResults([]);
    setEmailStatus('');
    setPeopleCount(1);
    inputRef.current?.focus();
  };

  const alreadyCheckedIn = selected ? isCheckedInToday(selected.phone) : false;

  return (
    <div className="p-4 max-w-lg mx-auto pb-24">
      {/* Header with daily count */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Check-In</h2>
          <p className="text-sm text-gray-500">Search guests to check them in</p>
        </div>
        <div className="bg-purple-600 text-white rounded-2xl px-4 py-2 text-center">
          <p className="text-2xl font-bold leading-none">{todayCount}</p>
          <p className="text-xs mt-0.5 opacity-80">Today</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <div className="flex items-center bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-purple-400 focus-within:border-purple-400">
          <span className="pl-4 text-gray-400 text-xl">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Name or phone number..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            className="flex-1 px-3 py-4 text-base bg-transparent focus:outline-none"
          />
          {query && (
            <button onClick={handleClear} className="pr-4 text-gray-400 text-xl">✕</button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {results.slice(0, 5).map((g, idx) => (
              <button
                key={idx}
                onClick={() => selectGuest(g)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 text-left border-b border-gray-50 last:border-0"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
                  {g.firstName[0]}{g.lastName[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{g.firstName} {g.lastName}</p>
                  <p className="text-sm text-gray-500">{g.phone} · Room {g.roomNumber}</p>
                </div>
                {isCheckedInToday(g.phone) && (
                  <span className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                    ✓ In
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-10 text-gray-400">
          <div className="animate-spin text-4xl mb-2">⟳</div>
          <p>Loading guest data...</p>
        </div>
      )}

      {/* Guest Card */}
      {selected && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
                {selected.firstName[0]}{selected.lastName[0]}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{selected.firstName} {selected.lastName}</h3>
                <p className="text-purple-200 text-sm">{selected.phone}</p>
              </div>
              {(alreadyCheckedIn || selected.checkedIn) && (
                <span className="bg-green-400 text-white text-xs px-3 py-1.5 rounded-full font-bold">
                  ✓ Checked In
                </span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="p-4 space-y-3">
            <DetailRow icon="📧" label="Email" value={selected.email} />
            <DetailRow icon="🏠" label="Room" value={selected.roomNumber} />
            <DetailRow icon="🎟️" label="Ticket Type" value={selected.ticketType} />
            {selected.notes && <DetailRow icon="📝" label="Notes" value={selected.notes} />}

            {/* People Count — only show if not yet checked in */}
            {!alreadyCheckedIn && !selected.checkedIn && (
              <div className="bg-purple-50 rounded-2xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">
                  👥 People Checking In
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setPeopleCount((n) => Math.max(1, n - 1))}
                    className="w-10 h-10 rounded-full bg-white shadow text-xl font-bold text-purple-600 active:scale-95 transition-transform"
                  >
                    −
                  </button>
                  <span className="text-3xl font-bold text-purple-700 w-8 text-center">{peopleCount}</span>
                  <button
                    onClick={() => setPeopleCount((n) => Math.min(10, n + 1))}
                    className="w-10 h-10 rounded-full bg-white shadow text-xl font-bold text-purple-600 active:scale-95 transition-transform"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-500 ml-1">
                    {peopleCount === 1 ? 'person' : 'people'} · Room {selected.roomNumber}
                  </span>
                </div>
              </div>
            )}

            {selected.checkInTime && (
              <div className="bg-green-50 rounded-xl p-3 text-sm text-green-700 flex items-center gap-2">
                ✅ Checked in at {selected.checkInTime}
              </div>
            )}

            {emailStatus && (
              <div className={`rounded-xl p-3 text-sm flex items-center gap-2 ${
                emailStatus.includes('sent')
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                {emailStatus.includes('sent') ? '📧' : '⚠️'} {emailStatus}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-4 pt-0 space-y-2">
            {!alreadyCheckedIn && !selected.checkedIn ? (
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold text-lg shadow-md active:scale-95 transition-transform disabled:opacity-50"
              >
                {checkingIn ? '⏳ Processing...' : `✅ Check In ${peopleCount > 1 ? `(${peopleCount} people)` : ''}`}
              </button>
            ) : (
              <div className="w-full bg-green-100 text-green-700 py-4 rounded-2xl font-bold text-lg text-center">
                ✓ Already Checked In Today
              </div>
            )}

            {selected.email && (selected.checkedIn || alreadyCheckedIn) && !emailStatus && (
              <button
                onClick={async () => {
                  const r = await sendCheckInEmail(selected);
                  setEmailStatus(r.message);
                }}
                className="w-full bg-blue-50 text-blue-700 py-3 rounded-2xl font-semibold active:scale-95 transition-transform"
              >
                📧 Resend Confirmation Email
              </button>
            )}

            <button
              onClick={handleClear}
              className="w-full bg-gray-100 text-gray-600 py-3 rounded-2xl font-semibold active:scale-95 transition-transform"
            >
              Search Another Guest
            </button>
          </div>
        </div>
      )}

      {/* No results */}
      {query.length >= 2 && results.length === 0 && !selected && !loading && (
        <div className="text-center py-10 text-gray-400">
          <span className="text-4xl block mb-2">🔍</span>
          <p className="font-medium">No guests found</p>
          <p className="text-sm mt-1">Try a different name or phone number</p>
        </div>
      )}

      {/* Empty state */}
      {!query && !selected && !loading && (
        <div className="text-center py-10 text-gray-400">
          <span className="text-4xl block mb-2">👥</span>
          <p className="font-medium">Start typing to search</p>
          <p className="text-sm mt-1">{guests.length} guests loaded</p>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-lg shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
        <p className="text-gray-700 text-sm break-words">{value || '—'}</p>
      </div>
    </div>
  );
}
