export const formatPrice = (n: number | string | null | undefined) => {
  const v = typeof n === "string" ? Number(n) : (n ?? 0);
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(v);
};

export const WHATSAPP_NUMBER = "+254743917957";
export const buildWhatsAppUrl = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

export const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");
