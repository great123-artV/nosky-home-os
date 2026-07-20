import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { SignIn } from "@/components/SignIn";
import { LegalModal } from "@/components/legal-modal";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/sign-in")({
  ssr: false,
  component: SignInScreen,
});

function SignInScreen() {
  const navigate = useNavigate();
  const [legal, setLegal] = useState<"terms" | "privacy" | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Guard reference to prevent duplicate claim calls
  const isClaimingRef = useRef(false);

  const handleSuccess = async () => {
    // Read potential onboarding session from sessionStorage
    const onboardingRaw = sessionStorage.getItem("nosky_onboarding");
    if (!onboardingRaw) {
      navigate({ to: "/ecosystem" });
      return;
    }

    try {
      const onboarding = JSON.parse(onboardingRaw);

      // Verify expiry if exists
      if (onboarding.expiresAt) {
        const expiry = new Date(onboarding.expiresAt).getTime();
        if (Date.now() > expiry) {
          sessionStorage.removeItem("nosky_onboarding");
          sessionStorage.setItem("nosky_onboarding_expired", "true");
          navigate({ to: "/verify-product" });
          return;
        }
      }

      if (!onboarding.onboardingToken) {
        navigate({ to: "/ecosystem" });
        return;
      }

      // Guard duplicate claim operations
      if (isClaimingRef.current) return;
      isClaimingRef.current = true;
      setIsClaiming(true);
      setClaimError(null);

      const { data, error } = await supabase.rpc("claim_verified_product", {
        onboarding_token: onboarding.onboardingToken,
      });

      if (error) {
        throw error;
      }

      const claimResult = Array.isArray(data) ? data[0] : data;

      if (claimResult?.success) {
        sessionStorage.removeItem("nosky_onboarding");
        navigate({ to: "/ecosystem" });
      } else {
        setClaimError(claimResult?.message || "Failed to claim verified product.");
        setIsClaiming(false);
        isClaimingRef.current = false;
      }

    } catch (err: any) {
      console.error("Error claiming product on sign in success:", err);
      setClaimError("We couldn’t claim your verified product right now. Please navigate back to verify again.");
      setIsClaiming(false);
      isClaimingRef.current = false;
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col justify-between py-6 px-4 sm:px-6 relative z-10">
      {/* Top Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex items-center"
      >
        <Link
          to="/welcome"
          className="group inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-white/[0.12] transition-all"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back
        </Link>
      </motion.div>

      {/* Main Component Sign In */}
      <div className="flex-1 my-4">
        {isClaiming ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">Completing product setup...</h2>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              We are securely pairing your verified device with your newly logged in session. Please don't close this page.
            </p>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            {claimError && (
              <div className="max-w-md mx-auto w-full p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-xs text-destructive text-center">
                {claimError}
              </div>
            )}
            <SignIn
              onLegal={(docId) => setLegal(docId)}
              onSuccess={handleSuccess}
            />
          </div>
        )}
      </div>

      {/* Legal documents Modal */}
      <LegalModal docId={legal} onClose={() => setLegal(null)} />
    </div>
  );
}
