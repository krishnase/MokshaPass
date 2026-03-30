'use client';

import { useState, useEffect } from 'react';
import { fetchVolunteers } from '@/lib/sheets';
import { Volunteer } from '@/types';

export default function VolunteerList() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchVolunteers().then((data) => {
      setVolunteers(data);
      setLoading(false);
    });
  }, []);

  const filtered = query.trim()
    ? volunteers.filter(
        (v) =>
          v.name.toLowerCase().includes(query.toLowerCase()) ||
          v.department.toLowerCase().includes(query.toLowerCase()) ||
          v.phone.includes(query)
      )
    : volunteers;

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Moksha Sena</h2>
          <p className="text-sm text-gray-500">{volunteers.length} volunteers</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-orange-400 mb-4">
        <span className="pl-4 text-gray-400 text-xl">🔍</span>
        <input
          type="text"
          placeholder="Search name, department, phone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-3 py-3 text-base bg-transparent focus:outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')} className="pr-4 text-gray-400 text-xl">✕</button>
        )}
      </div>

      {loading && (
        <div className="text-center py-10 text-gray-400">
          <div className="animate-spin text-4xl mb-2">⟳</div>
          <p>Loading volunteers...</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <span className="text-4xl block mb-2">🙏</span>
          <p className="font-medium">No volunteers found</p>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-orange-50 border-b border-orange-100">
                  <th className="text-left px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">#</th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">Name</th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">Phone</th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">Department</th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">Date</th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2.5 text-gray-400 font-medium">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-semibold text-gray-800 whitespace-nowrap">{v.name}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {v.phone
                        ? <a href={`tel:${v.phone}`} className="text-purple-600">{v.phone}</a>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {v.department
                        ? <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-xs font-medium">{v.department}</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                      {v.date ? (() => {
                        const d = new Date(v.date);
                        return isNaN(d.getTime()) ? v.date : d.toLocaleDateString('en-US', { weekday: 'long' });
                      })() : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 max-w-[150px] truncate">{v.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
