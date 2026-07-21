import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Mail,
  ArrowRight,
  PlusCircle,
  Bell,
  Settings as SettingsIcon,
  User,
  Home as HomeIcon,
  DoorOpen,
  Wifi,
  Package,
  Zap,
  Battery,
  Lock,
  Radar,
  Lightbulb,
  Sparkles,
  Bot,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  PackageOpen,
  X,
} from "lucide-react";
import { useSessionContext } from "@/cypher/context/SessionContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/ecosystem")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ecosystem — NOSKY SMART" },
      {
        name: "description",
        content:
          "Your Nosky Smart ecosystem dashboard — manage every NoskyTech product from one intelligent account.",
      },
    ],
  }),
  component: EcosystemScreen,
});

// ---------- Types ----------
type OwnedProduct = {
  id: string;
  product_uid: string;
  product_type: string | null;
  model: string | null;
  name: string | null;
  online: boolean | null;
  claimed_at: string | null;
};

type Home = {
  id: string;
  name: string;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
};

type ClaimNotice = {
  kind: "success" | "error";
  message: string;
} | null;

// ---------- Product Type → Icon / Route ----------
function productIcon(type: string | null | undefined) {
  const t = (type ?? "").toLowerCase();
  if (t.includes("watt") || t === "sw" || t.includes("plug")) return Zap;
  if (t.includes("power") || t.includes("bank")) return Battery;
  if (t.includes("secur") || t.includes("lock")) return Lock;
  if (t.includes("sensor")) return Radar;
  if (t.includes("light") || t.includes("bulb")) return Lightbulb;
  return Package;
}

function productRoute(type: string | null | undefined): "/" | null {
  const t = (type ?? "").toLowerCase();
  if (t.includes("watt") || t === "sw" || t.includes("plug")) return "/";
  return null;
}

