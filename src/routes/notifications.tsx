import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { CheckCircle2, AlertTriangle, ShieldAlert, Info, Check } from "lucide-react";

import { PageHeader, GlassCard } from "@/components/primitives";
import { notifications as seed, type Notification } from "@/lib/home-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Nosky HomeOS" },
      { name: "description", content: "Stay informed with real-time alerts from across your smart home." },
    ],
  }),
  component: NotificationsPage,
});

const meta = {
  success: { icon: CheckCircle2, cls: "text-success bg-success/15" },
  warning: { icon: AlertTriangle, cls: "text-warning bg-warning/15" },
  alert: { icon: ShieldAlert, cls: "text-destructive bg-destructive/15" },
  info: { icon: Info, cls: "text-primary bg-primary/15" },
} as const;

function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>(seed);
  const unread = items.filter((n) => !n.read).length;

  const markAll = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  const toggle = (id: string) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `You have ${unread} unread alerts.` : "You're all caught up."}
        action={
          <button
            onClick={markAll}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Check className="h-4 w-4" /> Mark all read
          </button>
        }
      />

      <div className="mx-auto max-w-3xl space-y-3">
        {items.map((n, i) => {
          const m = meta[n.level];
          return (
            <motion.button
              key={n.id}
              onClick={() => toggle(n.id)}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="block w-full text-left"
            >
              <GlassCard
                className={cn(
                  "flex items-start gap-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-soft",
                  !n.read && "ring-1 ring-primary/30",
                )}
              >
                <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", m.cls)}>
                  <m.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="truncate text-sm font-semibold text-foreground">{n.title}</h3>
                    <span className="shrink-0 text-xs text-muted-foreground">{n.time}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                </div>
                {!n.read && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
              </GlassCard>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
