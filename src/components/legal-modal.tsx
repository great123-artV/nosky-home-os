import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
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
                  <p className="text-[11px] text-muted-foreground">
                    Effective {doc.effective}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-foreground transition hover:bg-accent"
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
