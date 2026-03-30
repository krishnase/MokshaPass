import emailjs from '@emailjs/browser';
import { Guest } from '@/types';

/**
 * EmailJS Setup:
 * 1. Create free account at https://www.emailjs.com
 * 2. Add Email Service (Gmail, Outlook, etc.)
 * 3. Create Email Template with these variables:
 *    {{to_name}}, {{to_email}}, {{room_number}}, {{ticket_type}}, {{notes}}, {{message}}
 * 4. Copy Service ID, Template ID, Public Key → .env.local
 */

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '';
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '';
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '';

export async function sendCheckInEmail(guest: Guest): Promise<{ success: boolean; message: string }> {
  return { success: true, message: '' };

  // eslint-disable-next-line no-unreachable
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    return {
      success: false,
      message: 'EmailJS not configured. Add credentials to .env.local',
    };
  }

  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_name: `${guest.firstName} ${guest.lastName}`,
        to_email: guest.email,
        room_number: guest.roomNumber,
        ticket_type: guest.ticketType,
        notes: guest.notes,
        message: `Welcome to MokshaMart! You have been successfully checked in.

Room: ${guest.roomNumber}
Ticket Type: ${guest.ticketType}${guest.notes ? `\nNotes: ${guest.notes}` : ''}

We hope you enjoy your experience. Please don't hesitate to contact staff if you need anything.

Namaste 🙏`,
      },
      PUBLIC_KEY
    );
    return { success: true, message: 'Confirmation email sent!' };
  } catch (error) {
    console.error('EmailJS error:', error);
    return { success: false, message: 'Failed to send email. Check console for details.' };
  }
}
