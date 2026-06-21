import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Heart, ShoppingBag, User, Menu, X, Sparkles, Shirt, Footprints, Gem, Tag, Crown, ChevronRight, Baby, Home, Flower2, ShoppingBasket } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist } from "@/hooks/use-wishlist";
import { LogoMark, LogoFull } from "@/components/LogoMark";

const NAV = [
  { label: "Women", href: "/category/women", icon: ShoppingBasket },
  { label: "Men", href: "/category/men", icon: Shirt },
  { label: "Kids", href: "/category/kids", icon: Baby },
  { label: "Shoes", href: "/category/shoes", icon: Footprints },
  { label: "Jewelry", href: "/category/jewelry", icon: Gem },
  { label: "Home & Living", href: "/category/home-living", icon: Home },
  { label: "Beauty", href: "/category/beauty", icon: Flower2 },
  { label: "Sale", href: "/category/sale", icon: Tag },
  { label: "New Arrivals", href: "/category/new-arrivals", icon: Sparkles },
];

export function Header() {
  const { count } = useCart();
  const { user, isAdmin } = useAuth();
  const { items: wishlist } = useWishlist();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const wishlistCount = wishlist.length;
  const initials = (user?.email ?? "?").charAt(0).toUpperCase();
  const iconCls = "transition-colors duration-200 hover:text-gold active:text-gold focus-visible:text-gold";

  return (
    <>
      <div className="bg-charcoal py-2 px-4">
        <p className="text-[10px] tracking-[0.2em] text-center text-white/90 uppercase">
          Fashion · Home · Lifestyle · Free Delivery Over KES 5,000
        </p>
      </div>
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/75 backdrop-blur-xl shadow-[0_4px_24px_-12px_rgba(26,26,26,0.15)]"
            : "bg-white/95 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 lg:h-24 grid grid-cols-[auto_1fr_auto] items-center gap-3 lg:gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <button
              onClick={() => setOpen(true)}
              className={`lg:hidden -ml-2 p-2.5 shrink-0 rounded-full ${iconCls}`}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden lg:flex gap-6 text-[11px] uppercase tracking-[0.18em] font-medium">
              {NAV.slice(0, 4).map((n) => (
                <Link key={n.href} to={n.href} className="hover:text-gold transition-colors">{n.label}</Link>
              ))}
            </div>
          </div>

          <Link
            to="/"
            className="flex items-center justify-center py-2 px-3"
            aria-label="Royal Boutiques — Home"
          >
            <LogoMark className="lg:hidden h-12 w-12" />
            <LogoFull className="hidden lg:block h-16 w-auto" />
          </Link>

          <div className="flex items-center justify-end gap-4 sm:gap-5 text-charcoal">
            <div className="hidden lg:flex gap-6 text-[11px] uppercase tracking-[0.18em] font-medium mr-2">
              {NAV.slice(4, 8).map((n) => (
                <Link key={n.href} to={n.href} className="hover:text-gold transition-colors">{n.label}</Link>
              ))}
            </div>
            <Link to="/shop" aria-label="Search" className={`hidden sm:block ${iconCls}`}>
              <Search className="h-[19px] w-[19px]" />
            </Link>
            <Link to="/wishlist" aria-label="Wishlist" className={`relative ${iconCls}`}>
              <Heart className="h-[19px] w-[19px]" />
              <span
                className={`absolute -top-2 -right-2 bg-gold text-white text-[9px] rounded-full h-[18px] min-w-[18px] px-1 grid place-items-center font-semibold ring-2 ring-white shadow-sm ${
                  wishlistCount > 0 ? "" : "opacity-0"
                }`}
                aria-hidden={wishlistCount === 0}
              >
                {wishlistCount}
              </span>
            </Link>
            <Link to={user ? "/account" : "/auth"} aria-label="Account" className={iconCls}>
              <User className="h-[19px] w-[19px]" />
            </Link>
            <Link to="/cart" aria-label="Bag" className={`relative ${iconCls}`}>
              <ShoppingBag className="h-[19px] w-[19px]" />
              <span
                className={`absolute -top-2 -right-2 bg-charcoal text-white text-[9px] rounded-full h-[18px] min-w-[18px] px-1 grid place-items-center font-semibold ring-2 ring-white shadow-sm ${
                  count > 0 ? "" : "opacity-0"
                }`}
                aria-hidden={count === 0}
              >
                {count}
              </span>
            </Link>
          </div>
        </div>
        {/* Gold accent divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      </nav>

      {/* Mobile luxury slide-out */}
      <div
        className={`fixed inset-0 z-[70] lg:hidden transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      >
        <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" />
      </div>
      <aside
        className={`fixed top-0 left-0 z-[80] h-[100dvh] w-[88%] max-w-sm bg-nude shadow-2xl flex flex-col transition-transform duration-300 ease-out lg:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 pt-6 pb-4 border-b border-charcoal/10 bg-white">
          <div className="flex items-center justify-between mb-5">
            <Link to="/" onClick={() => setOpen(false)} aria-label="Royal Boutiques — Home">
              <LogoMark className="h-14 w-14" />
            </Link>
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="-mr-2 p-2 hover:text-gold transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {user ? (
            <Link to="/account" className="flex items-center gap-3 group">
              <div className="h-11 w-11 rounded-full bg-gold text-white grid place-items-center font-serif text-lg">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-charcoal/50">Signed in</p>
                <p className="text-sm font-medium truncate">{user.email}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-charcoal/40 group-hover:text-gold" />
            </Link>
          ) : (
            <Link to="/auth" className="flex items-center justify-center gap-2 w-full bg-charcoal text-white py-3 text-[11px] uppercase tracking-[0.25em] font-semibold rounded">
              <User className="h-4 w-4" /> Sign In / Register
            </Link>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); if (search) window.location.href = `/shop?q=${encodeURIComponent(search)}`; }}
            className="mt-4 flex items-center gap-2 bg-nude border border-charcoal/10 rounded-full px-4 py-2.5"
          >
            <Search className="h-4 w-4 text-charcoal/50 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="bg-transparent flex-1 min-w-0 text-sm focus:outline-none placeholder:text-charcoal/40"
            />
          </form>
        </div>

        <Link
          to="/category/new-arrivals"
          className="mx-6 mt-5 flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-gold to-gold-soft text-white shadow-sm"
        >
          <span>
            <span className="block text-[10px] uppercase tracking-[0.2em] opacity-80">Just Landed</span>
            <span className="block font-serif text-lg italic">Shop New Arrivals</span>
          </span>
          <Sparkles className="h-5 w-5 shrink-0" />
        </Link>

        <nav className="flex-1 overflow-y-auto px-6 py-5 space-y-1">
          <p className="eyebrow text-charcoal/40 mb-3">Shop by Category</p>
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                to={n.href}
                className={`flex items-center gap-4 px-3 py-3.5 rounded-xl transition-colors ${
                  active ? "bg-white text-gold shadow-sm" : "text-charcoal hover:bg-white/60"
                }`}
              >
                <span className={`h-9 w-9 grid place-items-center rounded-lg ${active ? "bg-gold/10" : "bg-white"}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm font-medium">{n.label}</span>
                <ChevronRight className="h-4 w-4 text-charcoal/30" />
              </Link>
            );
          })}

          <div className="pt-6 mt-4 border-t border-charcoal/10 space-y-1">
            <p className="eyebrow text-charcoal/40 mb-3">Explore</p>
            {[
              { label: "Shop All", href: "/shop" },
              { label: "Wishlist", href: "/wishlist", badge: wishlistCount },
              { label: "My Bag", href: "/cart", badge: count },
              { label: "Orders", href: "/account/orders" },
              { label: "About", href: "/about" },
              { label: "Contact", href: "/contact" },
            ].map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className={`flex items-center justify-between px-3 py-3 rounded-xl text-sm transition-colors ${
                  pathname === l.href ? "bg-white text-gold" : "text-charcoal/80 hover:bg-white/60"
                }`}
              >
                <span>{l.label}</span>
                {l.badge ? (
                  <span className="bg-charcoal text-white text-[10px] rounded-full h-5 min-w-5 px-1.5 grid place-items-center font-medium">
                    {l.badge}
                  </span>
                ) : null}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm bg-charcoal text-white mt-2"
              >
                <Crown className="h-4 w-4 text-gold" /> Admin Dashboard
              </Link>
            )}
          </div>
        </nav>

        <div className="px-6 py-4 border-t border-charcoal/10 bg-white">
          <p className="text-[10px] uppercase tracking-[0.2em] text-charcoal/40 text-center">
            Luxury Fashion · Timeless Elegance
          </p>
        </div>
      </aside>
    </>
  );
}
