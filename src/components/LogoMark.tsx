type Props = {
  className?: string;
  invert?: boolean;
  title?: string;
};

/**
 * Royal Boutiques crisp SVG monogram — crown over interlocking RB.
 * Scales sharp at any size. Use for header / favicon / app icon.
 */
export function LogoMark({ className = "", invert = false, title = "Royal Boutiques" }: Props) {
  const gold = invert ? "#E8D5A8" : "#C5A059";
  const ink = invert ? "#FAF7F2" : "#1A1A1A";
  return (
    <svg
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
      shapeRendering="geometricPrecision"
    >
      <title>{title}</title>
      {/* Crown */}
      <g fill={gold}>
        <path d="M30 32 L36 18 L45 28 L60 14 L75 28 L84 18 L90 32 Z" />
        <circle cx="36" cy="18" r="2.2" />
        <circle cx="60" cy="14" r="2.6" />
        <circle cx="84" cy="18" r="2.2" />
        <rect x="30" y="34" width="60" height="3" rx="1" />
      </g>
      {/* Monogram RB */}
      <g fill={ink} fontFamily="'Playfair Display', 'Times New Roman', serif" fontWeight={500}>
        <text x="60" y="86" textAnchor="middle" fontSize="48" letterSpacing="-2">RB</text>
      </g>
      {/* Bottom flourish */}
      <g stroke={gold} strokeWidth="1.2" fill="none" strokeLinecap="round">
        <line x1="32" y1="100" x2="54" y2="100" />
        <line x1="66" y1="100" x2="88" y2="100" />
        <circle cx="60" cy="100" r="2" fill={gold} stroke="none" />
      </g>
    </svg>
  );
}

/**
 * Full lockup — monogram + wordmark beneath.
 */
export function LogoFull({ className = "", invert = false }: Props) {
  const gold = invert ? "#E8D5A8" : "#C5A059";
  const ink = invert ? "#FAF7F2" : "#1A1A1A";
  return (
    <svg
      viewBox="0 0 280 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Royal Boutiques"
      shapeRendering="geometricPrecision"
    >
      <title>Royal Boutiques</title>
      <g transform="translate(80, 0)">
        <g fill={gold}>
          <path d="M30 28 L36 16 L45 25 L60 12 L75 25 L84 16 L90 28 Z" />
          <circle cx="36" cy="16" r="2" />
          <circle cx="60" cy="12" r="2.4" />
          <circle cx="84" cy="16" r="2" />
          <rect x="30" y="30" width="60" height="2.5" rx="1" />
        </g>
        <text x="60" y="78" textAnchor="middle" fontSize="42" fontFamily="'Playfair Display', serif" fontWeight={500} fill={ink} letterSpacing="-2">RB</text>
      </g>
      <text x="140" y="100" textAnchor="middle" fontSize="14" letterSpacing="6" fontFamily="'Playfair Display', serif" fill={ink}>ROYAL</text>
      <text x="140" y="115" textAnchor="middle" fontSize="7" letterSpacing="8" fontFamily="Inter, system-ui, sans-serif" fill={gold}>BOUTIQUES</text>
    </svg>
  );
}
