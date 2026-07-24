import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LogOut,
  ShieldCheck,
  Mail,
  ArrowRight,
  Bell,
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
  Plus,
  Compass,
  LayoutDashboard,
  ShieldAlert,
  Sliders,
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useSessionContext } from "@/cypher/context/SessionContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { HomeOnboarding } from "@/components/HomeOnboarding";

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
  component: EcosystemLayout,
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

// ---------- Reusable NoskyTech Logo Component ----------
export function NoskyLogo() {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-primary/25 bg-gradient-to-b from-primary/20 to-primary/5 text-primary shadow-[0_0_15px_rgba(59,130,246,0.25)]">
        <Zap className="h-4.5 w-4.5 filter drop-shadow-[0_0_4px_rgba(59,130,246,0.6)]" strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground/80">
          NoskyTech
        </div>
        <div className="font-display text-sm font-extrabold tracking-tight text-foreground sm:text-base leading-none mt-0.5">
          NOSKY SMART
        </div>
      </div>
    </div>
  );
}

// ---------- Ecosystem Layout Wrapper ----------
function EcosystemLayout() {
  const sessionCtx = useSessionContext();
  const navigate = useNavigate();

  // Check if explore mode is active (?mode=explore)
  const isExploreMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "explore";

  // Route protection
  useEffect(() => {
    if (isExploreMode) return;
    if (sessionCtx.authStatus === "unauthenticated" || sessionCtx.authStatus === "expired") {
      navigate({ to: "/welcome" });
    }
  }, [sessionCtx.authStatus, navigate, isExploreMode]);

  const [products, setProducts] = useState<OwnedProduct[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [claimNotice, setClaimNotice] = useState<ClaimNotice>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Active Modals state
  const [activeModal, setActiveModal] = useState<
    "none" | "profile" | "homes" | "notifications" | "settings"
  >("none");

  const myProductsRef = useRef<HTMLDivElement | null>(null);

  const [homes, setHomes] = useState<any[] | null>(null);
  const [homesLoading, setHomesLoading] = useState(true);
  const [homeCreating, setHomeCreating] = useState(false);

  // ---------- Load Homes ----------
  const loadHomes = useCallback(async () => {
    if (isExploreMode) {
      setHomes([{ id: "explore-home", name: "My Home (Preview)" }]);
      setHomesLoading(false);
      return;
    }
    if (!sessionCtx.user?.id) return;
    setHomesLoading(true);
    try {
      const { data, error } = await supabase
        .from("homes")
        .select("id, name, owner_id")
        .eq("owner_id", sessionCtx.user.id);

      if (error) throw error;
      setHomes(data || []);
    } catch (err) {
      console.error("[ecosystem] loadHomes error", err);
      setHomes([]);
    } finally {
      setHomesLoading(false);
    }
  }, [sessionCtx.user?.id, isExploreMode]);

  useEffect(() => {
    if (sessionCtx.isAuthenticated || isExploreMode) {
      loadHomes();
    }
  }, [sessionCtx.isAuthenticated, isExploreMode, loadHomes]);

  const handleCreateHome = async (name: string, type: string | null, location: string | null) => {
    if (!sessionCtx.user?.id) return;
    setHomeCreating(true);
    try {
      const { error } = await supabase
        .from("homes")
        .insert({
          name,
          owner_id: sessionCtx.user.id,
        });

      if (error) throw error;

      toast.success("Welcome to your first Nosky Home.");
      await loadHomes();
    } catch (err: any) {
      console.error("[ecosystem] createHome error", err);
      throw new Error(err.message || "Could not create Home. Please try again.");
    } finally {
      setHomeCreating(false);
    }
  };

  const userEmail = sessionCtx.user?.email || "";
  const userMeta = sessionCtx.user?.user_metadata ?? {};

  // Custom display name falling back to email username
  const fallbackName = userEmail ? userEmail.split("@")[0] : "Nosky Tech Member";
  const displayName: string =
    userMeta.full_name || userMeta.name || userMeta.nosky_id || fallbackName;
  const noskyId: string = userMeta.nosky_id || (userEmail ? userEmail.split("@")[0] : "—");

  // Get initials for profile avatar
  const getInitials = () => {
    const name = userMeta.full_name || userMeta.name;
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }
    if (userEmail) {
      return userEmail[0].toUpperCase();
    }
    return "";
  };

  const userInitials = getInitials();
  const avatarUrl = userMeta.avatar_url || userMeta.picture;

  // ---------- Load owned products ----------
  const loadProducts = useCallback(async () => {
    if (isExploreMode) {
      setProducts([
        {
          id: "mock-bulb",
          product_uid: "NT-SW-2026-MOCK01",
          product_type: "light_bulb",
          model: "SW-BULB-01",
          name: "Smart Ambient Bulb",
          online: true,
          claimed_at: new Date().toISOString(),
        }
      ]);
      setLoading(false);
      return;
    }
    if (!sessionCtx.user?.id) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      // Attempt a joined read first
      const joined = await supabase
        .from("user_products")
        .select(
          `id, claimed_at, products:product_id (id, product_uid, product_type, model, name, online)`
        )
        .eq("user_id", sessionCtx.user.id)
        .order("claimed_at", { ascending: false });

      if (!joined.error && Array.isArray(joined.data)) {
        const mapped: OwnedProduct[] = joined.data.flatMap((row: any) => {
          const p = row.products;
          if (!p) return [];
          return [{
            id: p.id ?? row.id,
            product_uid: p.product_uid ?? "",
            product_type: p.product_type ?? null,
            model: p.model ?? null,
            name: p.name ?? null,
            online: p.online ?? null,
            claimed_at: row.claimed_at ?? null,
          }];
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
          }))
        );
        setLoading(false);
        return;
      }

      setProducts([]);
      setLoading(false);
    } catch (err: any) {
      console.error("[ecosystem] loadProducts error", err);
      setErrorMsg("We couldn’t load your products. Please try again.");
      setLoading(false);
    }
  }, [sessionCtx.user?.id]);

  useEffect(() => {
    if (sessionCtx.isAuthenticated || isExploreMode) loadProducts();
  }, [sessionCtx.isAuthenticated, isExploreMode, loadProducts]);

  // ---------- Pending onboarding claim ----------
  useEffect(() => {
    if (!sessionCtx.isAuthenticated || isExploreMode) return;
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

  const handleSignOut = async () => {
    sessionStorage.removeItem("nosky_onboarding");
    await supabase.auth.signOut();
    navigate({ to: "/welcome" });
  };

  const handleOpenProduct = (p: OwnedProduct) => {
    const route = productRoute(p.product_type);
    if (route) navigate({ to: route });
    else setClaimNotice({ kind: "error", message: `${p.product_type ?? "This product"} experience is coming soon.` });
  };

  const openCypher = () => {
    try {
      window.dispatchEvent(new CustomEvent("nosky:openCypher"));
    } catch {
      /* noop */
    }
  };

  // Loading state
  const mainLoading =
    sessionCtx.authStatus === "initializing" ||
    (homesLoading && (sessionCtx.isAuthenticated || isExploreMode));

  if (mainLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <span className="h-8 w-8 animate-spin border-4 border-primary border-t-transparent rounded-full" />
        <p className="text-sm font-semibold text-muted-foreground/80 tracking-widest animate-pulse">
          Loading Ecosystem...
        </p>
      </div>
    );
  }

  if (!sessionCtx.isAuthenticated && !isExploreMode) return null;

  // Render Premium Onboarding Form if authenticated and has 0 homes
  if (!isExploreMode && sessionCtx.isAuthenticated && homes && homes.length === 0) {
    return (
      <div className="min-h-screen bg-[#050914] text-foreground flex flex-col justify-between">
        <header className="sticky top-0 z-40 w-full border-b border-white/[0.04] bg-[#050914]/60 backdrop-blur-2xl">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
            <NoskyLogo />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md hover:bg-destructive/10 hover:text-destructive transition-all animate-pulse"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center">
          <HomeOnboarding onCreateHome={handleCreateHome} loading={homeCreating} />
        </main>

        <footer className="py-4 text-center text-[10px] text-muted-foreground/20 border-t border-white/[0.02]">
          © 2026 NoskyTech · Hardware Handshake Protocol
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050914] text-foreground flex flex-col">
      {/* Premium Sticky Header */}
      <EcosystemHeader
        displayName={displayName}
        noskyId={noskyId}
        email={userEmail}
        avatarUrl={avatarUrl}
        userInitials={userInitials}
        onSignOut={handleSignOut}
        onScrollToProducts={() => {
          myProductsRef.current?.scrollIntoView({ behavior: "smooth" });
          loadProducts();
        }}
        onOpenCypher={openCypher}
        activeModal={activeModal}
        setActiveModal={setActiveModal}
      />

      {/* Main Page Content */}
      <div className="flex-1 relative z-10 mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <EcosystemPageContent
          products={products}
          loading={loading}
          errorMsg={errorMsg}
          claimNotice={claimNotice}
          setClaimNotice={setClaimNotice}
          displayName={displayName}
          loadProducts={loadProducts}
          handleOpenProduct={handleOpenProduct}
          openCypher={openCypher}
          myProductsRef={myProductsRef}
          onAddProduct={() => navigate({ to: "/verify-product" })}
          setActiveModal={setActiveModal}
          isExploreMode={isExploreMode}
          homes={homes}
        />
      </div>

      {/* Profile Modal */}
      <Modal
        isOpen={activeModal === "profile"}
        onClose={() => setActiveModal("none")}
        title="Profile Details"
      >
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-4 border-b border-white/[0.06] pb-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 font-display text-lg font-bold text-primary">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full rounded-full object-cover" />
              ) : (
                userInitials || <User className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-extrabold text-foreground truncate">{displayName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">NoskyTech Member</p>
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Full Name</span>
              <span className="block mt-1 text-sm font-semibold text-foreground">{displayName}</span>
            </div>
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Address</span>
              <span className="block mt-1 text-sm font-semibold text-foreground truncate">{userEmail}</span>
            </div>
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nosky ID</span>
              <span className="block mt-1 text-sm font-semibold text-primary font-mono">{noskyId}</span>
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button
              onClick={() => {
                setClaimNotice({ kind: "error", message: "Profile editing is temporarily unavailable." });
                setActiveModal("none");
              }}
              className="flex-1 inline-flex h-10 items-center justify-center rounded-xl bg-primary text-xs font-bold tracking-wide text-primary-foreground transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              Edit Profile
            </button>
            <button
              onClick={() => setActiveModal("none")}
              className="px-4 inline-flex h-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-xs font-bold text-foreground transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Homes Modal */}
      <Modal
        isOpen={activeModal === "homes"}
        onClose={() => setActiveModal("none")}
        title="Nosky Smart Homes"
      >
        <div className="text-center py-4 space-y-4">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_20px_rgba(59,130,246,0.2)] animate-pulse">
            <HomeIcon className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-lg font-extrabold text-foreground">Homes Coming Next</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Our engineering team is finalizing the multi-home ecosystem controller. Soon, you will be able to orchestrate products across multiple locations dynamically.
            </p>
          </div>
          <button
            onClick={() => setActiveModal("none")}
            className="mt-2 w-full inline-flex h-10 items-center justify-center rounded-xl bg-primary text-xs font-bold tracking-wide text-primary-foreground transition-all"
          >
            Acknowledge
          </button>
        </div>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        isOpen={activeModal === "notifications"}
        onClose={() => setActiveModal("none")}
        title="Notifications"
      >
        <div className="text-center py-6 space-y-4">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-muted-foreground/60">
            <Bell className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">No new notifications</h4>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Your Nosky Smart ecosystem is fully synced and healthy.
            </p>
          </div>
          <button
            onClick={() => setActiveModal("none")}
            className="w-full inline-flex h-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={activeModal === "settings"}
        onClose={() => setActiveModal("none")}
        title="Ecosystem Settings"
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-muted-foreground">
            Configure system configurations for your shared Nosky Smart Ecosystem.
          </p>

          <div className="divide-y divide-white/[0.06] border-y border-white/[0.06] py-1">
            <div className="flex items-center justify-between py-3">
              <div>
                <span className="block text-sm font-semibold text-foreground">Real-time Telemetry</span>
                <span className="block text-[11px] text-muted-foreground mt-0.5">Stream live device updates</span>
              </div>
              <div className="h-6 w-11 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-end p-0.5">
                <div className="h-4 w-4 rounded-full bg-primary" />
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <span className="block text-sm font-semibold text-foreground">Secure Handshake</span>
                <span className="block text-[11px] text-muted-foreground mt-0.5">Verify firmware automatically</span>
              </div>
              <div className="h-6 w-11 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-end p-0.5">
                <div className="h-4 w-4 rounded-full bg-primary" />
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <span className="block text-sm font-semibold text-foreground">Diagnostic Log Cache</span>
                <span className="block text-[11px] text-muted-foreground mt-0.5">Retain 24h of system signals</span>
              </div>
              <div className="h-6 w-11 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-start p-0.5">
                <div className="h-4 w-4 rounded-full bg-muted-foreground/50" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-warning/10 bg-warning/5 p-3 flex gap-2">
            <ShieldAlert className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="block text-xs font-bold text-warning">More settings coming soon</span>
              <span className="block text-[10px] text-warning/80 mt-0.5 leading-relaxed">
                Hardware preference controls, guest access delegation, and security logging are under development.
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setActiveModal("none")}
              className="w-full inline-flex h-10 items-center justify-center rounded-xl bg-primary text-xs font-bold tracking-wide text-primary-foreground transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ---------- Component: Sticky Premium Header ----------
