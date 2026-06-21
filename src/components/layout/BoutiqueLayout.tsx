import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function BoutiqueLayout({ children, hideFooterNewsletter = false }: { children: ReactNode; hideFooterNewsletter?: boolean }) {
  void hideFooterNewsletter;
  return (
    <div className="min-h-screen bg-white text-charcoal font-sans">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
