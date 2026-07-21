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
  Compass,
  Cpu,
  BookmarkCheck,
  Shield,
  Layers,
  CheckCircle,
} from "lucide-react";
import { useSessionContext } from "@/cypher/context/SessionContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// ---------- Search Param Validation ----------
type EcosystemSearch = {
  mode?: string;
};

export const Route = createFileRoute("/ecosystem")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): EcosystemSearch => {
    return {
      mode: typeof search.mode === "string" ? search.mode : undefined,
    };
  },
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

type ClaimNotice = {
  kind: "success" | "error";
  message: string;
} | null;

// ---------- Product Type → Icon ----------
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
  const search = Route.useSearch();

  // Mode status checks
  const isExploreMode = !sessionCtx.isAuthenticated && search.mode === "explore";

  // Route protection redirect
  useEffect(() => {
    if (sessionCtx.authStatus === "initializing") return;
    if (!sessionCtx.isAuthenticated && search.mode !== "explore") {
      navigate({ to: "/welcome" });
    }
  }, [sessionCtx.authStatus, sessionCtx.isAuthenticated, search.mode, navigate]);

  const [products, setProducts] = useState<OwnedProduct[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [claimNotice, setClaimNotice] = useState<ClaimNotice>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  // Home states (authenticated only)
  const [homes, setHomes] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nosky:homes");
      return saved ? JSON.parse(saved) : ["Main Residence"];
    }
    return ["Main Residence"];
  });

  const [showHomeModal, setShowHomeModal] = useState(false);
  const [newHomeName, setNewHomeName] = useState("");

  // Premium Unlock Modal state
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [activeCatalogueTab, setActiveCatalogueTab] = useState<"all" | "active" | "soon">("all");

  const catalogRef = useRef<HTMLDivElement | null>(null);

  const userEmail = sessionCtx.user?.email || "";
  const userMeta = sessionCtx.user?.user_metadata ?? {};
  const displayName: string = userMeta.full_name || userMeta.name || userMeta.nosky_id || "";
  const noskyId: string = userMeta.nosky_id || userEmail.split("@")[0] || "";

  // ---------- Load owned products ----------
  const loadProducts = useCallback(async () => {
    if (!sessionCtx.user?.id) {
      setLoading(false);
      return;
    }
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
        const mapped: OwnedProduct[] = joined.data.flatMap((row: any) => {
          const p = row.products;
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
          direct.data.map((p: any) => ({
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
    } catch (err: any) {
      console.error("[ecosystem] loadProducts error", err);
      setErrorMsg("We couldn’t load your products. Please try again.");
      setLoading(false);
    }
  }, [sessionCtx.user?.id]);

  useEffect(() => {
    if (sessionCtx.isAuthenticated) loadProducts();
    else setLoading(false);
  }, [sessionCtx.isAuthenticated, loadProducts]);

  // ---------- Pending onboarding claim ----------
  useEffect(() => {
    if (!sessionCtx.isAuthenticated) return;
    const raw = sessionStorage.getItem("nosky_onboarding");
    if (!raw) return;
    let payload: any;
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
            message: `${result.product_type || payload.productType || "Product"} added to your ecosystem.`,
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
      } catch (err: any) {
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
    if (isExploreMode) {
      setShowUnlockModal(true);
      return;
    }
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

  const handleAddProductClick = () => {
    if (isExploreMode) {
      setShowUnlockModal(true);
    } else {
      navigate({ to: "/verify-product" });
    }
  };

  const handleCreateHomeClick = () => {
    if (isExploreMode) {
      setShowUnlockModal(true);
    } else {
      setShowHomeModal(true);
    }
  };

  const handleCreateHomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHomeName.trim()) return;

    const updated = [...homes, newHomeName.trim()];
    setHomes(updated);
    localStorage.setItem("nosky:homes", JSON.stringify(updated));
    setNewHomeName("");
    setShowHomeModal(false);
    setClaimNotice({
      kind: "success",
      message: `Home "${newHomeName.trim()}" successfully created!`,
    });
  };

  const handleScrollToCatalogue = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Loading state
  if (sessionCtx.authStatus === "initializing") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <span className="h-8 w-8 animate-spin border-4 border-primary border-t-transparent rounded-full" />
        <p className="text-sm font-semibold text-muted-foreground/80 tracking-widest animate-pulse">
          Loading Ecosystem...
        </p>
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
              <div className="font-display text-base font-extrabold tracking-tight text-foreground sm:text-lg">
                NOSKY SMART
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            {isExploreMode ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                <Compass className="h-4 w-4 animate-spin-slow" />
                Explore Mode Preview
              </span>
            ) : (
              `Welcome back${displayName ? `, ${displayName}` : ""}`
            )}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="flex items-center gap-2"
        >
          {isExploreMode ? (
            <>
              <button
                onClick={() => setShowUnlockModal(true)}
                className="grid h-10 w-10 place-items-center rounded-xl border border-primary/20 bg-primary/5 text-primary transition-all hover:bg-primary/15"
                aria-label="Add Product (Premium Trigger)"
                title="Add Product"
              >
                <PlusCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate({ to: "/sign-in" })}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-4 text-xs font-bold text-primary transition-all hover:bg-primary/20"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              <Link
                to="/verify-product"
                className="grid h-10 w-10 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary transition-all hover:bg-primary/20"
                aria-label="Add Product"
                title="Add Product"
              >
                <PlusCircle className="h-4 w-4" />
              </Link>
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
            </>
          )}

          <div ref={profileRef} className="relative">
            <button
              onClick={() => {
                if (isExploreMode) {
                  setShowUnlockModal(true);
                } else {
                  setProfileMenuOpen((v) => !v);
                }
              }}
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
                    onClick={() => navigate({ to: "/verify-product" })}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-foreground transition-colors hover:bg-white/[0.05]"
                  >
                    <PlusCircle className="h-4 w-4 text-primary" /> Add Product
                  </button>
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
            value={isExploreMode ? 1 : loading ? null : (products?.length ?? 0)}
          />
          <SummaryStat
            icon={HomeIcon}
            label="Homes"
            value={isExploreMode ? 1 : loading ? null : homes.length}
          />
          <SummaryStat
            icon={DoorOpen}
            label="Rooms"
            value={isExploreMode ? 1 : loading ? null : isExploreMode ? 0 : 1}
          />
          <SummaryStat
            icon={Wifi}
            label="Online"
            value={isExploreMode ? 1 : loading ? null : onlineCount}
            accent
          />
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
            onClick={handleAddProductClick}
            primary
          />
          <QuickAction icon={HomeIcon} label="Create Home" onClick={handleCreateHomeClick} />
          <QuickAction
            icon={DoorOpen}
            label="Create Room"
            onClick={() => {
              if (isExploreMode) {
                setShowUnlockModal(true);
              } else {
                setClaimNotice({
                  kind: "error",
                  message: "Rooms feature is arriving in the next release.",
                });
              }
            }}
          />
          <QuickAction icon={Bot} label="Talk to Cypher" onClick={openCypher} />
        </div>
      </motion.section>

      {/* ============ MY PRODUCTS / SHOWCASE ============ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 mt-8 pb-4"
      >
        <div className="flex items-center justify-between">
          <SectionLabel>{isExploreMode ? "Featured Product Preview" : "My Products"}</SectionLabel>
          {!loading && !isExploreMode && products && products.length > 0 && (
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

          {!loading && !isExploreMode && errorMsg && (
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

          {/* Authenticated user with zero products */}
          {!loading && !errorMsg && !isExploreMode && products && products.length === 0 && (
            <EmptyState
              onAdd={handleAddProductClick}
              onExplore={handleScrollToCatalogue}
              onCreateHome={handleCreateHomeClick}
              onTalkToCypher={openCypher}
            />
          )}

          {/* Authenticated user with loaded products */}
          {!loading && !errorMsg && !isExploreMode && products && products.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onOpen={() => handleOpenProduct(p)}
                  isExplore={false}
                />
              ))}
            </div>
          )}

          {/* Explore Mode static preview for SMART WATT */}
          {isExploreMode && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
              <motion.div
                whileHover={{ y: -2 }}
                className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 shadow-card transition-all hover:border-primary/25 sm:p-8"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-primary/10 blur-3xl opacity-100" />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary mb-3">
                      <Sparkles className="h-3 w-3 animate-pulse" /> Active Experience
                    </div>
                    <h3 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                      SMART WATT Bulb Controller
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-lg">
                      Explore the flagship device of the NoskyTech ecosystem. Authorized accounts
                      can remotely toggle electrical devices, monitor diagnostic states, configure
                      automation presets, and leverage voice control with direct ESP32 hardware
                      handshake confirmations.
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-3">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Capabilities
                        </span>
                        <span className="mt-1 block text-xs font-semibold text-foreground">
                          Relay control, latency statistics, always-on voice handshakes
                        </span>
                      </div>
                      <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-3">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Specifications
                        </span>
                        <span className="mt-1 block text-xs font-semibold text-foreground">
                          ESP32 SoC, 10A Relay Module, secure SSL telemetry
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 shrink-0 w-full md:w-64">
                    <div className="rounded-2xl border border-white/[0.06] bg-[#050914]/80 p-4 text-center">
                      <div className="grid h-12 w-12 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary mx-auto mb-2">
                        <Zap className="h-6 w-6 animate-pulse" />
                      </div>
                      <span className="block text-xs font-extrabold text-foreground">
                        SMART WATT Node
                      </span>
                      <span className="block text-[10px] font-mono text-muted-foreground/60 mt-0.5">
                        NT-SW-2026-PREVIEW
                      </span>
                    </div>

                    <button
                      onClick={() => setShowUnlockModal(true)}
                      className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-bold tracking-wide text-primary-foreground transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] active:scale-[0.99]"
                    >
                      Inspect Live Controls <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </motion.section>

      {/* ============ WHY NOSKY SMART & CATEGORIES (For all, especially Explore Mode) ============ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="relative z-10 mt-8"
      >
        <SectionLabel>Why Nosky Smart</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <WhyCard
            icon={Bot}
            title="AI Powered"
            description="Intelligent natural voice interaction routed locally or processed by state-of-the-art speech systems."
          />
          <WhyCard
            icon={ShieldCheck}
            title="Secure By Design"
            description="Deterministic hardware handshakes guarantee remote commands represent true physical states."
          />
          <WhyCard
            icon={Layers}
            title="Modular & Expandable"
            description="Bring power management, security devices, sensors, and home presets under a single operating system."
          />
        </div>
      </motion.section>

      {/* ============ PRODUCT CATEGORIES SHOWCASE ============ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative z-10 mt-8"
      >
        <SectionLabel>System Categories</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <CategoryCard icon={Zap} title="Smart Energy" active />
          <CategoryCard icon={HomeIcon} title="Smart Home" />
          <CategoryCard icon={Lock} title="Security" />
          <CategoryCard icon={Cpu} title="AI Automation" active />
        </div>
      </motion.section>

      {/* ============ CONCEPT PREVIEWS (HOMES & ROOMS) ============ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="relative z-10 mt-8"
      >
        <SectionLabel>Ecosystem Concept Preview</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <motion.div
            whileHover={{ y: -1 }}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.01] p-5 shadow-card"
          >
            <div className="flex items-start gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary shrink-0">
                <HomeIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-extrabold text-foreground group-hover:text-primary transition-colors">
                  Multiple Homes Workspace
                </h3>
                <p className="mt-1 text-xs text-muted-foreground/80 leading-relaxed">
                  Manage independent geographical spaces (Primary Residence, Office, Cottage) from
                  the same login profile. Devices share smart credentials under isolated safe
                  network nodes.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -1 }}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.01] p-5 shadow-card"
          >
            <div className="flex items-start gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary shrink-0">
                <DoorOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-extrabold text-foreground group-hover:text-primary transition-colors">
                  Zoned Room Isolation
                </h3>
                <p className="mt-1 text-xs text-muted-foreground/80 leading-relaxed">
                  Partition devices into rooms (Kitchen, Living Room, Bedroom) to support localized
                  macro triggers. E.g. "Hey Cypher, turn off Kitchen" controls only selected nodes.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ============ CYPHER INTRO PREVIEW ============ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="relative z-10 mt-8"
      >
        <div className="rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 to-transparent p-5 sm:p-6 shadow-glow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shrink-0 animate-pulse">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-base font-extrabold text-foreground">
                  Meet Cypher AI Assistant
                </h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-xl leading-relaxed">
                  Cypher is your system brain. In Explore Mode, Cypher answers questions about
                  NoskyTech, smart capabilities, electrical safety, and installation. Once
                  authenticated, Cypher binds to your active hardware.
                </p>
              </div>
            </div>
            <button
              onClick={openCypher}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/15 px-4 text-xs font-bold text-primary transition-colors hover:bg-primary/25 self-start sm:self-center"
            >
              Start Conversation <Bot className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.section>

      {/* ============ PREMIUM PRODUCT CATALOGUE (Target) ============ */}
      <motion.section
        ref={catalogRef}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="relative z-10 mt-12"
      >
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            NoskyTech Product Catalogue
          </h2>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            Discover our expanding ecosystem of physical products. Build a unified, intelligent
            household managed entirely by Cypher.
          </p>

          {/* Filtering Tab buttons */}
          <div className="mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.04] bg-[#050914]/40 p-1 w-fit mx-auto">
            <button
              onClick={() => setActiveCatalogueTab("all")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all",
                activeCatalogueTab === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              All Products
            </button>
            <button
              onClick={() => setActiveCatalogueTab("active")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all",
                activeCatalogueTab === "active"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Available Now
            </button>
            <button
              onClick={() => setActiveCatalogueTab("soon")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all",
                activeCatalogueTab === "soon"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Coming Soon
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {activeCatalogueTab !== "soon" && (
            <CatalogItem
              icon={Zap}
              title="SMART WATT Bulb Node"
              tag="ACTIVE"
              description="Secure connected-device relay module for smart remote ON/OFF bulb control, with direct feedback validation."
              features={[
                "ESP32 Microcontroller Core",
                "10A Relay Switching",
                "Offline Network Polling",
                "Always-On Cypher Voice Integration",
              ]}
              onAction={handleAddProductClick}
              actionLabel={isExploreMode ? "Bind Product" : "Add Product Now"}
            />
          )}

          {activeCatalogueTab !== "active" && (
            <>
              <CatalogItem
                icon={Battery}
                title="Smart Power Bank"
                tag="COMING SOON"
                description="Intelligent solar-integrated high-capacity power bank supporting direct power statistics telemetry."
                features={[
                  "Lithium-Phosphate Cells",
                  "Dual USB-C Power Delivery",
                  "Cypher Battery Status Check",
                  "OLED System Diagnostics",
                ]}
                disabled
              />

              <CatalogItem
                icon={Lock}
                title="Smart Security Lock"
                tag="COMING SOON"
                description="An premium visual door control locking node requiring secure cryptographic token handshake checks."
                features={[
                  "Biometric Access Control",
                  "Encrypted Handshake Protocol",
                  "Cypher Lock Status",
                  "Backup Keypad Activation",
                ]}
                disabled
              />

              <CatalogItem
                icon={Radar}
                title="Smart Radar Sensor"
                tag="COMING SOON"
                description="Ultra-precise millimeter wave movement radar assisting macro room presence triggers."
                features={[
                  "Micro-Movement Sensing",
                  "Daylight Intensity Monitor",
                  "Cypher Automation Core Trigger",
                  "Compact Wall Mount Mounts",
                ]}
                disabled
              />
            </>
          )}
        </div>
      </motion.section>

      {/* ============ FOOTER SECTION ============ */}
      <footer className="relative z-10 mt-16 border-t border-white/[0.04] py-8 text-center text-xs text-muted-foreground/60 space-y-2">
        <p className="font-display font-semibold tracking-wider text-foreground">
          One Account. Every NoskyTech Product.
        </p>
        <p className="text-[10px]">Powered by Cypher · Hardware Handshake protocol 2026</p>
      </footer>

      {/* ============ NEW HOME MODAL (Authenticated only) ============ */}
      <AnimatePresence>
        {showHomeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="glass-panel-elevated relative max-w-md w-full border border-white/[0.12] p-6 rounded-3xl shadow-card"
            >
              <div className="absolute -inset-10 bg-gradient-to-br from-primary/10 via-transparent to-transparent blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className="font-display text-lg font-extrabold text-foreground">
                  Create Virtual Home
                </h3>
                <button
                  onClick={() => setShowHomeModal(false)}
                  className="p-1 rounded-full border border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground mb-4 leading-relaxed relative z-10">
                A Home is a container for your smart products. You can create as many homes as you
                want without needing physical devices to start.
              </p>

              <form onSubmit={handleCreateHomeSubmit} className="space-y-4 relative z-10">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Home Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newHomeName}
                    onChange={(e) => setNewHomeName(e.target.value)}
                    placeholder="e.g. Office Space, Mountain Cabin"
                    className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050914]/60 px-4 text-sm text-foreground focus:border-primary/60 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowHomeModal(false)}
                    className="h-10 rounded-xl px-4 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-10 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground hover:scale-[1.01] active:scale-[0.99] transition-transform"
                  >
                    Create Home
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ PREMIUM UNLOCK ECOSYSTEM MODAL ============ */}
      <AnimatePresence>
        {showUnlockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.93, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="glass-panel-elevated relative max-w-sm w-full border border-white/[0.12] p-6 sm:p-8 rounded-3xl shadow-glow text-center overflow-hidden"
            >
              {/* Cinematic lighting effect */}
              <div className="absolute -inset-16 bg-gradient-to-br from-primary/20 via-transparent to-transparent blur-3xl pointer-events-none" />

              {/* Large glowing lock icon */}
              <div className="relative mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-primary/20 bg-primary/5 text-primary shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                <Lock className="h-8 w-8 animate-pulse" />
              </div>

              <h3 className="relative font-display text-xl font-extrabold text-foreground tracking-tight sm:text-2xl">
                Unlock the Nosky Smart Ecosystem
              </h3>

              <p className="relative mt-3 text-xs leading-relaxed text-muted-foreground/90 px-1">
                Sign in or add a NoskyTech product to unlock automation, rooms, homes and
                intelligent control.
              </p>

              {/* CTAs */}
              <div className="relative mt-8 flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setShowUnlockModal(false);
                    navigate({ to: "/sign-in" });
                  }}
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-xs font-bold tracking-wide text-primary-foreground transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] active:scale-[0.99]"
                >
                  Sign In
                </button>

                <button
                  onClick={() => {
                    setShowUnlockModal(false);
                    navigate({ to: "/verify-product" });
                  }}
                  className="flex h-11 w-full items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-xs font-bold tracking-wide text-foreground hover:bg-white/[0.04] transition-all"
                >
                  Add Product
                </button>

                <button
                  type="button"
                  onClick={() => setShowUnlockModal(false)}
                  className="mt-2 text-xs font-bold text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  Continue Exploring
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

