import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ShieldCheck,
  QrCode,
  Camera,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/lib/supabase";
import { useSessionContext } from "@/cypher/context/SessionContext";

export const Route = createFileRoute("/verify-product")({
  ssr: false,
  component: VerifyProductScreen,
});

type VerifyProductResult = {
  valid: boolean;
  product_type: string | null;
  model: string | null;
  onboarding_token: string | null;
  expires_at: string | null;
  message: string;
};

type ClaimProductResult = {
  success: boolean;
  product_id: string | null;
  product_uid: string | null;
  product_type: string | null;
  model: string | null;
  message: string;
};

function VerifyProductScreen() {
  const navigate = useNavigate();
  const sessionCtx = useSessionContext();

  const [productUid, setProductUid] = useState("");
  const [activationCode, setActivationCode] = useState("");

  // Status states
  const [status, setStatus] = useState<
    "idle" | "scanning" | "verifying" | "success" | "claiming" | "claim-success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // QR scanner states
  const [qrScannerError, setQrScannerError] = useState<string | null>(null);
  const [isQrScannerActive, setIsQrScannerActive] = useState(false);
  const qrRegionId = "qr-reader-target";
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  // Handle manual/expired session notices on load
  useEffect(() => {
    const expiredNotice = sessionStorage.getItem("nosky_onboarding_expired");
    if (expiredNotice) {
      setErrorMsg("Product verification expired. Please verify the product again.");
      setStatus("error");
      sessionStorage.removeItem("nosky_onboarding_expired");
    }
  }, []);

  // Cleanup scanner on unmount or route change
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setQrScannerError(null);
    setIsQrScannerActive(true);
    setStatus("scanning");

    // Give DOM a tick to render div target
    setTimeout(async () => {
      try {
        const html5Qrcode = new Html5Qrcode(qrRegionId);
        html5QrcodeRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: "environment" }, // Prefer back camera
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            },
          },
          (decodedText) => {
            // QR Scanned Successfully
            handleDecodedText(decodedText);
          },
          (errorMessage) => {
            // Noise/Scanning error - ignore to prevent spamming logs
          },
        );
      } catch (err: any) {
        console.error("Camera access failed", err);
        setQrScannerError("Camera permission denied or camera not found.");
        setIsQrScannerActive(false);
        setStatus("idle");
      }
    }, 50);
  };

  const stopScanner = async () => {
    if (html5QrcodeRef.current) {
      if (html5QrcodeRef.current.isScanning) {
        try {
          await html5QrcodeRef.current.stop();
        } catch (e) {
          console.error("Error stopping scanner", e);
        }
      }
      html5QrcodeRef.current = null;
    }
    setIsQrScannerActive(false);
  };

  const handleCloseScanner = async () => {
    await stopScanner();
    setStatus("idle");
  };

  const handleDecodedText = async (text: string) => {
    await stopScanner();
    setStatus("idle");

    try {
      // 1. Try to parse as JSON first
      if (text.trim().startsWith("{")) {
        const parsed = JSON.parse(text);
        if (parsed.product_uid && parsed.activation_code) {
          setProductUid(parsed.product_uid.trim().toUpperCase());
          setActivationCode(parsed.activation_code.trim());
          return;
        }
      }

      // 2. Try to parse as URL query parameters
      const url = new URL(text);
      const uid = url.searchParams.get("product_uid");
      const code = url.searchParams.get("activation_code");

      if (uid && code) {
        setProductUid(uid.trim().toUpperCase());
        setActivationCode(code.trim());
        return;
      }
    } catch (e) {
      // Not a JSON or valid URL with expected params
    }

    // Fallback error if QR could not be parsed
    setErrorMsg("This QR code is not a valid NoskyTech product code.");
    setStatus("error");
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!productUid.trim() || !activationCode.trim()) {
      setErrorMsg("Please fill in both Product UID and Activation Code.");
      setStatus("error");
      return;
    }

    setStatus("verifying");
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.rpc("verify_product_for_onboarding", {
        product_uid: productUid.trim().toUpperCase(),
        activation_code: activationCode.trim(),
      });

      if (error) {
        throw error;
      }

      const result: VerifyProductResult = Array.isArray(data) ? data[0] : data;

      if (!result || !result.valid || !result.onboarding_token) {
        setErrorMsg(result?.message || "Invalid Product UID or Activation Code.");
        setStatus("error");
        return;
      }

      // Successful verification
      setStatus("success");

      // Store in sessionStorage
      sessionStorage.setItem(
        "nosky_onboarding",
        JSON.stringify({
          onboardingToken: result.onboarding_token,
          productUid: productUid.trim().toUpperCase(),
          productType: result.product_type,
          model: result.model,
          expiresAt: result.expires_at,
        }),
      );

      // Authenticated flow
      if (sessionCtx.isAuthenticated) {
        setStatus("claiming");
        const { data: claimData, error: claimError } = await supabase.rpc(
          "claim_verified_product",
          {
            onboarding_token: result.onboarding_token,
          },
        );

        if (claimError) {
          throw claimError;
        }

        const claimResult: ClaimProductResult = Array.isArray(claimData) ? claimData[0] : claimData;

        if (claimResult?.success) {
          sessionStorage.removeItem("nosky_onboarding");
          setStatus("claim-success");
          setTimeout(() => {
            navigate({ to: "/ecosystem" });
          }, 1500);
        } else {
          setErrorMsg(claimResult?.message || "Failed to claim product.");
          setStatus("error");
        }
      } else {
        // Unauthenticated flow: go to Sign In
        setTimeout(() => {
          navigate({ to: "/sign-in" });
        }, 1200);
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setErrorMsg("We couldn’t verify this product right now. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="flex min-h-[85vh] flex-col justify-between py-8 px-4 sm:px-6 max-w-lg mx-auto relative z-10">
      {/* Top Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex items-center justify-between"
      >
        <Link
          to={sessionCtx.isAuthenticated ? "/ecosystem" : "/welcome"}
          className="group inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-white/[0.12] transition-all"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back
        </Link>

        {sessionCtx.isAuthenticated && (
          <div className="text-[11px] font-semibold text-primary uppercase tracking-wider bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
            Authenticated
          </div>
        )}
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center my-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="glass-panel border border-white/[0.08] p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-card relative overflow-hidden"
        >
          <div className="absolute -inset-10 bg-gradient-to-br from-primary/10 via-transparent to-transparent blur-xl pointer-events-none" />

          {/* Icon state header */}
          <div className="relative mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-primary/20 bg-primary/5 text-primary">
            {status === "verifying" || status === "claiming" ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : status === "success" || status === "claim-success" ? (
              <CheckCircle className="h-6 w-6 text-success" />
            ) : (
              <ShieldCheck className="h-6 w-6" />
            )}
          </div>

          <h1 className="font-display text-xl font-extrabold text-foreground tracking-tight sm:text-2xl text-center">
            Verify your NoskyTech product
          </h1>

          <p className="mt-2 text-xs text-muted-foreground leading-relaxed text-center">
            Scan the QR code on your product or enter the details manually to securely bind it to
            your account.
          </p>

          {/* Form / Operations */}
          <form onSubmit={handleVerify} className="mt-6 space-y-4 text-left">
            <div>
              <label className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Product UID
              </label>
              <input
                type="text"
                required
                disabled={status === "verifying" || status === "claiming"}
                value={productUid}
                onChange={(e) => {
                  setProductUid(e.target.value.toUpperCase());
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="e.g. NT-SW-2026-000001"
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#050914]/60 px-4 text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Activation Code
              </label>
              <input
                type="text"
                required
                disabled={status === "verifying" || status === "claiming"}
                value={activationCode}
                onChange={(e) => {
                  setActivationCode(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="e.g. 482917"
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#050914]/60 px-4 text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              />
            </div>

            {/* Error messaging */}
            {errorMsg && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* QR Scanner Error */}
            {qrScannerError && (
              <div className="flex items-start gap-2 rounded-xl border border-warning/20 bg-warning/5 p-3 text-xs text-warning">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{qrScannerError}</span>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="grid grid-cols-1 gap-2 pt-2">
              <button
                type="button"
                onClick={startScanner}
                disabled={status === "verifying" || status === "claiming"}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] text-xs font-bold tracking-wide text-foreground transition-all hover:bg-white/[0.05] hover:border-white/[0.12] disabled:opacity-50"
              >
                <QrCode className="h-4 w-4 text-primary" />
                Scan QR Code
              </button>

              <button
                type="submit"
                disabled={
                  status === "verifying" || status === "claiming" || !productUid || !activationCode
                }
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold tracking-wide text-primary-foreground transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50"
              >
                {status === "verifying" || status === "claiming" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {status === "claiming" ? "Claiming product..." : "Verifying product..."}
                  </>
                ) : (
                  "Verify Product"
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Full Screen Premium Scanner Overlay */}
      <AnimatePresence>
        {isQrScannerActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-4"
          >
            <div className="w-full max-w-md relative flex flex-col items-center">
              {/* Header */}
              <div className="w-full flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Camera className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-xs uppercase tracking-widest font-bold">
                    NoskyTech Lens
                  </span>
                </div>
                <button
                  onClick={handleCloseScanner}
                  className="p-2 rounded-full border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-all text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scan target container with framing */}
              <div className="relative w-72 h-72 rounded-3xl overflow-hidden border border-white/[0.08] shadow-card bg-black flex items-center justify-center">
                {/* HTML5 QR reader element inside */}
                <div id={qrRegionId} className="absolute inset-0 w-full h-full" />

                {/* Ambient breathing overlay borders */}
                <div className="absolute inset-4 border border-dashed border-primary/40 rounded-2xl pointer-events-none z-10" />

                {/* Glowing neon animated scan line */}
                <motion.div
                  animate={{ y: [0, 260, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_rgba(59,130,246,0.8)] pointer-events-none z-10"
                />
              </div>

              <p className="mt-8 text-xs text-muted-foreground text-center max-w-xs">
                Align the NoskyTech product QR code inside the frame to scan automatically.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-center text-[11px] text-muted-foreground/40"
      >
        © 2026 NoskyTech · Hardware Handshake Protocol
      </motion.div>
    </div>
  );
}
