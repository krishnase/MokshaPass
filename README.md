# 🕉️ MokshaPass

A mobile-first web application for **Sales Tracking, Inventory Management, and Guest Check-In** — built for MokshaMart staff.

---

## ✨ Features

| Module | Access | Description |
|--------|--------|-------------|
| **Sales** | Admin + User | Record sales, auto-calculate totals, delivery toggle, Zelle screenshot upload |
| **Inventory** | Admin only | Add/edit/delete products, live stock levels |
| **Check-In** | Admin + User | Search guests from Google Sheets, check in, send confirmation email |
| **MokshaMart** | Admin + User | Product info page + WhatsApp/website order button |

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/krishnase/MokshaPass.git
cd MokshaPass

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your keys (see setup below)

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Default PINs:**
- Admin: `1234`
- User: `0000`

---

## ⚙️ Environment Setup

Copy `.env.local.example` → `.env.local` and fill in values:

### 1. Change PINs

```env
NEXT_PUBLIC_ADMIN_PIN=your_admin_pin
NEXT_PUBLIC_USER_PIN=your_user_pin
```

---

### 2. Google Sheets (Check-In Data)

1. Open your Google Sheet
2. Structure columns **in this exact order** (Row 1 = headers):

   | A | B | C | D | E | F |
   |---|---|---|---|---|---|
   | First Name | Last Name | Phone | Email | Room Number | Schedule Details |

3. Click **Share → Anyone with the link → Viewer**
4. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```
5. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_GOOGLE_SHEET_ID=your_sheet_id_here
   ```

> If not configured, the app uses built-in demo guest data.

---

### 3. EmailJS (Check-In Confirmation Emails)

1. Create a free account at [emailjs.com](https://www.emailjs.com)
2. Add an **Email Service** (Gmail recommended)
3. Create an **Email Template** with these variables:

   ```
   To: {{to_email}}
   Subject: Welcome to MokshaMart, {{to_name}}!

   Hi {{to_name}},

   You've been checked in!
   Room: {{room_number}}
   Schedule: {{schedule}}

   {{message}}
   ```

4. Copy your credentials to `.env.local`:
   ```env
   NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_xxxxxxx
   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xxxxxxx
   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
   ```

> If not configured, check-in still works — email is skipped with a warning.

---

### 4. Contact / Order Button

```env
# WhatsApp (digits only with country code)
NEXT_PUBLIC_WHATSAPP_NUMBER=14155551234

# Or website
NEXT_PUBLIC_WEBSITE_URL=https://yourwebsite.com
```

---

## 📦 Deployment

### Vercel (Recommended — Free)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import `MokshaPass`
3. Add all environment variables in **Project Settings → Environment Variables**
4. Deploy — done!

### Manual Build

```bash
npm run build
npm start
```

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout + metadata
│   ├── page.tsx            # Main app (auth + tabs)
│   └── globals.css
├── components/
│   ├── Auth/
│   │   └── PinLogin.tsx    # PIN keypad login
│   ├── Sales/
│   │   └── SalesForm.tsx   # Sales recording form
│   ├── Inventory/
│   │   └── InventoryManager.tsx
│   ├── CheckIn/
│   │   └── CheckInSystem.tsx
│   └── MokshaMart/
│       └── MokshaMartInfo.tsx
├── lib/
│   ├── storage.ts          # LocalStorage CRUD
│   ├── sheets.ts           # Google Sheets fetch + search
│   └── email.ts            # EmailJS send
└── types/
    └── index.ts
```

---

## 🔐 Auth Roles

| Role | Sales | Inventory | Check-In | MokshaMart |
|------|-------|-----------|----------|------------|
| Admin | ✅ | ✅ | ✅ | ✅ |
| User | ✅ | ❌ | ✅ | ✅ |

---

## 💾 Data Storage

- **Sales & Inventory** → Browser `localStorage` (persists across sessions)
- **Check-In log** → Browser `localStorage` (daily count, already-checked-in detection)
- **Guest data** → Google Sheets (fetched live)

---

## 📱 Mobile

The app is designed mobile-first with:
- Bottom tab navigation
- Large touch targets
- Native number inputs
- Camera-friendly file upload for Zelle screenshots
- PWA manifest (installable on iOS/Android home screen)

---

## Tech Stack

- **Next.js 15** (App Router)
- **React 19**
- **Tailwind CSS v4**
- **@emailjs/browser** — email sending
- **uuid** — unique IDs
- **Google Sheets gviz API** — public sheet data (no API key needed)
