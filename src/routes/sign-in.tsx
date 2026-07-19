import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { motion } from "motion/react";
import { SignIn } from "@/components/SignIn";
import { LegalModal } from "@/components/legal-modal";

export const Route = createFileRoute("/sign-in")({
  ssr: false,
  component: SignInScreen,
});

function SignInScreen() {
  const navigate = useNavigate();
  const [legal, setLegal] = useState<"terms" | "privacy" | null>(null);

  const handleSuccess = () => {
    navigate({ to: "/ecosystem" });
  };

  return (
    <div className="flex min-h-[80vh] flex-col justify-between py-6 px-4 sm:px-6">
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
        <SignIn
          onLegal={(docId) => setLegal(docId)}
          onSuccess={handleSuccess}
        />
      </div>

      {/* Legal documents Modal */}
      <LegalModal docId={legal} onClose={() => setLegal(null)} />
    </div>
  );
}
