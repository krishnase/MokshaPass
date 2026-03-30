'use client';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || '';

const steps = [
  {
    number: '01',
    icon: '🛍️',
    title: 'Browse Products',
    desc: 'Explore our curated collection of wellness, spiritual, and lifestyle products — from herbal teas and essential oils to yoga accessories and meditation tools.',
  },
  {
    number: '02',
    icon: '✅',
    title: 'Select Your Items',
    desc: 'Choose the products you love. Note the item name and quantity so we can prepare your order accurately.',
  },
  {
    number: '03',
    icon: '💬',
    title: 'Contact Us to Order',
    desc: 'Reach out via WhatsApp or our website with your order details. Our team will confirm availability and provide a final quote within minutes.',
  },
  {
    number: '04',
    icon: '💳',
    title: 'Choose Payment Method',
    desc: 'We accept Cash and Zelle for fast, secure payments. For Zelle, simply send your payment and share a screenshot for confirmation.',
  },
  {
    number: '05',
    icon: '🚚',
    title: 'Delivery or Pickup',
    desc: 'Choose convenient local delivery ($15 flat fee) or free pickup. Deliveries are handled same-day or next-day within our service area.',
  },
];

export default function MokshaMartInfo() {
  const handleContact = () => {
    if (WHATSAPP_NUMBER) {
      window.open(
        `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=Hi%2C%20I%20would%20like%20to%20place%20an%20order%20from%20MokshaMart!`,
        '_blank'
      );
    } else if (WEBSITE_URL) {
      window.open(WEBSITE_URL, '_blank');
    } else {
      alert('Contact info not configured. Add NEXT_PUBLIC_WHATSAPP_NUMBER to .env.local');
    }
  };

  return (
    <div className="pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-br from-purple-700 via-indigo-700 to-violet-800 px-6 py-10 text-white text-center">
        <div className="text-5xl mb-3">🪷</div>
        <h1 className="text-3xl font-bold mb-2">MokshaMart</h1>
        <p className="text-purple-200 text-base max-w-xs mx-auto">
          Your wellness marketplace for mindful living
        </p>
        <div className="flex justify-center gap-3 mt-4 flex-wrap">
          <Chip>🌿 Organic</Chip>
          <Chip>✨ Curated</Chip>
          <Chip>🚚 Fast Delivery</Chip>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {/* How to Buy */}
        <h2 className="text-xl font-bold text-gray-800 mt-4 mb-4">How to Buy from MokshaMart</h2>

        <div className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4"
            >
              <div className="shrink-0 flex flex-col items-center">
                <span className="text-2xl">{step.icon}</span>
                <span className="text-xs font-bold text-purple-300 mt-1">{step.number}</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-0.5">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Info */}
        <div className="mt-6 bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
            <span>💳</span> Payment Options
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <p className="text-2xl mb-1">💵</p>
              <p className="font-semibold text-gray-700">Cash</p>
              <p className="text-xs text-gray-400 mt-0.5">On delivery or pickup</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <p className="text-2xl mb-1">📱</p>
              <p className="font-semibold text-gray-700">Zelle</p>
              <p className="text-xs text-gray-400 mt-0.5">Send + share screenshot</p>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="mt-3 bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
            <span>🚚</span> Delivery Info
          </h3>
          <ul className="space-y-1.5 text-sm text-blue-700">
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Same-day or next-day delivery</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> $15 flat delivery fee</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Free pickup available</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Local service area</li>
          </ul>
        </div>

        {/* CTA */}
        <button
          onClick={handleContact}
          className="mt-6 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <span>💬</span> Contact / Order Now
        </button>

        <p className="text-center text-xs text-gray-400 mt-3">
          Fast response • Secure payments • Quality guaranteed
        </p>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-white/15 text-white text-sm px-3 py-1 rounded-full border border-white/20">
      {children}
    </span>
  );
}
