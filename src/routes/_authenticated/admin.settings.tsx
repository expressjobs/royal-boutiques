import { createFileRoute } from "@tanstack/react-router";
import { WHATSAPP_NUMBER } from "@/lib/format";
import { Store, MessageCircle, Mail, Globe } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin · Royal Boutiques" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-3xl mb-2">Store Settings</h1>
      <p className="text-sm text-charcoal/60 mb-10">General configuration for Royal Boutiques.</p>

      <div className="space-y-6">
        <Card icon={<Store className="h-5 w-5" />} title="Brand">
          <Row label="Store name" value="Royal Boutiques" />
          <Row label="Slogan" value="Luxury Fashion. Timeless Elegance." />
          <Row label="Currency" value="KES" />
        </Card>

        <Card icon={<MessageCircle className="h-5 w-5" />} title="WhatsApp Orders">
          <Row label="Order line" value={WHATSAPP_NUMBER} />
          <p className="text-xs text-charcoal/50 mt-3">
            Update in <code className="bg-nude px-1.5 py-0.5 rounded">src/lib/format.ts</code>
          </p>
        </Card>

        <Card icon={<Mail className="h-5 w-5" />} title="Contact">
          <Row label="Concierge email" value="concierge@royabotiques.com" />
          <Row label="Support" value="support@royabotiques.com" />
        </Card>

        <Card icon={<Globe className="h-5 w-5" />} title="Shipping">
          <Row label="Free shipping threshold" value="KES 5,000" />
          <Row label="Standard shipping" value="Configured at checkout" />
        </Card>
      </div>
    </div>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-charcoal/5 p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="h-10 w-10 grid place-items-center bg-nude rounded-lg text-gold">
          {icon}
        </span>
        <h2 className="font-serif text-xl">{title}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-charcoal/5 last:border-0">
      <span className="text-sm text-charcoal/60">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
