import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/returns-policy")({
  head: () => ({ meta: [{ title: "Returns & Refunds — Royal Boutiques" }, { name: "description", content: "Our policy on returns, exchanges, and refunds for Royal Boutiques purchases." }] }),
  component: () => (
    <PolicyPage eyebrow="Customer Care" title="Returns & Refunds" updated="June 2026">
      <p>Your satisfaction is our priority. We accept returns within 14 days of delivery.</p>
      <h2>Eligibility</h2>
      <ul>
        <li>Items must be unworn, unwashed, and in original packaging with all tags.</li>
        <li>Sale and final-sale items are non-returnable unless faulty.</li>
        <li>Earrings and bespoke pieces are non-returnable for hygiene reasons.</li>
      </ul>
      <h2>How to Return</h2>
      <p>Contact our concierge team to initiate a return. We will arrange collection or provide a return address.</p>
      <h2>Refunds</h2>
      <p>Refunds are processed to the original payment method within 5–7 business days of receiving the returned item.</p>
    </PolicyPage>
  ),
});
