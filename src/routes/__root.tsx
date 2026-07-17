import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Zap, Settings as SettingsIcon, LogOut } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// Cypher Global Integration imports
import { useCypher } from "@/cypher/hooks/useCypher";
import { CypherFloatingButton } from "@/cypher/components/CypherFloatingButton";
import { CypherDrawer } from "@/cypher/components/CypherDrawer";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to SMART WATT
          </Link>
        </div>
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try refreshing or head back home.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "SMART WATT — Powered by NoskyTech" },
      {
        name: "description",
        content:
          "SMART WATT is a premium connected device-control platform by NoskyTech — secure remote ON/OFF for your connected bulb, with Cypher voice control.",
      },
      { name: "author", content: "NoskyTech" },
      { name: "theme-color", content: "#07101F" },
      { property: "og:title", content: "SMART WATT — Powered by NoskyTech" },
      {
        property: "og:description",
        content: "A premium connected device-control platform by NoskyTech.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "SMART WATT — Powered by NoskyTech" },
      {
        name: "twitter:description",
        content: "A premium connected device-control platform by NoskyTech.",
      },
    ],
    links: [
      { rel: "preload", href: "/tesla-splash.webp", as: "image", type: "image/webp" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
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
    <html lang="en" className="dark">
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

// ------------------------------------------------------------------
// PREMIUM TESLA-INSPIRED SPLASH SCREEN WITH HIGH-END GLOW EFFECTS
// ------------------------------------------------------------------
interface SplashProps {
  onComplete: () => void;
}

function Splash({ onComplete }: SplashProps) {
  const [progress, setProgress] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    const duration = 6000; // 6.0 seconds to fill the bar
    const step = 20; // update every 20ms
    const increment = 100 / (duration / step);
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(interval);
          setIsFinishing(true);
          return 100;
        }
        return next;
      });
    }, step);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isFinishing) {
      const t = setTimeout(() => {
        onComplete();
      }, 400); // 0.4s fade-out, completing the total splash duration (6.0s progress + 0.4s fade)
      return () => clearTimeout(t);
    }
  }, [isFinishing, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#050101] overflow-hidden select-none"
    >
      {/* 1. Ambient Breathing Neon Red/Orange Glow behind the Image */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{
            opacity: [0.4, 0.8, 0.4],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-full h-full"
          style={{
            background:
              "radial-gradient(circle 600px at 50% 50%, rgba(220, 38, 38, 0.15), rgba(249, 115, 22, 0.05) 50%, transparent 80%)",
          }}
        />
      </div>

      {/* 2. Main Full-screen Cover Image */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src="/tesla-splash.webp"
          alt="Tesla Splash Screen"
          className="w-full h-full object-cover select-none pointer-events-none"
        />
        {/* Soft dark vignette on the image edge to make full-screen look incredibly polished */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60 pointer-events-none" />
      </div>

      {/* 3. Foreground Glow overlay on top of the image to make it pop */}
      <div className="absolute inset-0 pointer-events-none mix-blend-screen">
        <motion.div
          animate={{
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-full h-full"
          style={{
            background:
              "radial-gradient(circle 350px at 50% 50%, rgba(249, 115, 22, 0.25), transparent 70%)",
          }}
        />
      </div>

      {/* Sleeker, Ultra-minimalist Loading bar & Counter */}
      <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-full max-w-[240px] px-4 flex flex-col items-center pointer-events-none z-10">
        {/* Glass-like Ultra-sleek Loading Bar Container (Height 3px) */}
        <div className="relative w-full h-[3px] rounded-full bg-white/[0.04] border border-white/[0.05] overflow-hidden backdrop-blur-sm">
          {/* Neon orange-to-red gradient progress fill with outer glow */}
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-600 via-red-500 to-amber-500 rounded-full shadow-[0_0_10px_#f97316]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Minimal percentage counter - matching neon color scheme */}
        <div className="mt-3 font-display text-[10px] font-bold tracking-[0.2em] text-orange-500/90 filter drop-shadow-[0_0_4px_rgba(249,115,22,0.4)]">
          {Math.round(progress)}%
        </div>
      </div>
    </motion.div>
  );
}

function TopBar({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#07101F]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
            <Zap className="h-4 w-4" strokeWidth={2.4} />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-sm font-bold tracking-widest text-foreground">
              SMART WATT
            </span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Powered by NoskyTech
            </span>
          </span>
        </Link>
        {isAuthenticated && (
          <nav className="ml-auto hidden items-center gap-1 sm:flex">
            <NavLink to="/" icon={<Zap className="h-4 w-4" />}>
              Control
            </NavLink>
            <NavLink to="/settings" icon={<SettingsIcon className="h-4 w-4" />}>
              Settings
            </NavLink>
          </nav>
        )}
        {isAuthenticated && (
          <button
            onClick={() => supabase.auth.signOut()}
            className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground sm:ml-0"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
}

function NavLink({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

// Bottom navigation on mobile devices
function BottomNav({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (!isAuthenticated) return null;

  const items = [
    { to: "/", label: "Control", icon: Zap },
    { to: "/settings", label: "Settings", icon: SettingsIcon },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-[#07101F]/90 backdrop-blur-xl sm:hidden">
      <div className="mx-auto grid max-w-md grid-cols-2 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {items.map((it) => {
          const active = it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-lg transition",
                  active ? "bg-primary/15" : "",
                )}
              >
                <it.icon
                  className="h-4.5 w-4.5"
                  style={{ height: "1.125rem", width: "1.125rem" }}
                />
              </span>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [splashDone, setSplashDone] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Auth State listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const isAuthenticated = !!session;

  // Initialize unified global Cypher brain hook
  const cypher = useCypher(isAuthenticated);

  return (
    <QueryClientProvider client={queryClient}>
      <AnimatePresence>
        {!splashDone && <Splash key="splash" onComplete={() => setSplashDone(true)} />}
      </AnimatePresence>
      <div className="flex min-h-screen flex-col">
        <TopBar isAuthenticated={isAuthenticated} />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pb-10">
          <Outlet />
        </main>
        <BottomNav isAuthenticated={isAuthenticated} />
      </div>

      {/* Global Cypher Assistant components */}
      <CypherFloatingButton cypher={cypher} onClick={() => setIsDrawerOpen(true)} />
      <CypherDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} cypher={cypher} />
    </QueryClientProvider>
  );
}
