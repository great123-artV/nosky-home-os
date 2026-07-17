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
// PREMIUM SPLASH SCREEN COMPONENT WITH HIGH-END GLOW EFFECTS
// ------------------------------------------------------------------
interface SplashProps {
  onComplete: () => void;
}

function Splash({ onComplete }: SplashProps) {
  const [progress, setProgress] = useState(1);
  const progressRef = useRef(1);
  const [msg, setMsg] = useState("Initializing Smart Watt...");
  const [isFinishing, setIsFinishing] = useState(false);

  // Use refs to store startup state and avoid re-triggering the timer effect
  const startTimeRef = useRef(Date.now());
  const authFinishedRef = useRef(false);

  // Particle generator for the loading bar and cloud
  const [loadingParticles, setLoadingParticles] = useState<
    { id: number; left: number; delay: number }[]
  >([]);
  const [sparkParticles, setSparkParticles] = useState<
    { id: number; top: number; left: number; delay: number; scale: number }[]
  >([]);

  // Monitor Supabase configuration and authentication resolving
  useEffect(() => {
    if (supabaseConfigured) {
      supabase.auth
        .getSession()
        .then(() => {
          authFinishedRef.current = true;
        })
        .catch(() => {
          authFinishedRef.current = true;
        });
    } else {
      authFinishedRef.current = true;
    }
  }, []);

  // Generate background/decorations once
  useEffect(() => {
    // Generate particles traveling inside loading bar
    const particles = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setLoadingParticles(particles);

    // Generate small spark particles around cloud / connection path
    const sparks = Array.from({ length: 10 }).map((_, i) => ({
      id: i,
      top: 32 + Math.random() * 10, // near cloud
      left: 45 + Math.random() * 10, // near cloud
      delay: Math.random() * 3,
      scale: 0.4 + Math.random() * 0.6,
    }));
    setSparkParticles(sparks);
  }, []);

  // Smooth loading timing loop (runs once, reads from refs)
  useEffect(() => {
    const minDuration = 2800; // ~2.8 seconds target minimum

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const timePercent = Math.min(elapsed / minDuration, 1);
      const isAuthFinished = authFinishedRef.current;

      setProgress((prev) => {
        let next = prev;
        if (prev >= 90) {
          // If we reached ~90%, we only proceed to 100% if authFinished is true and we've met the minDuration
          if (isAuthFinished && elapsed >= minDuration) {
            if (prev >= 100) {
              clearInterval(interval);
              setIsFinishing(true);
              next = 100;
            } else {
              // Rapid finish to 100
              next = Math.min(prev + 2, 100);
            }
          } else {
            // Keep subtle breathing active state around 90-95%
            next = prev + (95 - prev) * 0.05;
          }
        } else {
          // Smooth acceleration to 90%
          const target = timePercent * 90;
          next = prev + (target - prev) * 0.15;
        }
        progressRef.current = next;
        return next;
      });

      // Update initialization status message naturally mapped to events
      if (elapsed < 600) {
        setMsg("Initializing Smart Watt...");
      } else if (elapsed < 1200) {
        setMsg("Connecting...");
      } else if (elapsed < 2000) {
        setMsg("Checking session...");
      } else if (progressRef.current >= 90 && !isAuthFinished) {
        setMsg("Preparing dashboard...");
      } else if (progressRef.current >= 95) {
        setMsg("Almost ready...");
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Handle final completion phase transitions
  useEffect(() => {
    if (isFinishing) {
      const t = setTimeout(() => {
        onComplete();
      }, 800); // Allow brief intensification and transition before disappearing
      return () => clearTimeout(t);
    }
  }, [isFinishing, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#07101F] overflow-hidden select-none"
    >
      {/* 1. Ambient Glow behind the Image (Centered, soft, electric blue, radial, low opacity, breathing) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle 500px at 50% 50%, rgba(59, 130, 246, 0.12), transparent 70%)",
        }}
      >
        <motion.div
          animate={{
            opacity: [0.6, 1, 0.6],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-full h-full"
          style={{
            background:
              "radial-gradient(circle 400px at 50% 50%, rgba(59, 130, 246, 0.08), transparent 60%)",
          }}
        />
      </div>

      {/* Main Container: Scales to 100% viewport height and centers itself on laptops, adapts safely to phone viewports */}
      <div className="relative h-[100dvh] max-h-[100dvh] max-w-full aspect-[941/1672] flex items-center justify-center overflow-hidden">
        {/* Main Artwork - 100% height, contained aspect ratio */}
        <img
          src="/splash-artwork.png"
          alt="SMART WATT Official Splash Screen"
          className="w-full h-full object-contain select-none pointer-events-none"
        />

        {/* OVERLAY ELEMENTS (Using analyzed precise percentages for coordinates) */}

        {/* A. Cloud Icon Overlay (Center: 49.95%, 36.51% | Soft breathing blue glow, spark particles, subtle electric pulse) */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: "49.95%",
            top: "36.51%",
            width: "48.67%",
            height: "7.00%",
            transform: "translate(-50%, -50%)",
          }}
        >
            {/* Ambient Breathing Blue Glow */}
            <motion.div
              animate={{
                opacity: [0.3, 0.75, 0.3],
                scale: [0.95, 1.05, 0.95],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full bg-blue-500/15 blur-xl"
            />

            {/* Subtle Electric Pulse */}
            <motion.div
              animate={{
                opacity: [0.1, 0.4, 0.1],
                scale: [0.9, 1.1, 0.9],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full border border-blue-400/20 blur-md"
            />
          </div>

          {/* Tiny spark particles around Cloud area */}
          {sparkParticles.map((spark) => (
            <motion.div
              key={spark.id}
              className="absolute w-1 h-1 rounded-full bg-blue-300"
              style={{
                top: `${spark.top}%`,
                left: `${spark.left}%`,
              }}
              animate={{
                y: [0, -12, 0],
                opacity: [0, 0.8, 0],
                scale: [0, spark.scale, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: spark.delay,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* B. Blue Connection Lines (Center: 52%, 51.7% | Slow energy flow & soft bloom with premium feathering masks) */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: "52.05%",
              top: "51.68%",
              width: "90%",
              height: "25%",
              transform: "translate(-50%, -50%)",
              WebkitMaskImage:
                "radial-gradient(ellipse at center, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)",
              maskImage:
                "radial-gradient(ellipse at center, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)",
            }}
          >
            {/* Soft Bloom Glow behind lines */}
            <motion.div
              animate={{
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-blue-400/10 to-blue-500/5 blur-2xl"
            />

            {/* Energy traveling light overlay (subtle animated line overlay) */}
            <div className="absolute inset-0 overflow-hidden opacity-30">
              <motion.div
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="w-1/3 h-full bg-gradient-to-r from-transparent via-blue-400 to-transparent blur-md"
              />
            </div>
          </div>

          {/* C. Bulb Warm Amber Glow (Center: 69.89%, 57.25% | Realistic illumination around glass/filament, breathing, no flicker) */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: "69.89%",
              top: "57.25%",
              width: "16%",
              height: "10%",
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Core Filament Amber light */}
            <motion.div
              animate={{
                opacity: [0.65, 0.85, 0.65],
                scale: [0.98, 1.02, 0.98],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full bg-amber-500/25 blur-md"
            />

            {/* Soft Outer Bloom */}
            <motion.div
              animate={{
                opacity: [0.3, 0.5, 0.3],
                scale: [0.95, 1.05, 0.95],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -inset-4 rounded-full bg-amber-600/15 blur-xl"
            />
          </div>

          {/* D. Smart Watt Device Base / LED (Center: 49.95%, 83.64%, Status LED Center: 48.46%, 96.83%) */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: "48.46%",
              top: "96.83%",
              width: "10px",
              height: "10px",
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Tiny Blue Status LED Pulse */}
            <motion.div
              animate={{
                opacity: [0.4, 1, 0.4],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full bg-blue-400"
            />
            {/* Gentle Outer Glow */}
            <motion.div
              animate={{
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -inset-2 rounded-full bg-blue-400/45 blur-xs"
            />
          </div>

          {/* LOADING EXPERIENCE (Floating elegantly on top of the image artwork at bottom area ~14% from bottom) */}
          <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 w-full max-w-[280px] px-4 flex flex-col items-center pointer-events-none">
            {/* Glass-like Loading Bar Container */}
            <div className="relative w-full h-[6px] rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md overflow-hidden shadow-inner">
              {/* Electric Blue Gradient Progress Fill with Outer Glow */}
              <motion.div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-500 rounded-full"
                style={{ width: `${progress}%` }}
                animate={
                  isFinishing
                    ? {
                        boxShadow: ["0 0 4px #3b82f6", "0 0 12px #06b6d4", "0 0 4px #3b82f6"],
                      }
                    : {}
                }
                transition={{ duration: 0.8 }}
              />

              {/* Tiny traveling particles inside the loading bar */}
              {progress < 100 &&
                loadingParticles.map((pt) => (
                  <motion.div
                    key={pt.id}
                    className="absolute top-0 w-[2px] h-full bg-blue-100/60 rounded-full"
                    style={{ left: `${pt.left}%` }}
                    animate={{
                      x: ["0px", "120px"],
                      opacity: [0, 0.8, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: pt.delay,
                      ease: "linear",
                    }}
                  />
                ))}

              {/* Soft outer glow & subtle reflection overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.1] to-transparent pointer-events-none" />
            </div>

            {/* Gently pulsing loading glow indicator */}
            <motion.div
              animate={{
                opacity: isFinishing ? [0.4, 0.9, 0.4] : [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-full h-[1px] bg-cyan-400/40 blur-xs mt-0.5"
            />

            {/* Numeric loading counter - smoothly incrementing 1 to 100 */}
            <div className="mt-3 font-display text-xs font-semibold tracking-wider text-cyan-400/80">
              {Math.round(progress)}%
            </div>

            {/* INITIALIZATION STATUS: Minimal, cleanly faded message cycle */}
            <div className="h-6 mt-2 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={msg}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 0.7, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase text-center"
                >
                  {msg}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>
    </motion.div>
  );
}

function TopBar() {
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
        <nav className="ml-auto hidden items-center gap-1 sm:flex">
          <NavLink to="/" icon={<Zap className="h-4 w-4" />}>
            Control
          </NavLink>
          <NavLink to="/settings" icon={<SettingsIcon className="h-4 w-4" />}>
            Settings
          </NavLink>
        </nav>
        <button
          onClick={() => supabase.auth.signOut()}
          className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground sm:ml-0"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
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
function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
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

  return (
    <QueryClientProvider client={queryClient}>
      <AnimatePresence>
        {!splashDone && <Splash key="splash" onComplete={() => setSplashDone(true)} />}
      </AnimatePresence>
      <div className="flex min-h-screen flex-col">
        <TopBar />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pb-10">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </QueryClientProvider>
  );
}
