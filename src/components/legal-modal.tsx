import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Copy, Mail, Check } from "lucide-react";
import { legalDocs, type LegalDoc } from "@/lib/legal";

export function LegalModal({
  docId,
  onClose,
}: {
  docId: LegalDoc["id"] | null;
  onClose: () => void;
}) {
  const doc = docId ? legalDocs[docId] : null;

  return (
    <AnimatePresence>
      {doc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong relative flex h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/10 sm:h-[86vh] sm:rounded-2xl"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-background/60 px-5 py-4 backdrop-blur-xl">
              <div className="min-w-0">
                <h2 className="truncate font-display text-base font-bold text-foreground sm:text-lg">
                  {doc.title}
                </h2>
                {doc.effective && (
                  <p className="text-[11px] text-muted-foreground">Effective {doc.effective}</p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-foreground transition hover:bg-accent cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
              <div className="mx-auto max-w-prose space-y-6">
                {doc.sections.map((s, i) => (
                  <section key={i}>
                    {s.heading && (
                      <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-primary">
                        {s.heading}
                      </h3>
                    )}
                    <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-foreground/85">
                      {s.body}
                    </p>
                  </section>
                ))}
                <p className="pt-4 text-center text-[11px] text-muted-foreground">
                  © 2026 NoskyTech. All rights reserved.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SecurityModal({
  isOpen,
  onClose,
  onOpenPrivacy,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrivacy: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong relative flex h-[70vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 sm:h-auto sm:rounded-2xl"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-background/60 px-5 py-4 backdrop-blur-xl">
              <div className="min-w-0">
                <h2 className="truncate font-display text-base font-bold text-foreground sm:text-lg">
                  System Security Summary
                </h2>
                <p className="text-[11px] text-muted-foreground">SMART WATT Shield</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-foreground transition hover:bg-accent cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
              <div className="space-y-4 text-sm text-foreground/85 leading-relaxed">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider text-primary">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
                    Layered Protection Active
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                    <li>Authentication active via secure tokens.</li>
                    <li>Supabase Row Level Security (RLS) is fully enforced.</li>
                    <li>Secure SSL cloud connection with AES-256 encryption.</li>
                    <li>Signed-in session status is validated in realtime.</li>
                  </ul>
                </div>
                <p>
                  SMART WATT uses layered security controls, but no internet-connected system can guarantee complete security.
                </p>
                <p className="text-xs text-muted-foreground">
                  By controlling devices on SMART WATT, please ensure your local Wi-Fi router utilizes secure, non-default credentials and updated WPA2/WPA3 protocols.
                </p>
                <div className="pt-4 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPrivacy();
                    }}
                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                  >
                    Read Privacy Policy
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CloudAuthModal({
  isOpen,
  onClose,
  onOpenPrivacy,
  onOpenTerms,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong relative flex h-[70vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 sm:h-auto sm:rounded-2xl"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-background/60 px-5 py-4 backdrop-blur-xl">
              <div className="min-w-0">
                <h2 className="truncate font-display text-base font-bold text-foreground sm:text-lg">
                  Secure Cloud Authentication
                </h2>
                <p className="text-[11px] text-muted-foreground">Powered by Supabase Cloud</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-foreground transition hover:bg-accent cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
              <div className="space-y-4 text-sm text-foreground/85 leading-relaxed">
                <p>
                  SMART WATT utilizes Supabase as its authentication and session management provider.
                </p>
                <p>
                  All passwords entered during sign-in are safely transmitted using secure cryptographic protocols. Raw passwords are never visible to and are not stored by the SMART WATT app or NoskyTech.
                </p>
                <p className="text-xs text-muted-foreground">
                  Learn more by visiting our legal policies:
                </p>
                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPrivacy();
                    }}
                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenTerms();
                    }}
                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                  >
                    Terms of Use
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const email = "noskytech1@gmail.com";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong relative flex h-[65vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-white/10 sm:h-auto sm:rounded-2xl"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-background/60 px-5 py-4 backdrop-blur-xl">
              <div className="min-w-0">
                <h2 className="truncate font-display text-base font-bold text-foreground sm:text-lg">
                  Reset Password
                </h2>
                <p className="text-[11px] text-muted-foreground">SMART WATT Support</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-foreground transition hover:bg-accent cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
              <div className="space-y-5 text-sm text-foreground/85 leading-relaxed">
                <p>
                  Password recovery is being prepared. Contact NoskyTech support for assistance.
                </p>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-background/40 p-3.5">
                  <span className="truncate font-mono text-xs text-foreground/90">{email}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/50 hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      title="Copy email to clipboard"
                    >
                      {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <a
                      href={`mailto:${email}?subject=SMART WATT Password Reset Request`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/50 hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      title="Open Email Client"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button
                    onClick={onClose}
                    className="h-10 rounded-xl border border-border bg-background/40 px-5 text-xs font-semibold hover:bg-accent cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
