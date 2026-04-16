'use client';

import { useState } from 'react';
import { postToSheet } from '@/lib/api';

const VOLUNTEER_ROLES = [
  { id: 'youtube', icon: '🎬', label: 'YouTube Edits' },
  { id: 'phone', icon: '📞', label: 'Phone Calls / Outreach' },
  { id: 'hosting', icon: '🏠', label: 'Hosting Events' },
  { id: 'photography', icon: '📸', label: 'Photography & Video' },
  { id: 'social', icon: '📱', label: 'Social Media' },
  { id: 'design', icon: '🎨', label: 'Graphic Design' },
  { id: 'writing', icon: '📝', label: 'Writing & Content' },
  { id: 'music', icon: '🎵', label: 'Music & Sound' },
  { id: 'translation', icon: '🌐', label: 'Translation' },
  { id: 'tech', icon: '💻', label: 'Tech Support' },
  { id: 'events', icon: '🎪', label: 'Event Planning' },
  { id: 'seva', icon: '🙏', label: 'General Seva' },
];

interface Props {
  onClose: () => void;
}

export default function VolunteerInterestForm({ onClose }: Props) {
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [other, setOther] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const toggleRole = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!fullName.trim()) { setError('Full name is required'); return; }
    if (!phone.trim()) { setError('Phone number is required'); return; }
    if (selected.length === 0 && !other.trim()) { setError('Please select at least one area of interest'); return; }

    const roles = [
      ...selected.map((id) => VOLUNTEER_ROLES.find((r) => r.id === id)?.label || id),
      ...(other.trim() ? [`Other: ${other.trim()}`] : []),
    ].join(', ');

    postToSheet({
      type: 'volunteer_interest',
      fullName: fullName.trim(),
      location: `${city.trim()}${city.trim() && state.trim() ? ', ' : ''}${state.trim()}`,
      phone: phone.trim(),
      email: email.trim(),
      roles,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString(),
    });

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
        <div className="bg-white w-full max-w-lg rounded-t-3xl p-8 text-center space-y-4 mb-0">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-4xl">🙏</div>
          <h3 className="text-2xl font-bold text-gray-800">Thank You!</h3>
          <p className="text-gray-500">Your volunteer interest has been submitted. WayToMoksha will reach out to you soon.</p>
          <button onClick={onClose}
            className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold text-lg active:scale-95 transition-transform">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="px-5 pt-5 pb-3 shrink-0 flex items-center justify-between border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Volunteer with Us 🤲</h3>
            <p className="text-sm text-gray-400">Join the WayToMoksha team</p>
          </div>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">✕</button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">⚠️ {error}</p>}

          {/* Personal Info */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Personal Info</p>
            <input type="text" placeholder="Full Name *" value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="City" value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
              <input type="text" placeholder="State" value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
            <input type="tel" placeholder="Phone Number *" value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
            <input type="email" placeholder="Email (optional)" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>

          {/* Volunteer Roles */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Areas of Interest *</p>
            <div className="grid grid-cols-2 gap-2">
              {VOLUNTEER_ROLES.map((role) => {
                const isSelected = selected.includes(role.id);
                return (
                  <button key={role.id} type="button" onClick={() => toggleRole(role.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'bg-white border-gray-200 text-gray-700'
                    }`}>
                    <span className="text-lg shrink-0">{role.icon}</span>
                    <span className="text-xs font-semibold leading-tight">{role.label}</span>
                  </button>
                );
              })}
            </div>
            <input type="text" placeholder="Other (please specify)" value={other}
              onChange={(e) => setOther(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 shrink-0 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold active:scale-95 transition-transform">
            Cancel
          </button>
          <button onClick={handleSubmit}
            className="flex-1 py-3 rounded-2xl bg-purple-600 text-white font-bold active:scale-95 transition-transform shadow-md">
            Submit Interest
          </button>
        </div>
      </div>
    </div>
  );
}
