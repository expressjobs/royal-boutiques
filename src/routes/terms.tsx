import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms & Conditions — Royal Boutiques" }, { name: "description", content: "Terms governing use of the Royal Boutiques website and services." }] }),
  component: () => (
    <PolicyPage eyebrow="Legal" title="Terms & Conditions" updated="June 2026">
      <p>By accessing royalboutiques.com you agree to the following terms.</p>
      <h2>Use of Site</h2>
      <p>The content of this site is for your personal, non-commercial use. You may not reproduce, distribute, or modify any material without written permission.</p>
      <h2>Orders & Pricing</h2>
      <p>All orders are subject to availability and confirmation. Prices are displayed in local currency and may change without notice.</p>
      <h2>Limitation of Liability</h2>
      <p>Royal Boutiques shall not be liable for indirect or consequential damages arising from use of this site or its products.</p>
      <h2>Governing Law</h2>
      <p>These terms are governed by the laws of the country in which Royal Boutiques operates.</p>
    </PolicyPage>
  ),
});