interface EcosystemHeaderProps {
  displayName: string;
  noskyId: string;
  email: string;
  avatarUrl?: string;
  userInitials: string;
  onSignOut: () => void;
  onScrollToProducts: () => void;
  onOpenCypher: () => void;
  activeModal: string;
  setActiveModal: (modal: any) => void;
}

function EcosystemHeader({
  displayName,
  noskyId,
  email,
  avatarUrl,
  userInitials,
  onSignOut,
  onScrollToProducts,
  onOpenCypher,
  activeModal,
  setActiveModal,
}: EcosystemHeaderProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const avatarButtonRef = useRef<HTMLButtonElement | null>(null);
  const navigate = useNavigate();

  // Handle outside clicks
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        avatarButtonRef.current &&
        !avatarButtonRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileMenuOpen]);

  // Handle Escape press to close
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [profileMenuOpen]);

  const selectAction = (modal: "profile" | "homes" | "notifications" | "settings") => {
    setProfileMenuOpen(false);
    setActiveModal(modal);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.04] bg-[#050914]/60 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Left Side: Logo */}
        <Link to="/ecosystem">
          <NoskyLogo />
        </Link>

        {/* Right Side: Action + Profile */}
        <div className="flex items-center gap-3">
          {/* Add Product Button */}
          <div className="relative group">
            <button
              onClick={() => navigate({ to: "/verify-product" })}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-gradient-to-b from-primary/10 to-primary/0 text-primary shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300 hover:border-primary/40 hover:bg-primary/15 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-95"
              aria-label="Add NoskyTech Product"
            >
              <Plus className="h-5 w-5 stroke-[2.5]" />
            </button>
            {/* Desktop Tooltip */}
            <span className="absolute bottom-[-42px] left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all duration-200 origin-top pointer-events-none z-50 whitespace-nowrap rounded-lg bg-black/90 border border-white/[0.08] px-2.5 py-1 text-[10px] font-semibold text-foreground shadow-md">
              Add NoskyTech Product
            </span>
          </div>

          {/* Profile Button & Dropdown */}
          <div className="relative">
            <button
              ref={avatarButtonRef}
              onClick={() => setProfileMenuOpen((v) => !v)}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] font-display text-sm font-semibold text-foreground transition-all duration-300 outline-none hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus:ring-2 focus:ring-primary/40",
                profileMenuOpen && "border-primary/50 bg-primary/10 text-primary ring-2 ring-primary/40"
              )}
              aria-label="Profile Menu"
              aria-expanded={profileMenuOpen}
            >
              <div className="absolute inset-0 rounded-full border border-primary/0 hover:shadow-[0_0_12px_rgba(59,130,246,0.25)] transition-shadow duration-300" />
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full rounded-full object-cover" />
              ) : (
                userInitials || <User className="h-4.5 w-4.5" />
              )}
            </button>

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-12 z-50 w-72 origin-top-right overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0A1220]/95 p-1.5 shadow-card backdrop-blur-xl"
                >
                  {/* Account Summary */}
                  <div className="border-b border-white/[0.06] px-4 py-3.5 mb-1 select-none">
                    <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      NOSKY SMART ACCOUNT
                    </span>
                    <span className="block mt-1.5 truncate text-sm font-extrabold text-foreground">
                      {displayName}
                    </span>
                    <span className="block mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground/90 font-mono">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-primary/85 bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-md scale-90 origin-left">
                        ID
                      </span>
                      {noskyId}
                    </span>
                    <span className="block mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
                      <Mail className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">{email}</span>
                    </span>
                  </div>

                  {/* Dropdown Items */}
                  <div className="space-y-0.5">
                    <DropdownItem
                      icon={User}
                      label="Profile"
                      onClick={() => selectAction("profile")}
                    />
                    <DropdownItem
                      icon={HomeIcon}
                      label="Homes"
                      onClick={() => selectAction("homes")}
                    />
                    <DropdownItem
                      icon={Package}
                      label="My Products"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onScrollToProducts();
                      }}
                    />
                    <DropdownItem
                      icon={Bot}
                      label="Cypher"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onOpenCypher();
                      }}
                    />
                    <DropdownItem
                      icon={Bell}
                      label="Notifications"
                      onClick={() => selectAction("notifications")}
                    />
                    <DropdownItem
                      icon={SettingsIcon}
                      label="Settings"
                      onClick={() => selectAction("settings")}
                    />
                  </div>

                  {/* Sign Out Button */}
                  <div className="border-t border-white/[0.06] mt-1.5 pt-1.5 pb-0.5">
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onSignOut();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-destructive/90 transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

