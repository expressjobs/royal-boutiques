import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({ meta: [{ title: "Privacy Policy — Royal Boutiques" }, { name: "description", content: "How Royal Boutiques collects, uses, and protects your personal information." }] }),
  component: () => (
    <PolicyPage eyebrow="Legal" title="Privacy Policy" updated="June 2026">
      <p>Royal Boutiques ("we", "our") respects your privacy and is committed to protecting your personal data.</p>
      <h2>Information We Collect</h2>
      <ul>
        <li>Account information — name, email, phone, shipping address.</li>
        <li>Order information — items purchased, payment details (processed securely by our payment partners).</li>
        <li>Browsing data — pages viewed, products favourited, basic analytics.</li>
      </ul>
      <h2>How We Use Your Information</h2>
      <ul>
        <li>To process and deliver your orders.</li>
        <li>To provide concierge support and respond to enquiries.</li>
        <li>To send editorial updates if you have opted in.</li>
      </ul>
      <h2>Your Rights</h2>
      <p>You may request access, correction, or deletion of your data at any time by contacting our concierge team.</p>
    </PolicyPage>
  ),
});
