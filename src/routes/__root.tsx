import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-nude px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow text-muted-foreground">Error 404</p>
        <h1 className="mt-4 font-serif text-5xl text-foreground">Page not found</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          The page you're looking for has moved or doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center bg-charcoal px-8 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold text-white hover:bg-charcoal/90 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-nude px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-3xl text-foreground">Something went wrong</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          We couldn't load this page. Try again or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="bg-charcoal px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold text-white"
          >
            Try again
          </button>
          <Link to="/" className="border border-charcoal/20 px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Royal Boutiques — Luxury Fashion. Timeless Elegance." },
      { name: "description", content: "Royal Boutiques is a premium destination for women's luxury fashion — dresses, shoes, bags, and the curated luxury collection." },
      { name: "author", content: "Royal Boutiques" },
      { property: "og:site_name", content: "Royal Boutiques" },
      { property: "og:title", content: "Royal Boutiques — Luxury Fashion. Timeless Elegance." },
      { property: "og:description", content: "Premium luxury fashion for the modern woman." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "/royal-logo.jpg" },
      { name: "twitter:image", content: "/royal-logo.jpg" },
      { name: "theme-color", content: "#FAF7F2" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", href: "/royal-monogram.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" toastOptions={{ style: { fontFamily: "Inter, sans-serif" } }} />
    </QueryClientProvider>
  );
}