function ProductCard({
  product,
  onOpen,
  isExplore,
}: {
  product: OwnedProduct;
  onOpen: () => void;
  isExplore?: boolean;
}) {
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

function EmptyState({
  onAdd,
  onExplore,
  onCreateHome,
  onTalkToCypher,
}: {
  onAdd: () => void;
  onExplore?: () => void;
  onCreateHome?: () => void;
  onTalkToCypher?: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 text-center sm:p-12">
      <div className="pointer-events-none absolute -inset-16 bg-gradient-to-br from-primary/10 via-transparent to-transparent blur-2xl" />
      <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-[0_0_30px_rgba(59,130,246,0.25)]">
        <PackageOpen className="h-7 w-7" />
      </div>
      <h3 className="relative mt-5 font-display text-lg font-extrabold tracking-tight text-foreground">
        You have not added a NoskyTech product yet.
      </h3>
      <p className="relative mx-auto mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
        Verify your first NoskyTech device to bring it into your Nosky Smart ecosystem, or configure
        homes and talk to Cypher.
      </p>

      <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3 max-w-md mx-auto">
        <button
          onClick={onAdd}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold tracking-wide text-primary-foreground transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] active:scale-[0.99]"
        >
          <PlusCircle className="h-4 w-4" /> Add Product
        </button>

        {onExplore && (
          <button
            onClick={onExplore}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 text-xs font-bold tracking-wide text-foreground transition-all hover:bg-white/[0.04] active:scale-[0.99]"
          >
            <Compass className="h-4 w-4 text-primary" /> Explore Products
          </button>
        )}

        {onCreateHome && (
          <button
            onClick={onCreateHome}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 text-xs font-bold tracking-wide text-foreground transition-all hover:bg-white/[0.04] active:scale-[0.99]"
          >
            <HomeIcon className="h-4 w-4 text-muted-foreground" /> Create Home
          </button>
        )}

        {onTalkToCypher && (
          <button
            onClick={onTalkToCypher}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 text-xs font-bold tracking-wide text-foreground transition-all hover:bg-white/[0.04] active:scale-[0.99]"
          >
            <Bot className="h-4 w-4 text-primary" /> Talk to Cypher
          </button>
        )}
      </div>
    </div>
  );
}

function WhyCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5 shadow-card">
      <div className="grid h-10 w-10 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary mb-3">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display text-sm font-extrabold text-foreground">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground/80">{description}</p>
    </div>
  );
}

function CategoryCard({
  icon: Icon,
  title,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all",
        active
          ? "border-primary/20 bg-primary/[0.03] text-foreground"
          : "border-white/[0.06] bg-white/[0.01] text-muted-foreground hover:border-white/[0.12] hover:text-foreground",
      )}
    >
      <Icon className="h-6 w-6 text-primary mb-2.5" />
      <span className="text-xs font-bold tracking-wide">{title}</span>
    </div>
  );
}

function CatalogItem({
  icon: Icon,
  title,
  tag,
  description,
  features,
  onAction,
  actionLabel,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tag: "ACTIVE" | "COMING SOON";
  description: string;
  features: string[];
  onAction?: () => void;
  actionLabel?: string;
  disabled?: boolean;
}) {
  const isSoon = tag === "COMING SOON";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-5 sm:p-6 shadow-card flex flex-col justify-between",
        isSoon
          ? "border-white/[0.04] bg-white/[0.005] opacity-75"
          : "border-white/[0.08] bg-white/[0.015] hover:border-primary/25 transition-all",
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-bold tracking-wider uppercase border",
              isSoon
                ? "border-white/[0.08] bg-white/[0.02] text-muted-foreground"
                : "border-success/30 bg-success/10 text-success shadow-[0_0_10px_rgba(34,197,94,0.1)]",
            )}
          >
            {tag}
          </span>
        </div>

        <h3 className="font-display text-base font-extrabold text-foreground mt-4 group-hover:text-primary transition-colors">
          {title}
        </h3>

        <p className="mt-2 text-xs text-muted-foreground/80 leading-relaxed">{description}</p>

        <ul className="mt-4 space-y-1.5 text-[11px] text-muted-foreground/70">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        {isSoon ? (
          <button
            disabled
            className="flex h-10 w-full items-center justify-center rounded-xl border border-white/[0.04] bg-white/[0.005] text-xs font-bold text-muted-foreground/40 cursor-not-allowed"
          >
            Coming Soon
          </button>
        ) : (
          <button
            onClick={onAction}
            className="flex h-10 w-full items-center justify-center gap-1 rounded-xl bg-primary text-xs font-bold tracking-wide text-primary-foreground transition-all hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] active:scale-[0.99]"
          >
            {actionLabel} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
