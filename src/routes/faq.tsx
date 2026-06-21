import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ — Royal Boutiques" }, { name: "description", content: "Answers to frequently asked questions about shopping at Royal Boutiques." }] }),
  component: () => (
    <PolicyPage eyebrow="Concierge" title="Frequently Asked Questions">
      <h3>How long does delivery take?</h3>
      <p>1–2 business days within Nairobi, 3–5 days countrywide, and 7–14 days internationally.</p>
      <h3>Can I exchange an item for a different size?</h3>
      <p>Yes, subject to availability and within 14 days of delivery. See our <a href="/returns-policy">Returns Policy</a>.</p>
      <h3>Do you offer styling advice?</h3>
      <p>Our concierge team is available 9am–6pm EAT, Monday–Saturday. <a href="/contact">Get in touch</a>.</p>
      <h3>How do I find my size?</h3>
      <p>Refer to our <a href="/size-guide">Size Guide</a> for detailed measurements.</p>
      <h3>Are gift wrapping and personalised notes available?</h3>
      <p>Yes, you can request these at checkout at no additional cost.</p>
    </PolicyPage>
  ),
});
