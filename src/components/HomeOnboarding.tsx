import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Home as HomeIcon,
  Building2,
  Briefcase,
  Store,
  Bed,
  Factory,
  MapPin,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HomeOnboardingProps {
  onCreateHome: (name: string, type: string | null, location: string | null) => Promise<void>;
  loading: boolean;
}

// Home types metadata
const HOME_TYPES = [
  { id: "house", label: "House", icon: HomeIcon, color: "from-blue-500/20 to-indigo-500/10 text-blue-400" },
  { id: "apartment", label: "Apartment", icon: Building2, color: "from-purple-500/20 to-pink-500/10 text-purple-400" },
  { id: "office", label: "Office", icon: Briefcase, color: "from-amber-500/20 to-orange-500/10 text-amber-400" },
  { id: "shop", label: "Shop", icon: Store, color: "from-emerald-500/20 to-teal-500/10 text-emerald-400" },
  { id: "hostel", label: "Hostel", icon: Bed, color: "from-cyan-500/20 to-blue-500/10 text-cyan-400" },
  { id: "factory", label: "Factory", icon: Factory, color: "from-rose-500/20 to-red-500/10 text-rose-400" },
  { id: "other", label: "Other", icon: MapPin, color: "from-gray-500/20 to-slate-500/10 text-gray-400" },
];

export function HomeOnboarding({ onCreateHome, loading }: HomeOnboardingProps) {
  const [homeName, setHomeName] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeName.trim()) {
      setErrorMsg("Please enter a name for your Home.");
      return;
    }
    setErrorMsg(null);
    try {
      await onCreateHome(homeName.trim(), selectedType, location.trim() || null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create home. Please try again.");
    }
  };

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center py-6 px-4 sm:px-6 relative z-10 w-full max-w-2xl mx-auto">
      {/* Background radial soft light overlay */}
      <div className="pointer-events-none absolute -inset-10 bg-gradient-to-br from-primary/10 via-transparent to-transparent blur-3xl rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full"
      >
        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/15 to-primary/5 text-primary shadow-[0_0_20px_rgba(59,130,246,0.2)]"
          >
            <HomeIcon className="h-6 w-6 filter drop-shadow-[0_0_4px_rgba(59,130,246,0.4)]" strokeWidth={2} />
          </motion.div>

          <h1 className="font-display text-2xl font-extrabold text-foreground tracking-tight sm:text-3xl">
            Create your first Home
          </h1>

          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground/90 max-w-md mx-auto">
            Every NoskyTech product belongs to a Home. <br className="hidden sm:inline" />
            Start by creating the place where your automation will live.
          </p>
        </div>

        {/* Card Form container */}
        <div className="glass-panel border border-white/[0.08] p-5 sm:p-8 rounded-3xl shadow-card relative overflow-hidden bg-white/[0.01] backdrop-blur-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Sparkles className="h-24 w-24 text-primary" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            {/* Field: Home Name */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Home Name <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                required
                disabled={loading}
                value={homeName}
                onChange={(e) => {
                  setHomeName(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="e.g. My Smart HQ, Living Headquarters"
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#050914]/50 px-4 text-sm text-foreground placeholder:text-muted-foreground/25 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all duration-300"
              />
            </div>

            {/* Field: Home Type Selector */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Optional Home Type
                </label>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  Select the category that best matches your environment
                </p>
              </div>

              {/* Grid of glassmorphic selectable cards */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {HOME_TYPES.map((type) => {
                  const IconComponent = type.icon;
                  const isSelected = selectedType === type.label;

                  return (
                    <button
                      key={type.id}
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setSelectedType(isSelected ? null : type.label);
                      }}
                      className={cn(
                        "group flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-300 select-none",
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-[1.02]"
                          : "border-white/[0.06] bg-white/[0.01] hover:border-white/[0.12] hover:bg-white/[0.03] text-muted-foreground/80 hover:text-foreground active:scale-[0.98]"
                      )}
                    >
                      <div
                        className={cn(
                          "grid h-10 w-10 place-items-center rounded-xl border bg-gradient-to-b transition-all duration-300 mb-2",
                          isSelected
                            ? "border-primary/30 text-primary bg-primary/15"
                            : "border-white/[0.06] bg-white/[0.02]"
                        )}
                      >
                        <IconComponent className={cn("h-5 w-5", isSelected ? "filter drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]" : "text-muted-foreground/60 group-hover:text-foreground")} />
                      </div>
                      <span className="text-xs font-bold tracking-wide">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Field: Optional Location */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Optional Location
              </label>
              <input
                type="text"
                disabled={loading}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#050914]/50 px-4 text-sm text-foreground placeholder:text-muted-foreground/25 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all duration-300"
              />
            </div>

            {/* Error Message */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-xs text-destructive text-center font-medium"
              >
                {errorMsg}
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !homeName.trim()}
              className="relative overflow-hidden flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs sm:text-sm font-bold tracking-wider text-primary-foreground transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_24px_rgba(59,130,246,0.35)] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Home...
                </>
              ) : (
                <>
                  Create Home
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info lockup */}
        <div className="text-center text-[10px] sm:text-[11px] text-muted-foreground/30 mt-6 tracking-wide">
          Your Home provides secure, encrypted storage for products, rooms and family access.
        </div>
      </motion.div>
    </div>
  );
}
