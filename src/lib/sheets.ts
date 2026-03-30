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
 *   A: Order date  B: Guest first name  C: Guest last name  D: Email
 *   E: Ticket type  F: Phone Number  G: Room Number  H: Checked In  I: Notes
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
        orderDate: String(cells[0] || '').trim(),
        firstName: String(cells[1] || '').trim(),
        lastName: String(cells[2] || '').trim(),
        email: String(cells[3] || '').trim(),
        ticketType: String(cells[4] || '').trim(),
        phone: String(cells[5] || '').trim(),
        roomNumber: String(cells[6] || '').trim(),
        notes: String(cells[8] || '').trim(),
      });
    }

    // Filter out header-like empty rows
    return rows.filter((r) => r.firstName || r.lastName || r.phone || r.email);
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
      orderDate: '2026-03-01',
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya.sharma@email.com',
      ticketType: 'Weekend Retreat',
      phone: '555-100-2001',
      roomNumber: '101',
      notes: '',
    },
    {
      orderDate: '2026-03-02',
      firstName: 'Arjun',
      lastName: 'Patel',
      email: 'arjun.patel@email.com',
      ticketType: 'Full Program',
      phone: '555-100-2002',
      roomNumber: '205',
      notes: 'Vegetarian meals',
    },
    {
      orderDate: '2026-03-02',
      firstName: 'Maya',
      lastName: 'Nair',
      email: 'maya.nair@email.com',
      ticketType: 'Day Pass',
      phone: '555-100-2003',
      roomNumber: '312',
      notes: '',
    },
    {
      orderDate: '2026-03-03',
      firstName: 'Rohan',
      lastName: 'Mehta',
      email: 'rohan.mehta@email.com',
      ticketType: 'Weekend Retreat',
      phone: '555-100-2004',
      roomNumber: '118',
      notes: 'Early arrival requested',
    },
    {
      orderDate: '2026-03-03',
      firstName: 'Anita',
      lastName: 'Krishnan',
      email: 'anita.krishnan@email.com',
      ticketType: 'Full Program',
      phone: '555-100-2005',
      roomNumber: '220',
      notes: '',
    },
  ];
}
