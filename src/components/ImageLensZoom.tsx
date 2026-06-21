import { useState, useRef } from "react";

/**
 * Desktop: hover lens (2x). Mobile: tap to toggle full pinch-zoomable overlay.
 */
export function ImageLensZoom({ src, alt }: { src: string; alt: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [fullOpen, setFullOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  };

  return (
    <>
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={() => setPos(null)}
        onClick={() => setFullOpen(true)}
        className="relative aspect-[4/5] bg-soft rounded-3xl overflow-hidden cursor-zoom-in select-none"
      >
        <img src={src} alt={alt} className="h-full w-full object-cover" draggable={false} />
        {pos && (
          <div
            className="pointer-events-none absolute inset-0 hidden md:block"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: "200%",
              backgroundPosition: `${pos.x}% ${pos.y}%`,
              backgroundRepeat: "no-repeat",
            }}
          />
        )}
      </div>

      {fullOpen && (
        <div
          className="fixed inset-0 z-[90] bg-charcoal/95 grid place-items-center p-4"
          onClick={() => setFullOpen(false)}
        >
          <img
            src={src}
            alt={alt}
            className="max-h-full max-w-full object-contain"
            style={{ touchAction: "pinch-zoom" }}
          />
          <button
            onClick={() => setFullOpen(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full h-10 w-10 grid place-items-center text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
