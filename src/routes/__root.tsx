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
import {
  Zap,
  Settings as SettingsIcon,
  LogOut,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  Mic,
  User,
  Clock,
} from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase, supabaseConfigured, type SmartWattDevice } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// Cypher Global Integration imports
import { SessionProvider, useSessionContext } from "@/cypher/context/SessionContext";
import { useCypher } from "@/cypher/hooks/useCypher";
import { CypherFloatingButton } from "@/cypher/components/CypherFloatingButton";
import { CypherDrawer } from "@/cypher/components/CypherDrawer";
import { registerPWA } from "@/lib/pwa-register";
import { InstallPwaButton } from "@/components/install-pwa";

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
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
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

// ------------------------------------------------------------------
// CINEMATIC GLOBAL BACKGROUND WITH HIGH-FIDELITY RADIAL GLOWS & CUSTOM LIGHTWEIGHT CSS PARTICLES
// ------------------------------------------------------------------
interface BackgroundSystemProps {
  intensity: "full" | "quiet";
}

function BackgroundSystem({ intensity }: BackgroundSystemProps) {
  const isFull = intensity === "full";

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-[#050914] select-none pointer-events-none">
      {/* Deep Space Grid */}
      <div
        className="absolute inset-0 opacity-[0.03] transition-opacity duration-1000"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Large Glowing Blue and Indigo Nebulae */}
      <div className="absolute inset-0 transition-all duration-1000">
        <div
          className="absolute -top-[20%] -left-[10%] h-[80%] w-[60%] rounded-full mix-blend-screen filter blur-[120px] opacity-[0.22]"
          style={{
            background: "radial-gradient(circle, oklch(0.62 0.19 256) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-[40%] -right-[15%] h-[90%] w-[70%] rounded-full mix-blend-screen filter blur-[140px] opacity-[0.18]"
          style={{
            background: "radial-gradient(circle, oklch(0.68 0.22 254) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-[20%] left-[20%] h-[70%] w-[65%] rounded-full mix-blend-screen filter blur-[130px] opacity-[0.15]"
          style={{
            background: "radial-gradient(circle, oklch(0.72 0.18 144 / 40%) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Elegant Breathing Glow Core Behind Cards */}
      {isFull && (
        <motion.div
          animate={{
            opacity: [0.12, 0.25, 0.12],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[30%] left-[30%] h-[50%] w-[50%] -translate-x-1/2 -translate-y-1/2 rounded-full filter blur-[150px]"
          style={{
            background: "radial-gradient(circle, oklch(0.62 0.19 256 / 40%) 0%, transparent 80%)",
          }}
        />
      )}

      {/* Lightweight Floating Particles (CSS Animation to preserve CPU & Battery) */}
      {isFull && (
        <div className="absolute inset-0">
          <div className="absolute top-[15%] left-[25%] h-1 w-1 rounded-full bg-primary/40 animate-particle" />
          <div
            className="absolute top-[45%] left-[65%] h-1.5 w-1.5 rounded-full bg-primary/30 animate-particle"
            style={{ animationDelay: "2s", animationDuration: "14s" }}
          />
          <div
            className="absolute top-[75%] left-[15%] h-1 w-1 rounded-full bg-success/30 animate-particle"
            style={{ animationDelay: "4s", animationDuration: "10s" }}
          />
          <div
            className="absolute top-[30%] left-[85%] h-2 w-2 rounded-full bg-primary/20 animate-particle"
            style={{ animationDelay: "1s", animationDuration: "16s" }}
          />
          <div
            className="absolute top-[80%] left-[75%] h-1 w-1 rounded-full bg-warning/30 animate-particle"
            style={{ animationDelay: "5s", animationDuration: "11s" }}
          />
        </div>
      )}
    </div>
  );
}

function TopBar({
  isAuthenticated,
  deviceOnline,
  realtimeOk,
  lastUpdated,
  cypherState,
  onOpenCypher,
}: {
  isAuthenticated: boolean;
  deviceOnline: boolean;
  realtimeOk: boolean;
  lastUpdated: string;
  cypherState: string;
  onOpenCypher: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.04] bg-[#050914]/40 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-[0_0_15px_oklch(0.62_0.19_256_/_20%)]">
            <Zap className="h-4.5 w-4.5" strokeWidth={2.5} />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-sm font-bold tracking-[0.15em] text-foreground">
              SMART WATT
            </span>
            <span className="block text-[9px] uppercase tracking-[0.25em] text-muted-foreground/80">
              NoskyTech OS
            </span>
          </span>
        </Link>

        {isAuthenticated && (
          <div className="hidden items-center gap-4 md:flex">
            {/* Cloud Status */}
            <span
              className={cn(
                "status-pill",
                realtimeOk ? "status-pill-online" : "status-pill-offline",
              )}
            >
              {realtimeOk ? (
                <>
                  <Cloud className="h-3 w-3 animate-pulse" />
                  Cloud Realtime
                </>
              ) : (
                <>
                  <CloudOff className="h-3 w-3" />
                  Cloud Polling
                </>
              )}
            </span>

            {/* Device Online */}
            <span
              className={cn(
                "status-pill",
                deviceOnline ? "status-pill-online" : "status-pill-offline",
              )}
            >
              {deviceOnline ? (
                <>
                  <Wifi className="h-3 w-3" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                  Device Active
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  Device Offline
                </>
              )}
            </span>

            {/* Last Updated */}
            {lastUpdated && (
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                <Clock className="h-3 w-3" />
                Updated {lastUpdated}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <nav className="mr-2 hidden items-center gap-1 sm:flex">
              <NavLink to="/" icon={<Zap className="h-4 w-4" />}>
                Dashboard
              </NavLink>
              <NavLink to="/settings" icon={<SettingsIcon className="h-4 w-4" />}>
                Settings
              </NavLink>
            </nav>
          )}

          {isAuthenticated && (
            <button
              onClick={onOpenCypher}
              className={cn(
                "relative flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] px-3.5 text-xs font-semibold backdrop-blur-md transition-all hover:bg-white/[0.04]",
                cypherState === "listening" && "border-primary/50 text-primary glow-primary",
              )}
            >
              <Mic className={cn("h-3.5 w-3.5", cypherState === "listening" && "animate-pulse")} />
              <span className="hidden sm:inline">
                {cypherState === "listening" ? "Listening" : "Ask Cypher"}
              </span>
            </button>
          )}

          {isAuthenticated && (
            <div className="hidden sm:block">
              <InstallPwaButton variant="compact" label="Install" />
            </div>
          )}

          {isAuthenticated && (
            <button
              onClick={() => supabase.auth.signOut()}
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
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
        "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
        active
          ? "bg-primary/10 text-primary border border-primary/10 shadow-[0_0_15px_oklch(0.62_0.19_256_/_10%)]"
          : "text-muted-foreground border border-transparent hover:text-foreground",
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
    { to: "/", label: "Dashboard", icon: Zap },
    { to: "/settings", label: "Settings", icon: SettingsIcon },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.04] bg-[#050914]/85 backdrop-blur-2xl sm:hidden">
      <div className="mx-auto grid max-w-md grid-cols-2 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {items.map((it) => {
          const active = it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-bold uppercase tracking-wider transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-xl transition-all",
                  active ? "bg-primary/10 border border-primary/15" : "",
                )}
              >
                <it.icon
                  className="h-4 w-4"
                  style={{ height: "1rem", width: "1rem" }}
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
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RootInner />
      </SessionProvider>
    </QueryClientProvider>
  );
}

function RootInner() {
  const [splashDone, setSplashDone] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const sessionCtx = useSessionContext();

  useEffect(() => {
    registerPWA();
  }, []);

  // Allow other routes (e.g. /ecosystem) to open the Cypher drawer via event
  useEffect(() => {
    const handler = () => setIsDrawerOpen(true);
    window.addEventListener("nosky:openCypher", handler);
    return () => window.removeEventListener("nosky:openCypher", handler);
  }, []);

  // Initialize unified global Cypher brain hook
  const cypher = useCypher();

  // Onboarding routes: /welcome, /verify-product, /sign-in
  const isOnboardingRoute = ["/welcome", "/verify-product", "/sign-in"].includes(pathname);
  // Ecosystem route: /ecosystem
  const isEcosystemRoute = pathname === "/ecosystem";

  // Configure Background Intensity depending on routes
  const backgroundIntensity = pathname === "/" ? "full" : "quiet";

  const formattedLastUpdated = sessionCtx.lastUpdated
    ? new Date(sessionCtx.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  // Immersive layout for onboarding screens
  if (isOnboardingRoute) {
    return (
      <>
        <AnimatePresence>
          {!splashDone && <Splash key="splash" onComplete={() => setSplashDone(true)} />}
        </AnimatePresence>

        {/* Global Background System with quiet/subtle look */}
        <BackgroundSystem intensity="quiet" />

        <div className="flex min-h-screen flex-col justify-between">
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
            <Outlet />
          </main>
        </div>
      </>
    );
  }

  // Layout for authenticated ecosystem dashboard page
  if (isEcosystemRoute) {
    return (
      <>
        <AnimatePresence>
          {!splashDone && <Splash key="splash" onComplete={() => setSplashDone(true)} />}
        </AnimatePresence>

        <BackgroundSystem intensity="quiet" />

        <div className="flex min-h-screen flex-col">
          <main className="w-full flex-1">
            <Outlet />
          </main>
        </div>
      </>
    );
  }

  // DashboardLayout (existing dashboard route structure at / or /settings)
  return (
    <>
      <AnimatePresence>
        {!splashDone && <Splash key="splash" onComplete={() => setSplashDone(true)} />}
      </AnimatePresence>

      {/* Global Background System */}
      <BackgroundSystem intensity={backgroundIntensity} />

      <div className="flex min-h-screen flex-col">
        <TopBar
          isAuthenticated={sessionCtx.isAuthenticated}
          deviceOnline={sessionCtx.deviceOnline}
          realtimeOk={sessionCtx.realtimeConnected}
          lastUpdated={formattedLastUpdated}
          cypherState={cypher.state}
          onOpenCypher={() => setIsDrawerOpen(true)}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pb-10">
          <Outlet />
        </main>
        <BottomNav isAuthenticated={sessionCtx.isAuthenticated} />
      </div>

      {/* Global Cypher Assistant components */}
      <CypherFloatingButton cypher={cypher} onClick={() => setIsDrawerOpen(true)} />
      <CypherDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} cypher={cypher} />
    </>
  );
}
export default RootComponent;
