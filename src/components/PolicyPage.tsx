import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function PolicyPage({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-nude">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link to="/" className="text-[10px] uppercase tracking-[0.25em] text-charcoal/50 hover:text-gold">
          ← Back to Royal Boutiques
        </Link>
        <p className="eyebrow text-gold mt-8">{eyebrow}</p>
        <h1 className="font-serif text-4xl md:text-5xl mt-3 mb-2">{title}</h1>
        {updated && <p className="text-xs uppercase tracking-[0.2em] text-charcoal/40 mb-10">Last updated {updated}</p>}
        <div className="prose prose-charcoal max-w-none text-charcoal/80 text-[15px] leading-relaxed space-y-6 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-charcoal [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:font-serif [&_h3]:text-lg [&_h3]:text-charcoal [&_h3]:mt-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_a]:text-gold [&_a]:underline">
          {children}
        </div>
      </div>
    </main>
  );
}