// ---------- Screen ----------
function EcosystemScreen() {
  const sessionCtx = useSessionContext();
  const navigate = useNavigate();

  // Route protection
  useEffect(() => {
    if (sessionCtx.authStatus === "unauthenticated" || sessionCtx.authStatus === "expired") {
      navigate({ to: "/welcome" });
    }
  }, [sessionCtx.authStatus, navigate]);

  const [products, setProducts] = useState<OwnedProduct[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [claimNotice, setClaimNotice] = useState<ClaimNotice>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  // Homes and Create Home States
  const [homes, setHomes] = useState<Home[] | null>(null);
  const [checkingHomes, setCheckingHomes] = useState(true);

  const [homeName, setHomeName] = useState("");
  const [homeType, setHomeType] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [creatingHome, setCreatingHome] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const userEmail = sessionCtx.user?.email || "";
  const userMeta = sessionCtx.user?.user_metadata ?? {};
  const displayName: string = userMeta.full_name || userMeta.name || userMeta.nosky_id || "";
  const noskyId: string = userMeta.nosky_id || userEmail.split("@")[0] || "";

  // ---------- Load homes ----------
  const loadHomes = useCallback(async () => {
    if (!sessionCtx.user?.id) return;
    setCheckingHomes(true);
    try {
      const { data, error } = await supabase
        .from("homes")
        .select("id, name, owner_id, created_at, updated_at")
        .eq("owner_id", sessionCtx.user.id);

      if (error) throw error;
      setHomes(data || []);
    } catch (err) {
      console.error("[ecosystem] loadHomes error", err);
      setHomes([]);
    } finally {
      setCheckingHomes(false);
    }
  }, [sessionCtx.user?.id]);

  // ---------- Create home handler ----------
  const handleCreateHome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeName.trim() || !sessionCtx.user?.id) return;

    setCreatingHome(true);
    setCreateError(null);
    try {
      const { data, error } = await supabase
        .from("homes")
        .insert({
          name: homeName.trim(),
          owner_id: sessionCtx.user.id,
        })
        .select();

      if (error) throw error;

      toast.success("Welcome to your first Nosky Home.");

      if (data && data.length > 0) {
        setHomes(data);
      } else {
        await loadHomes();
      }
    } catch (err) {
      console.error("[ecosystem] create home error", err);
      const msg = err instanceof Error ? err.message : String(err);
      setCreateError(msg || "Could not create Home. Please try again.");
    } finally {
      setCreatingHome(false);
    }
  };

  // ---------- Load owned products ----------
  const loadProducts = useCallback(async () => {
    if (!sessionCtx.user?.id) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      // Attempt a joined read first
      const joined = await supabase
        .from("user_products")
        .select(
          `id, claimed_at, products:product_id (id, product_uid, product_type, model, name, online)`,
        )
        .eq("user_id", sessionCtx.user.id)
        .order("claimed_at", { ascending: false });

      if (!joined.error && Array.isArray(joined.data)) {
        const mapped: OwnedProduct[] = joined.data.flatMap((row) => {
          const p = (row as Record<string, unknown>).products as {
            id?: string;
            product_uid?: string;
            product_type?: string | null;
            model?: string | null;
            name?: string | null;
            online?: boolean | null;
          } | null;
          if (!p) return [];
          return [
            {
              id: p.id ?? row.id,
              product_uid: p.product_uid ?? "",
              product_type: p.product_type ?? null,
              model: p.model ?? null,
              name: p.name ?? null,
              online: p.online ?? null,
              claimed_at: row.claimed_at ?? null,
            },
          ];
        });
        setProducts(mapped);
        setLoading(false);
        return;
      }

      // Fallback: direct products table with owner column
      const direct = await supabase
        .from("products")
        .select("id, product_uid, product_type, model, name, online, claimed_at, owner_id")
        .eq("owner_id", sessionCtx.user.id);

      if (!direct.error && Array.isArray(direct.data)) {
        setProducts(
          direct.data.map((p) => ({
            id: p.id,
            product_uid: p.product_uid ?? "",
            product_type: p.product_type ?? null,
            model: p.model ?? null,
            name: p.name ?? null,
            online: p.online ?? null,
            claimed_at: p.claimed_at ?? null,
          })),
        );
        setLoading(false);
        return;
      }

      // Neither shape available — treat as empty rather than error
      setProducts([]);
      setLoading(false);
    } catch (err) {
      console.error("[ecosystem] loadProducts error", err);
      setErrorMsg("We couldn’t load your products. Please try again.");
      setLoading(false);
    }
  }, [sessionCtx.user?.id]);

  useEffect(() => {
    if (sessionCtx.isAuthenticated) {
      loadHomes();
      loadProducts();
    }
  }, [sessionCtx.isAuthenticated, loadHomes, loadProducts]);

  // ---------- Pending onboarding claim ----------
  useEffect(() => {
    if (!sessionCtx.isAuthenticated) return;
    const raw = sessionStorage.getItem("nosky_onboarding");
    if (!raw) return;
    let payload: { onboardingToken?: string; productType?: string } | null = null;
    try {
      payload = JSON.parse(raw);
    } catch {
      sessionStorage.removeItem("nosky_onboarding");
      return;
    }
    if (!payload?.onboardingToken) {
      sessionStorage.removeItem("nosky_onboarding");
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase.rpc("claim_verified_product", {
          onboarding_token: payload.onboardingToken,
        });
        if (error) throw error;
        const result = Array.isArray(data) ? data[0] : data;
        if (result?.success) {
          setClaimNotice({
            kind: "success",
            message: `${result.product_type || payload?.productType || "Product"} added to your ecosystem.`,
          });
          sessionStorage.removeItem("nosky_onboarding");
          loadProducts();
        } else {
          setClaimNotice({
            kind: "error",
            message: result?.message || "Could not claim this product.",
          });
          sessionStorage.removeItem("nosky_onboarding");
        }
      } catch (err) {
        console.error("[ecosystem] claim error", err);
        setClaimNotice({
          kind: "error",
          message: "Could not claim this product.",
        });
        sessionStorage.removeItem("nosky_onboarding");
      }
    })();
  }, [sessionCtx.isAuthenticated, loadProducts]);

  // ---------- Close profile menu on outside click ----------
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileMenuOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/welcome" });
  };

  const handleOpenProduct = (p: OwnedProduct) => {
    const route = productRoute(p.product_type);
    if (route) navigate({ to: route });
    else
      setClaimNotice({
        kind: "error",
        message: `${p.product_type ?? "This product"} experience is coming soon.`,
      });
  };

  const openCypher = () => {
    try {
      window.dispatchEvent(new CustomEvent("nosky:openCypher"));
    } catch {
      /* noop */
    }
  };

  // Loading state
  if (sessionCtx.authStatus === "initializing" || checkingHomes) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <span className="h-8 w-8 animate-spin border-4 border-primary border-t-transparent rounded-full" />
        <p className="text-sm font-semibold text-muted-foreground/80 tracking-widest animate-pulse">
          Loading Ecosystem...
        </p>
      </div>
    );
  }

  if (!sessionCtx.isAuthenticated) return null;

  const hasZeroHomes = homes === null || homes.length === 0;

  if (hasZeroHomes) {
    return (
      <div className="relative z-10 mx-auto w-full max-w-lg px-4 py-8 sm:py-16">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px] bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-3xl" />

        {/* Ambient floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[12%] left-[25%] h-1 w-1 rounded-full bg-primary/40 animate-particle" />
          <div
            className="absolute top-[48%] left-[75%] h-1.5 w-1.5 rounded-full bg-primary/30 animate-particle"
            style={{ animationDelay: "2s", animationDuration: "14s" }}
          />
          <div
            className="absolute top-[78%] left-[20%] h-1 w-1 rounded-full bg-primary/35 animate-particle"
            style={{ animationDelay: "4s", animationDuration: "10s" }}
          />
          <div
            className="absolute top-[28%] left-[82%] h-1 w-1 rounded-full bg-primary/25 animate-particle"
            style={{ animationDelay: "1s", animationDuration: "16s" }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0A1220]/90 p-6 shadow-card backdrop-blur-xl sm:p-8"
        >
          {/* Inner card glow */}
          <div className="pointer-events-none absolute -inset-16 bg-gradient-to-br from-primary/10 via-transparent to-transparent blur-2xl" />

          <div className="relative text-center">
            {/* Outlined House Schematic */}
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/25 bg-gradient-to-b from-primary/15 to-transparent text-primary shadow-[0_0_30px_rgba(59,130,246,0.15)]">
              <div className="absolute inset-0 rounded-3xl bg-primary/5 blur-xl animate-pulse" />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10 text-primary drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>

            <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Create your first Home
            </h1>
            <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
              Every NoskyTech product belongs to a Home.
              <br className="hidden sm:inline" /> Create one to begin building your automation
              ecosystem.
            </p>
          </div>

          <form onSubmit={handleCreateHome} className="relative mt-8 space-y-5">
            {/* Home Name field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                Home Name <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                required
                value={homeName}
                onChange={(e) => setHomeName(e.target.value)}
                placeholder="e.g. My Smart Home, Lakehouse, HQ Office"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 transition-all focus:border-primary/50 focus:bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>

            {/* Optional Home Type field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                Optional Home Type
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {["House", "Apartment", "Office", "Shop", "Hostel", "Factory", "Other"].map(
                  (type) => {
                    const selected = homeType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setHomeType(selected ? null : type)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]",
                          selected
                            ? "border-primary/30 bg-primary/15 text-primary shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                            : "border-white/[0.06] bg-white/[0.01] text-muted-foreground hover:border-white/[0.12] hover:text-foreground",
                        )}
                      >
                        {type}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            {/* Optional Location field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                Optional Location
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 transition-all focus:border-primary/50 focus:bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>

            {/* Error display */}
            {createError && (
              <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-2.5 text-center text-xs text-destructive">
                {createError}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={creatingHome || !homeName.trim()}
              className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-bold tracking-wide text-primary-foreground transition-all hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(59,130,246,0.35)] active:scale-[0.99] disabled:scale-100 disabled:opacity-50 disabled:shadow-none"
            >
              {creatingHome ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Creating Home...
                </>
              ) : (
                <>Create Home</>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const onlineCount = (products ?? []).filter((p) => p.online === true).length;

  return (
    <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px] bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-3xl" />

      {/* ============ HEADER ============ */}
      <header className="relative z-10 flex items-start justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="min-w-0"
        >
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_20px_rgba(59,130,246,0.25)]">
              <Sparkles className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                NoskyTech
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-display text-base font-extrabold tracking-tight text-foreground sm:text-lg">
                  NOSKY SMART
                </div>
                {homes && homes.length > 0 && (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 text-xs font-semibold text-foreground backdrop-blur-md">
                    <span>🏠</span>
                    <span className="truncate max-w-[120px]">{homes[0].name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Welcome back{displayName ? `, ${displayName}` : ""}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="flex items-center gap-2"
        >
          <IconChip label="Notifications" onClick={() => {}}>
            <Bell className="h-4 w-4" />
          </IconChip>
          <Link
            to="/settings"
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-muted-foreground transition-all hover:border-white/[0.16] hover:bg-white/[0.05] hover:text-foreground"
            aria-label="Settings"
          >
            <SettingsIcon className="h-4 w-4" />
          </Link>
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileMenuOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-all hover:bg-primary/20"
              aria-label="Profile"
            >
              <User className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0A1220]/95 shadow-card backdrop-blur-xl"
                >
                  <div className="border-b border-white/[0.06] p-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Nosky ID
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold text-foreground">
                      {noskyId || "—"}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 text-primary" />
                      <span className="truncate">{userEmail}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-destructive/90 transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </header>

      {/* ============ CLAIM NOTICE ============ */}
      <AnimatePresence>
        {claimNotice && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 mt-4"
          >
            <div
              className={cn(
                "flex items-start justify-between gap-3 rounded-2xl border p-3 text-sm",
                claimNotice.kind === "success"
                  ? "border-success/25 bg-success/5 text-success"
                  : "border-destructive/25 bg-destructive/5 text-destructive",
              )}
            >
              <div className="flex items-start gap-2">
                {claimNotice.kind === "success" ? (
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>{claimNotice.message}</span>
              </div>
              <button
                onClick={() => setClaimNotice(null)}
                className="rounded p-1 opacity-70 hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ SUMMARY CARD ============ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative z-10 mt-6 overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-card backdrop-blur-xl sm:p-6"
      >
        <div className="pointer-events-none absolute -inset-16 bg-gradient-to-br from-primary/12 via-transparent to-transparent blur-2xl" />
        <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <SummaryStat
            icon={Package}
            label="Products"
            value={loading ? null : (products?.length ?? 0)}
          />
          <SummaryStat
            icon={HomeIcon}
            label="Homes"
            value={checkingHomes ? null : (homes?.length ?? 0)}
          />
          <SummaryStat icon={DoorOpen} label="Rooms" value={loading ? null : 0} />
          <SummaryStat icon={Wifi} label="Online" value={loading ? null : onlineCount} accent />
        </div>
      </motion.section>

      {/* ============ QUICK ACTIONS ============ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="relative z-10 mt-6"
      >
        <SectionLabel>Quick Actions</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <QuickAction
            icon={PlusCircle}
            label="Add Product"
            onClick={() => navigate({ to: "/verify-product" })}
            primary
          />
          <QuickAction
            icon={HomeIcon}
            label="Create Home"
            onClick={() =>
              setClaimNotice({ kind: "error", message: "Homes are coming to Nosky Smart soon." })
            }
          />
          <QuickAction
            icon={DoorOpen}
            label="Create Room"
            onClick={() =>
              setClaimNotice({ kind: "error", message: "Rooms are coming to Nosky Smart soon." })
            }
          />
          <QuickAction icon={Bot} label="Talk to Cypher" onClick={openCypher} />
        </div>
      </motion.section>

      {/* ============ MY PRODUCTS ============ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 mt-8 pb-16"
      >
        <div className="flex items-center justify-between">
          <SectionLabel>My Products</SectionLabel>
          {!loading && products && products.length > 0 && (
            <button
              onClick={loadProducts}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          )}
        </div>

        <div className="mt-3">
          {loading && <ProductSkeletons />}

          {!loading && errorMsg && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
              <AlertCircle className="mx-auto h-6 w-6 text-destructive" />
              <p className="mt-2 text-sm text-destructive">{errorMsg}</p>
              <button
                onClick={loadProducts}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/20"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Try again
              </button>
            </div>
          )}

          {!loading && !errorMsg && products && products.length === 0 && (
            <EmptyState onAdd={() => navigate({ to: "/verify-product" })} />
          )}

          {!loading && !errorMsg && products && products.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onOpen={() => handleOpenProduct(p)} />
              ))}
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}

// ---------- Subcomponents ----------

function IconChip({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-muted-foreground transition-all hover:border-white/[0.16] hover:bg-white/[0.05] hover:text-foreground"
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
      {children}
    </h2>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | null;
  accent?: boolean;
}) {
  return (
    <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.015] p-3.5 sm:p-4">
      <div
        className={cn(
          "grid h-8 w-8 place-items-center rounded-lg border",
          accent
            ? "border-success/25 bg-success/10 text-success"
            : "border-primary/20 bg-primary/10 text-primary",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-extrabold text-foreground tabular-nums">
        {value === null ? (
          <span className="inline-block h-6 w-8 animate-pulse rounded bg-white/5" />
        ) : (
          value
        )}
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  primary,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.99]",
        primary
          ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 hover:shadow-[0_0_28px_rgba(59,130,246,0.25)]"
          : "border-white/[0.08] bg-white/[0.02] text-foreground hover:border-white/[0.16] hover:bg-white/[0.04]",
      )}
    >
      <div
        className={cn(
          "grid h-9 w-9 place-items-center rounded-xl border",
          primary
            ? "border-primary/30 bg-primary/15"
            : "border-white/[0.08] bg-white/[0.03] text-primary",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-xs font-bold tracking-wide">{label}</span>
    </button>
  );
}

function ProductCard({ product, onOpen }: { product: OwnedProduct; onOpen: () => void }) {
  const Icon = productIcon(product.product_type);
  const online = product.online === true;
  const displayName =
    product.name ||
    (product.product_type ? product.product_type.replace(/_/g, " ").toUpperCase() : "NOSKY DEVICE");
  const modelLabel = product.model || "—";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 shadow-card transition-all hover:border-primary/25 sm:p-5"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <StatusBadge online={online} />
      </div>

      <div className="relative mt-4">
        <div className="font-display text-base font-extrabold tracking-tight text-foreground">
          {displayName}
        </div>
        <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {modelLabel}
        </div>
        <div className="mt-2 truncate text-xs text-muted-foreground/80 font-mono">
          {product.product_uid}
        </div>
      </div>

      <button
        onClick={onOpen}
        className="relative mt-4 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-bold tracking-wide text-primary-foreground transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] active:scale-[0.99]"
      >
        Open <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </motion.div>
  );
}

function StatusBadge({ online }: { online: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
        online
          ? "border-success/30 bg-success/10 text-success"
          : "border-white/[0.08] bg-white/[0.03] text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          online ? "bg-success shadow-[0_0_8px_currentColor]" : "bg-muted-foreground/60",
        )}
      />
      {online ? "Online" : "Offline"}
    </span>
  );
}

function ProductSkeletons() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5"
        >
          <div className="flex items-start justify-between">
            <div className="h-11 w-11 rounded-xl bg-white/[0.04]" />
            <div className="h-5 w-16 rounded-full bg-white/[0.04]" />
          </div>
          <div className="mt-4 h-4 w-2/3 rounded bg-white/[0.04]" />
          <div className="mt-2 h-3 w-1/3 rounded bg-white/[0.04]" />
          <div className="mt-4 h-10 rounded-xl bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 text-center sm:p-12">
      <div className="pointer-events-none absolute -inset-16 bg-gradient-to-br from-primary/10 via-transparent to-transparent blur-2xl" />
      <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-[0_0_30px_rgba(59,130,246,0.25)]">
        <PackageOpen className="h-7 w-7" />
      </div>
      <h3 className="relative mt-5 font-display text-lg font-extrabold tracking-tight text-foreground">
        You haven’t added a NoskyTech product yet.
      </h3>
      <p className="relative mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Verify your first NoskyTech device to bring it into your Nosky Smart ecosystem.
      </p>
      <button
        onClick={onAdd}
        className="relative mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-xs font-bold tracking-wide text-primary-foreground transition-all hover:scale-[1.02] hover:shadow-[0_0_28px_rgba(59,130,246,0.35)] active:scale-[0.99]"
      >
        <PlusCircle className="h-4 w-4" /> Add Product
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
