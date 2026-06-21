import { createFileRoute } from "@tanstack/react-router";
import { BoutiqueLayout } from "@/components/layout/BoutiqueLayout";
import { useState } from "react";
import { toast } from "sonner";
import { buildWhatsAppUrl } from "@/lib/format";
import { Mail, MessageCircle, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — Royal Boutiques" }] }),
  component: ContactPage,
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  return (
    <BoutiqueLayout>
      <section className="bg-nude py-20 text-center">
        <p className="eyebrow text-gold">Concierge</p>
        <h1 className="font-serif text-5xl mt-3">Get in Touch</h1>
        <p className="text-charcoal/60 mt-4 max-w-xl mx-auto px-6">
          From styling advice to order questions — our team is here to help.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16">
        <div>
          <h2 className="font-serif text-2xl mb-6">Reach Us</h2>
          <div className="space-y-5 text-sm">
            <Item icon={<Mail className="h-4 w-4" />} title="Email" detail="concierge@royalboutiques.com" />
            <Item icon={<MessageCircle className="h-4 w-4" />} title="WhatsApp" detail="Chat with a stylist now" />
            <Item icon={<MapPin className="h-4 w-4" />} title="Studio" detail="Avenue Montaigne, Paris" />
          </div>
          <a href={buildWhatsAppUrl("Hello Royal Boutiques, I have a question")} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold">
            <MessageCircle className="h-4 w-4" /> Open WhatsApp
          </a>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); toast.success("Message sent. We'll reply within one business day."); setForm({ name: "", email: "", message: "" }); }}
          className="space-y-4"
        >
          <h2 className="font-serif text-2xl mb-2">Send a Message</h2>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="w-full border border-charcoal/15 px-4 py-3 text-sm rounded" />
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full border border-charcoal/15 px-4 py-3 text-sm rounded" />
          <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we help?" className="w-full border border-charcoal/15 px-4 py-3 text-sm rounded" />
          <button className="bg-charcoal text-white px-8 py-3 text-[11px] uppercase tracking-[0.25em] font-semibold">Send</button>
        </form>
      </section>
    </BoutiqueLayout>
  );
}

function Item({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-gold">{icon}</span>
      <div>
        <p className="eyebrow text-charcoal/60">{title}</p>
        <p className="mt-1">{detail}</p>
      </div>
    </div>
  );
}
