import { Guest } from '@/types';

/**
 * Fetches guest data from a publicly shared Google Sheet.
 *
 * To use:
 * 1. Share your Google Sheet as "Anyone with the link can view"
 * 2. Copy the Sheet ID from the URL:
 *    https://docs.google.com/spreadsheets/d/SHEET_ID/edit
 * 3. Set NEXT_PUBLIC_GOOGLE_SHEET_ID in .env.local
 *
 * Expected columns (row 1 = headers):
 *   A: First Name  B: Last Name  C: Phone  D: Email
 *   E: Room Number  F: Schedule Details
 */

const SHEET_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || '';

export async function fetchGuests(): Promise<Guest[]> {
  if (!SHEET_ID) return getMockGuests();

  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
    const res = await fetch(url, { cache: 'no-store' });
    const text = await res.text();

    // Strip the Google wrapper: /*O_o*/\ngoogle.visualization.Query.setResponse({...})
    const json = JSON.parse(text.replace(/^[^{]*/, '').replace(/[^}]*$/, ''));
    const rows: Guest[] = [];

    for (const row of json.table.rows) {
      if (!row?.c) continue;
      const cells = row.c.map((c: { v: string | null } | null) => c?.v ?? '');
      rows.push({
        firstName: String(cells[0] || '').trim(),
        lastName: String(cells[1] || '').trim(),
        phone: String(cells[2] || '').trim(),
        email: String(cells[3] || '').trim(),
        roomNumber: String(cells[4] || '').trim(),
        scheduleDetails: String(cells[5] || '').trim(),
      });
    }

    // Filter out header-like empty rows
    return rows.filter((r) => r.firstName || r.lastName || r.phone);
  } catch {
    console.error('Failed to fetch Google Sheet, using mock data');
    return getMockGuests();
  }
}

export function searchGuests(guests: Guest[], query: string): Guest[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  return guests.filter(
    (g) =>
      g.firstName.toLowerCase().includes(q) ||
      g.lastName.toLowerCase().includes(q) ||
      g.phone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
  );
}

function getMockGuests(): Guest[] {
  return [
    {
      firstName: 'Priya',
      lastName: 'Sharma',
      phone: '555-100-2001',
      email: 'priya.sharma@email.com',
      roomNumber: '101',
      scheduleDetails: 'Morning Yoga 7am, Meditation 9am, Ayurvedic Massage 2pm',
    },
    {
      firstName: 'Arjun',
      lastName: 'Patel',
      phone: '555-100-2002',
      email: 'arjun.patel@email.com',
      roomNumber: '205',
      scheduleDetails: 'Sound Bath 10am, Breathwork 1pm, Evening Ceremony 6pm',
    },
    {
      firstName: 'Maya',
      lastName: 'Nair',
      phone: '555-100-2003',
      email: 'maya.nair@email.com',
      roomNumber: '312',
      scheduleDetails: 'Kundalini Yoga 8am, Nutrition Talk 11am, Spa Treatment 3pm',
    },
    {
      firstName: 'Rohan',
      lastName: 'Mehta',
      phone: '555-100-2004',
      email: 'rohan.mehta@email.com',
      roomNumber: '118',
      scheduleDetails: 'Sunrise Meditation 6am, Yoga Flow 8am, Cooking Class 12pm',
    },
    {
      firstName: 'Anita',
      lastName: 'Krishnan',
      phone: '555-100-2005',
      email: 'anita.krishnan@email.com',
      roomNumber: '220',
      scheduleDetails: 'Chakra Alignment 9am, Silent Walk 11am, Fire Ceremony 7pm',
    },
  ];
}
