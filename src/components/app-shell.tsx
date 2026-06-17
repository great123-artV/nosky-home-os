import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Menu,
  X,
  Search,
  Bell,
  Sparkles,
  Home,
  ChevronRight,
  Plus,
} from "lucide-react";

import { navItems } from "./nav-data";
import { cn } from "@/lib/utils";

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 px-1">
      <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-primary)] shadow-glow">
        <Home className="h-5 w-5 text-primary-foreground" strokeWidth={2.4} />
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-sidebar" />
      </span>
      {!collapsed && (
        <span className="min-w-0">
          <span className="block truncate font-display text-base font-bold leading-tight text-foreground">
            Nosky HomeOS
          </span>
          <span className="block truncate text-[11px] text-muted-foreground">
            Smart Living. Seamlessly Connected.
          </span>
        </span>
      )}
    </Link>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-[image:var(--gradient-surface)] text-foreground shadow-soft"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-active"
                className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <item.icon
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-colors",
                active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
              )}
            />
            <span className="flex-1 truncate">{item.title}</span>
            {item.badge ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="pt-1">
        <Brand />
      </div>

      <div className="px-1">
        <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Control Center
        </p>
        <NavList onNavigate={onNavigate} />
      </div>

      <div className="mt-auto">
        <div className="glass relative overflow-hidden rounded-2xl p-4">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/30 blur-2xl" />
          <Sparkles className="h-5 w-5 text-primary" />
          <p className="mt-2 text-sm font-semibold text-foreground">Nosky AI Scenes</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Let HomeOS optimize comfort & energy automatically.
          </p>
          <button className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[image:var(--gradient-primary)] px-3 py-2 text-xs font-semibold text-primary-foreground transition-transform hover:scale-[1.02]">
            <Plus className="h-3.5 w-3.5" /> New Automation
          </button>
        </div>
        <p className="mt-4 px-2 text-center text-[11px] text-muted-foreground">
          Powered by <span className="font-semibold text-foreground/80">Nosky Tech</span>
        </p>
      </div>
    </div>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = navItems.find((n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)));

  return (
    <header className="sticky top-0 z-30 glass-strong">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onMenu}
          className="grid h-10 w-10 place-items-center rounded-xl border border-border text-foreground transition-colors hover:bg-accent lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden min-w-0 items-center gap-1.5 text-sm text-muted-foreground sm:flex">
          <Home className="h-4 w-4" />
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate font-medium text-foreground">{current?.title ?? "Dashboard"}</span>
        </div>

        <div className="relative ml-auto hidden max-w-xs flex-1 items-center md:flex">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search devices, rooms, scenes…"
            className="h-10 w-full rounded-xl border border-border bg-background/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <span className="hidden items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-medium text-success sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-success" />
            All systems online
          </span>
          <Link
            to="/notifications"
            className="relative grid h-10 w-10 place-items-center rounded-xl border border-border text-foreground transition-colors hover:bg-accent"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          </Link>
          <Link to="/settings" className="flex items-center gap-2.5 rounded-xl border border-border py-1 pl-1 pr-3 transition-colors hover:bg-accent">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--gradient-primary)] text-xs font-bold text-primary-foreground">
              AR
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-xs font-semibold text-foreground">Alex Rivera</span>
              <span className="block text-[11px] text-muted-foreground">Owner</span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-sidebar-border bg-sidebar/60 backdrop-blur-xl lg:block">
        <SidebarInner />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-sidebar-border bg-sidebar lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 grid h-9 w-9 place-items-center rounded-lg border border-border text-foreground"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarInner onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto w-full max-w-7xl"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
