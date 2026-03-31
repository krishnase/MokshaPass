'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchGuests, searchGuests } from '@/lib/sheets';
import { postToSheet } from '@/lib/api';
import { logCheckIn, isCheckedInToday, getTodayCheckInCount } from '@/lib/storage';
import { sendCheckInEmail } from '@/lib/email';
import { Guest } from '@/types';
import ConsentModal from './ConsentModal';

type PersonDetail = { name: string; age: string };

function buildPeopleDetails(count: number, current: PersonDetail[]): PersonDetail[] {
  return Array.from({ length: count }, (_, i) => current[i] ?? { name: '', age: '' });
}

export default function CheckInSystem() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Guest[]>([]);
  const [selected, setSelected] = useState<Guest | null>(null);
  const [peopleCount, setPeopleCount] = useState(1);
  const [peopleDetails, setPeopleDetails] = useState<PersonDetail[]>([{ name: '', age: '' }]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [, setEmailStatus] = useState('');
  const [todayCount, setTodayCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showWalkIn, setShowWalkIn] = useState(false);

  // Walk-in form state
  const [walkInFirstName, setWalkInFirstName] = useState('');
  const [walkInLastName, setWalkInLastName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInPayment, setWalkInPayment] = useState<'Cash' | 'Zelle' | 'Check' | ''>('');
  const [walkInAmount, setWalkInAmount] = useState('');
  const [walkInPeopleCount, setWalkInPeopleCount] = useState(1);
  const [walkInPeopleDetails, setWalkInPeopleDetails] = useState<PersonDetail[]>([{ name: '', age: '' }]);
  const [walkInError, setWalkInError] = useState('');
  const [showConsent, setShowConsent] = useState(false);
  const [consentPeople, setConsentPeople] = useState<PersonDetail[]>([]);
  const [consentPhone, setConsentPhone] = useState('');
  const pendingWalkIn = useRef<{ guest: Guest; entry: Parameters<typeof logCheckIn>[0]; notes: string; peopleNote: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fullName = `${walkInFirstName} ${walkInLastName}`.trim();
    setWalkInPeopleDetails((d) => d.map((p, i) => i === 0 ? { ...p, name: fullName } : p));
  }, [walkInFirstName, walkInLastName]);

  useEffect(() => {
    fetchGuests().then((data) => { setGuests(data); setLoading(false); });
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

  const updatePeopleCount = (n: number) => {
    setPeopleCount(n);
    setPeopleDetails((d) => buildPeopleDetails(n, d));
  };

  const updateWalkInPeopleCount = (n: number) => {
    setWalkInPeopleCount(n);
    setWalkInPeopleDetails((d) => buildPeopleDetails(n, d));
  };

  const updatePerson = (list: PersonDetail[], setList: (v: PersonDetail[]) => void, idx: number, field: 'name' | 'age', value: string) => {
    const updated = list.map((p, i) => i === idx ? { ...p, [field]: value } : p);
    setList(updated);
  };

  const selectGuest = (guest: Guest) => {
    setSelected(guest);
    setQuery(`${guest.firstName} ${guest.lastName}`);
    setShowDropdown(false);
    setEmailStatus('');
    setPeopleCount(1);
    setPeopleDetails([{ name: `${guest.firstName} ${guest.lastName}`.trim(), age: '' }]);
  };

  const handleCheckIn = () => {
    if (!selected) return;
    // Show consent modal before completing check-in
    setConsentPeople(peopleDetails.filter((p) => p.name.trim()).map((p) => ({ name: p.name.trim(), age: p.age })));
    setConsentPhone(selected.phone);
    setShowConsent(true);
  };

  const doCheckIn = async () => {
    if (!selected) return;
    setCheckingIn(true);

    const peopleNote = peopleDetails
      .filter((p) => p.name.trim())
      .map((p, i) => `${i + 1}. ${p.name.trim()}${p.age ? ` (age ${p.age})` : ''}`)
      .join(', ');

    const entry = logCheckIn({
      guestPhone: selected.phone,
      guestName: `${selected.firstName} ${selected.lastName}`,
      roomNumber: selected.roomNumber,
      peopleCount,
    });

    postToSheet({ type: 'checkin', ...entry, peopleDetails: peopleNote });
    setTodayCount(getTodayCheckInCount());

    const result = await sendCheckInEmail(selected);
    setEmailStatus(result.message);
    setCheckingIn(false);
    setSelected({ ...selected, checkedIn: true, checkInTime: new Date().toLocaleTimeString() });
  };

  const handleWalkInCheckIn = () => {
    if (!walkInFirstName.trim()) { setWalkInError('First name is required'); return; }
    if (!walkInPhone.trim()) { setWalkInError('Phone number is required'); return; }

    const peopleNote = walkInPeopleDetails
      .filter((p) => p.name.trim())
      .map((p, i) => `${i + 1}. ${p.name.trim()}${p.age ? ` (age ${p.age})` : ''}`)
      .join(', ');

    const donationNote = walkInPayment ? `Donation: $${walkInAmount || '0'} via ${walkInPayment}` : '';
    const notes = [donationNote, peopleNote].filter(Boolean).join(' | ');

    const walkInGuest: Guest = {
      orderDate: new Date().toLocaleDateString(),
      firstName: walkInFirstName.trim(),
      lastName: walkInLastName.trim(),
      email: '',
      ticketType: 'Walk-in',
      phone: walkInPhone.trim(),
      roomNumber: '',
      notes,
    };

    pendingWalkIn.current = {
      guest: walkInGuest,
      entry: { guestPhone: walkInGuest.phone, guestName: `${walkInGuest.firstName} ${walkInGuest.lastName}`, roomNumber: '', peopleCount: walkInPeopleCount },
      notes,
      peopleNote,
    };

    setShowWalkIn(false);
    setConsentPeople(walkInPeopleDetails.filter((p) => p.name.trim()).map((p) => ({ name: p.name.trim(), age: p.age })));
    setConsentPhone(walkInPhone.trim());
    setShowConsent(true);
  };

  const doWalkInCheckIn = () => {
    const pending = pendingWalkIn.current;
    if (!pending) return;
    const entry = logCheckIn(pending.entry);
    postToSheet({ type: 'checkin', ...entry, notes: pending.notes, ticketType: 'Walk-in', peopleDetails: pending.peopleNote });
    setTodayCount(getTodayCheckInCount());
    setSelected({ ...pending.guest, checkedIn: true, checkInTime: new Date().toLocaleTimeString() });
    setQuery(`${pending.guest.firstName} ${pending.guest.lastName}`);
    pendingWalkIn.current = null;
  };

  const handleClear = () => {
    setQuery(''); setSelected(null); setResults([]);
    setEmailStatus(''); setPeopleCount(1); setPeopleDetails([{ name: '', age: '' }]);
    inputRef.current?.focus();
  };

  const resetWalkIn = () => {
    setWalkInFirstName(''); setWalkInLastName(''); setWalkInPhone('');
    setWalkInPayment(''); setWalkInAmount('');
    setWalkInPeopleCount(1); setWalkInPeopleDetails([{ name: '', age: '' }]);
    setWalkInError(''); setShowWalkIn(false);
  };

  const alreadyCheckedIn = selected ? isCheckedInToday(selected.phone) : false;

  return (
    <div className="p-4 max-w-lg mx-auto pb-24">
      {/* Header */}
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
      <div className="relative mb-3">
        <div className="flex items-center bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-purple-400">
          <span className="pl-4 text-gray-400 text-xl">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Name or phone number..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
            className="flex-1 px-3 py-4 text-base bg-transparent focus:outline-none"
          />
          {query && <button onClick={handleClear} className="pr-4 text-gray-400 text-xl">✕</button>}
        </div>

        {showDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {results.slice(0, 5).map((g, idx) => (
              <button key={idx} onClick={() => selectGuest(g)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 text-left border-b border-gray-50 last:border-0">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
                  {g.firstName[0]}{g.lastName[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{g.firstName} {g.lastName}</p>
                  <p className="text-sm text-gray-500">{g.phone} · Room {g.roomNumber}</p>
                </div>
                {isCheckedInToday(g.phone) && (
                  <span className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">✓ In</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Walk-in Button */}
      {!selected && (
        <button onClick={() => setShowWalkIn(true)}
          className="w-full mb-4 border-2 border-dashed border-purple-200 text-purple-600 py-3 rounded-2xl font-semibold text-sm active:scale-95 transition-transform hover:border-purple-400 hover:bg-purple-50">
          + Add Walk-in Guest
        </button>
      )}

      {loading && (
        <div className="text-center py-10 text-gray-400">
          <div className="animate-spin text-4xl mb-2">⟳</div>
          <p>Loading guest data...</p>
        </div>
      )}

      {/* Guest Card */}
      {selected && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
                {selected.firstName[0]}{selected.lastName[0]}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{selected.firstName} {selected.lastName}</h3>
                <p className="text-purple-200 text-sm">{selected.phone}</p>
                {selected.ticketType === 'Walk-in' && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full mt-1 inline-block">Walk-in</span>
                )}
              </div>
              {(alreadyCheckedIn || selected.checkedIn) && (
                <span className="bg-green-400 text-white text-xs px-3 py-1.5 rounded-full font-bold">✓ Checked In</span>
              )}
            </div>
          </div>

          <div className="p-4 space-y-3">
            {selected.email && <DetailRow icon="📧" label="Email" value={selected.email} />}
            {selected.roomNumber && <DetailRow icon="🏠" label="Room" value={selected.roomNumber} />}
            {selected.ticketType && <DetailRow icon="🎟️" label="Ticket Type" value={selected.ticketType} />}
            {selected.notes && <DetailRow icon="📝" label="Notes" value={selected.notes} />}

            {!alreadyCheckedIn && !selected.checkedIn && selected.ticketType !== 'Walk-in' && (
              <div className="bg-purple-50 rounded-2xl p-4 space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">👥 People Checking In</p>
                <div className="flex items-center gap-4">
                  <button onClick={() => updatePeopleCount(Math.max(1, peopleCount - 1))} className="w-10 h-10 rounded-full bg-white shadow text-xl font-bold text-purple-600 active:scale-95">−</button>
                  <span className="text-3xl font-bold text-purple-700 w-8 text-center">{peopleCount}</span>
                  <button onClick={() => updatePeopleCount(Math.min(10, peopleCount + 1))} className="w-10 h-10 rounded-full bg-white shadow text-xl font-bold text-purple-600 active:scale-95">+</button>
                  <span className="text-sm text-gray-500 ml-1">{peopleCount === 1 ? 'person' : 'people'}</span>
                </div>
                {peopleDetails.map((p, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder={`Person ${i + 1} full name`}
                      value={p.name}
                      readOnly={i === 0}
                      onChange={(e) => updatePerson(peopleDetails, setPeopleDetails, i, 'name', e.target.value)}
                      className={`border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${i === 0 ? 'bg-gray-50 border-gray-200 text-gray-500' : 'border-gray-200'}`}
                    />
                    <input
                      type="number"
                      placeholder="Age"
                      value={p.age}
                      onChange={(e) => updatePerson(peopleDetails, setPeopleDetails, i, 'age', e.target.value)}
                      min="0"
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                ))}
              </div>
            )}

            {selected.checkInTime && (
              <div className="bg-green-50 rounded-xl p-3 text-sm text-green-700 flex items-center gap-2">
                ✅ Checked in at {selected.checkInTime}
              </div>
            )}
          </div>

          <div className="p-4 pt-0 space-y-2">
            {!alreadyCheckedIn && !selected.checkedIn ? (
              <button onClick={handleCheckIn} disabled={checkingIn}
                className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold text-lg shadow-md active:scale-95 transition-transform disabled:opacity-50">
                {checkingIn ? '⏳ Processing...' : `✅ Check In ${peopleCount > 1 ? `(${peopleCount} people)` : ''}`}
              </button>
            ) : (
              <div className="w-full bg-green-100 text-green-700 py-4 rounded-2xl font-bold text-lg text-center">
                ✓ Already Checked In Today
              </div>
            )}
            <button onClick={handleClear} className="w-full bg-gray-100 text-gray-600 py-3 rounded-2xl font-semibold active:scale-95 transition-transform">
              Search Another Guest
            </button>
          </div>
        </div>
      )}

      {query.length >= 2 && results.length === 0 && !selected && !loading && (
        <div className="text-center py-10 text-gray-400">
          <span className="text-4xl block mb-2">🔍</span>
          <p className="font-medium">No guests found</p>
          <p className="text-sm mt-1">Try a different name or use Walk-in Guest</p>
        </div>
      )}

      {!query && !selected && !loading && (
        <div className="text-center py-6 text-gray-400">
          <span className="text-4xl block mb-2">👥</span>
          <p className="font-medium">Start typing to search</p>
          <p className="text-sm mt-1">{guests.length} guests loaded</p>
        </div>
      )}

      {/* Walk-in Modal */}
      {showWalkIn && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={resetWalkIn}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 mb-2 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Walk-in Guest</h3>
              <button onClick={resetWalkIn} className="text-gray-400 text-2xl leading-none">✕</button>
            </div>

            {walkInError && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">⚠️ {walkInError}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">First Name *</label>
                <input type="text" placeholder="First name" value={walkInFirstName}
                  onChange={(e) => setWalkInFirstName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Last Name</label>
                <input type="text" placeholder="Last name" value={walkInLastName}
                  onChange={(e) => setWalkInLastName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Phone Number *</label>
              <input type="tel" placeholder="Phone number" value={walkInPhone}
                onChange={(e) => setWalkInPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>

            {/* People Checking In */}
            <div className="bg-purple-50 rounded-2xl p-4 space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">👥 People Checking In</p>
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => updateWalkInPeopleCount(Math.max(1, walkInPeopleCount - 1))} className="w-10 h-10 rounded-full bg-white shadow text-xl font-bold text-purple-600 active:scale-95">−</button>
                <span className="text-3xl font-bold text-purple-700 w-8 text-center">{walkInPeopleCount}</span>
                <button type="button" onClick={() => updateWalkInPeopleCount(Math.min(10, walkInPeopleCount + 1))} className="w-10 h-10 rounded-full bg-white shadow text-xl font-bold text-purple-600 active:scale-95">+</button>
                <span className="text-sm text-gray-500 ml-1">{walkInPeopleCount === 1 ? 'person' : 'people'}</span>
              </div>
              {walkInPeopleDetails.map((p, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={`Person ${i + 1} full name`}
                    value={p.name}
                    readOnly={i === 0}
                    onChange={(e) => updatePerson(walkInPeopleDetails, setWalkInPeopleDetails, i, 'name', e.target.value)}
                    className={`border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${i === 0 ? 'bg-gray-50 border-gray-200 text-gray-500' : 'border-gray-200'}`}
                  />
                  <input
                    type="number"
                    placeholder="Age"
                    value={p.age}
                    onChange={(e) => updatePerson(walkInPeopleDetails, setWalkInPeopleDetails, i, 'age', e.target.value)}
                    min="0"
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              ))}
            </div>

            {/* Donation */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Donation Amount</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {(['Cash', 'Zelle', 'Check'] as const).map((method) => (
                  <button key={method} type="button" onClick={() => setWalkInPayment(method)}
                    className={`py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 ${walkInPayment === method ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-700'}`}>
                    {method === 'Cash' ? '💵 Cash' : method === 'Zelle' ? '📱 Zelle' : '🖊️ Check'}
                  </button>
                ))}
              </div>
              <input type="number" placeholder="Amount ($)" value={walkInAmount}
                onChange={(e) => setWalkInAmount(e.target.value)} min="0" step="0.01"
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button onClick={resetWalkIn} className="py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold active:scale-95">Cancel</button>
              <button onClick={handleWalkInCheckIn} className="py-3 rounded-xl bg-purple-600 text-white font-semibold active:scale-95">Check In</button>
            </div>
          </div>
        </div>
      )}

      {/* Consent Modal */}
      {showConsent && (
        <ConsentModal
          people={consentPeople}
          primaryPhone={consentPhone}
          onComplete={() => {
            setShowConsent(false);
            if (pendingWalkIn.current) {
              doWalkInCheckIn();
            } else {
              doCheckIn();
            }
          }}
          onCancel={() => {
            setShowConsent(false);
            pendingWalkIn.current = null;
            setCheckingIn(false);
          }}
        />
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
