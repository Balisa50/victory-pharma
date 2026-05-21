import { Phone, MessageCircle } from "lucide-react";
import { PageHeader, PageBody } from "@/components/shared/Editorial";

export default function RetailContactPage() {
  const phone = process.env.CONTACT_PHONE ?? "+220 000 0000";
  const whatsapp = process.env.WHATSAPP_LINK ?? "https://wa.me/2200000000";
  const msg = encodeURIComponent(
    "Hello, I need assistance with my order on Victory Pharmaceutical."
  );

  return (
    <>
      <PageHeader
        eyebrow="Support"
        title="We are"
        accent="here to help"
        description="Reach a real person on the Victory team, eight in the morning to eight at night, every day."
      />

      <PageBody>
        <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <a
            href={`tel:${phone}`}
            className="group rounded-2xl bg-white p-7 ring-1 ring-[hsl(var(--navy))]/5 transition-shadow hover:shadow-[0_8px_30px_rgba(13,31,78,0.08)]"
          >
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-[hsl(var(--navy))]">
              <Phone className="h-4 w-4 text-[hsl(var(--gold))]" />
            </div>
            <p className="eyebrow mb-1 text-[hsl(var(--red-2))]">Call us</p>
            <p className="serif text-[18px] text-[hsl(var(--navy))]">{phone}</p>
            <p className="mt-2 text-[12.5px] font-light text-neutral-500">
              Tap to dial from your phone.
            </p>
          </a>

          <a
            href={`${whatsapp}?text=${msg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl bg-white p-7 ring-1 ring-[hsl(var(--navy))]/5 transition-shadow hover:shadow-[0_8px_30px_rgba(13,31,78,0.08)]"
          >
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-[hsl(var(--green))]">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <p className="eyebrow mb-1 text-[hsl(var(--red-2))]">WhatsApp</p>
            <p className="serif text-[18px] text-[hsl(var(--navy))]">Chat with us</p>
            <p className="mt-2 text-[12.5px] font-light text-neutral-500">
              Opens a conversation with your order pre-filled.
            </p>
          </a>
        </div>
      </PageBody>
    </>
  );
}