// ---------- Helper Dropdown Item Component ----------
interface DropdownItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}

function DropdownItem({ icon: Icon, label, onClick }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-left text-xs font-semibold text-foreground/90 transition-colors hover:bg-white/[0.04] hover:text-foreground"
    >
      <Icon className="h-4 w-4 text-primary/70 shrink-0" />
      <span>{label}</span>
    </button>
  );
}

// ---------- Component: Modal Overlay ----------
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0A1220]/95 p-5 shadow-card backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
              <h2 className="font-display text-base font-extrabold text-foreground tracking-tight">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-all"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="relative z-10">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ---------- Component: Main Page Dashboard Content ----------
interface EcosystemPageContentProps {
  products: OwnedProduct[] | null;
  loading: boolean;
  errorMsg: string | null;
  claimNotice: ClaimNotice;
  setClaimNotice: (notice: ClaimNotice) => void;
  displayName: string;
  loadProducts: () => void;
  handleOpenProduct: (p: OwnedProduct) => void;
  openCypher: () => void;
  myProductsRef: React.RefObject<HTMLDivElement | null>;
  onAddProduct: () => void;
  setActiveModal: (modal: any) => void;
  isExploreMode: boolean;
  homes: any[] | null;
}

function EcosystemPageContent({
  products,
  loading,
  errorMsg,
  claimNotice,
  setClaimNotice,
  displayName,
  loadProducts,
  handleOpenProduct,
  openCypher,
  myProductsRef,
  onAddProduct,
  setActiveModal,
  isExploreMode,
  homes,
}: EcosystemPageContentProps) {
  const onlineCount = (products ?? []).filter((p) => p.online === true).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px] bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-3xl" />

      {/* Greeting Banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-sm text-muted-foreground sm:text-base">
          Welcome back{displayName ? `, ${displayName}` : ""}
        </p>
      </motion.div>

      {/* ============ CLAIM NOTICE ============ */}
      <AnimatePresence>
        {claimNotice && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="relative z-10"
          >
            <div
              className={cn(
                "flex items-start justify-between gap-3 rounded-2xl border p-3 text-sm",
                claimNotice.kind === "success"
                  ? "border-success/25 bg-success/5 text-success"
                  : "border-destructive/25 bg-destructive/5 text-destructive"
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
        className="relative z-10 overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-card backdrop-blur-xl sm:p-6"
      >
        <div className="pointer-events-none absolute -inset-16 bg-gradient-to-br from-primary/12 via-transparent to-transparent blur-2xl" />
        <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <SummaryStat
            icon={Package}
            label="Products"
            value={loading ? null : (products?.length ?? 0)}
          />
          <SummaryStat icon={HomeIcon} label="Homes" value={loading ? null : (isExploreMode ? 1 : (homes?.length ?? 0))} />
          <SummaryStat icon={DoorOpen} label="Rooms" value={loading ? null : (isExploreMode ? 4 : 0)} />
          <SummaryStat
            icon={Wifi}
            label="Online"
            value={loading ? null : onlineCount}
            accent
          />
        </div>
      </motion.section>

      {/* ============ MY HOMES / FEATURED PREVIEW ============ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.12 }}
        className="relative z-10"
      >
        <SectionLabel>{isExploreMode ? "Featured Preview" : "My Homes"}</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isExploreMode ? (
            <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-primary/5 p-5 shadow-card backdrop-blur-xl">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl opacity-50" />
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                    <HomeIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-extrabold tracking-tight text-foreground">
                      My Home (Preview)
                    </h3>
                    <span className="block text-[10px] font-semibold text-primary uppercase tracking-wider mt-0.5">
                      Active Environment
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                  Preview Only
                </span>
              </div>

              {/* Rooms list */}
              <div className="mt-4 border-t border-white/[0.06] pt-3.5">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Configured Rooms
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {["Living Room", "Kitchen", "Bedroom", "Office"].map((room) => (
                    <div
                      key={room}
                      className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.01] px-3 py-2 text-xs font-semibold text-foreground/85 hover:bg-white/[0.03] transition-colors"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                      {room}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            (homes ?? []).map((h) => (
              <div
                key={h.id}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-card transition-all hover:border-primary/25"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                    <HomeIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-extrabold tracking-tight text-foreground">
                      {h.name}
                    </h3>
                    <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Primary Location
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.section>

      {/* ============ QUICK ACTIONS ============ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="relative z-10"
      >
        <SectionLabel>Quick Actions</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <QuickAction
            icon={Plus}
            label="Add Product"
            onClick={onAddProduct}
            primary
          />
          <QuickAction
            icon={HomeIcon}
            label="Create Home"
            onClick={() => setActiveModal("homes")}
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
        ref={myProductsRef}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 pb-16"
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
            <EmptyState onAdd={onAddProduct} />
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
            : "border-primary/20 bg-primary/10 text-primary"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-extrabold text-foreground tabular-nums">
        {value === null ? <span className="inline-block h-6 w-8 animate-pulse rounded bg-white/5" /> : value}
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
          : "border-white/[0.08] bg-white/[0.02] text-foreground hover:border-white/[0.16] hover:bg-white/[0.04]"
      )}
    >
      <div
        className={cn(
          "grid h-9 w-9 place-items-center rounded-xl border",
          primary
            ? "border-primary/30 bg-primary/15"
            : "border-white/[0.08] bg-white/[0.03] text-primary"
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
}: {
  product: OwnedProduct;
  onOpen: () => void;
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
          : "border-white/[0.08] bg-white/[0.03] text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          online ? "bg-success shadow-[0_0_8px_currentColor]" : "bg-muted-foreground/60"
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
        <Plus className="h-4 w-4" /> Add Product
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
