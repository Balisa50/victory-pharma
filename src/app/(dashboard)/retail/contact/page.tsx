import { Phone, MessageCircle } from "lucide-react";

export default function RetailContactPage() {
  const phone = process.env.CONTACT_PHONE ?? "+220 000 0000";
  const whatsapp = process.env.WHATSAPP_LINK ?? "https://wa.me/2200000000";
  const msg = encodeURIComponent("Hello, I need assistance with my order on Victory Pharmaceutical.");

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Contact Support</h1>
      <div className="max-w-md rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
        <p className="mb-6 text-sm text-gray-500">
          Need help? Reach our support team via phone or WhatsApp.
        </p>
        <div className="space-y-4">
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
          >
            <Phone className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs text-gray-400">Phone</p>
              <p className="font-medium text-gray-900">{phone}</p>
            </div>
          </a>
          <a
            href={`${whatsapp}?text=${msg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
          >
            <MessageCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-xs text-gray-400">WhatsApp</p>
              <p className="font-medium text-gray-900">Chat with us</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
