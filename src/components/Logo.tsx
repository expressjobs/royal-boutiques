import fullAsset from "@/assets/brand/royal-logo-full.jpg.asset.json";
import monogramAsset from "@/assets/brand/royal-monogram.png.asset.json";

export const ROYAL_LOGO_FULL = fullAsset.url;
export const ROYAL_LOGO_MONOGRAM = monogramAsset.url;

type LogoProps = {
  variant?: "full" | "monogram" | "wordmark";
  className?: string;
  invert?: boolean;
  alt?: string;
};

/**
 * Royal Boutiques brand logo.
 * - "full" — crown + RB + "Royal Boutiques" wordmark (the master mark)
 * - "monogram" — crown + RB only (favicon / mobile / app icon)
 * - "wordmark" — text-only typographic lockup
 */
export function Logo({ variant = "full", className = "", invert = false, alt = "Royal Boutiques" }: LogoProps) {
  if (variant === "wordmark") {
    return (
      <span
        className={`inline-flex flex-col items-center leading-none ${className}`}
        aria-label={alt}
      >
        <span className={`font-serif tracking-[0.18em] ${invert ? "text-nude" : "text-charcoal"}`}>
          ROYAL
        </span>
        <span className={`mt-1 text-[0.55em] tracking-[0.35em] ${invert ? "text-gold-soft" : "text-gold"}`}>
          BOUTIQUES
        </span>
      </span>
    );
  }

  const src = variant === "monogram" ? ROYAL_LOGO_MONOGRAM : ROYAL_LOGO_FULL;
  return (
    <img
      src={src}
      alt={alt}
      className={`${className} ${invert ? "invert brightness-110" : ""} object-contain select-none`}
      draggable={false}
    />
  );
}
