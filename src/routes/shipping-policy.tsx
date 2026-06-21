import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/shipping-policy")({
  head: () => ({ meta: [{ title: "Shipping Policy — Royal Boutiques" }, { name: "description", content: "Delivery timelines, shipping fees, and tracking for Royal Boutiques orders." }] }),
  component: () => (
    <PolicyPage eyebrow="Customer Care" title="Shipping Policy" updated="June 2026">
      <p>We deliver worldwide with care, using premium courier partners.</p>
      <h2>Delivery Timelines</h2>
      <ul>
        <li>Within Nairobi — 1–2 business days.</li>
        <li>Rest of Kenya — 3–5 business days.</li>
        <li>International — 7–14 business days.</li>
      </ul>
      <h2>Shipping Fees</h2>
      <p>Complimentary shipping on all orders above $250. Standard rates apply otherwise and are calculated at checkout.</p>
      <h2>Tracking</h2>
      <p>You will receive a confirmation email with tracking details once your order ships.</p>
    </PolicyPage>
  ),
});
