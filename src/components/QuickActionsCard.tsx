import { Power, Mic, Cpu, RefreshCw, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsCardProps {
  on: boolean;
  online: boolean;
  onTurnOn: () => void;
  onTurnOff: () => void;
  onTriggerCypher: () => void;
  onTriggerRefresh: () => void;
  onNavigateSettings: () => void;
}

export function QuickActionsCard({
  on,
  online,
  onTurnOn,
  onTurnOff,
  onTriggerCypher,
  onTriggerRefresh,
  onNavigateSettings,
}: QuickActionsCardProps) {

  const actions = [
    {
      label: "Turn Bulb ON",
      desc: "Instant power trigger",
      icon: Power,
      onClick: onTurnOn,
      active: on && online,
      color: "hover:border-amber-500/50 hover:bg-amber-500/5 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] text-amber-500",
      disabled: !online,
    },
    {
      label: "Turn Bulb OFF",
      desc: "Instant shutdown",
      icon: Power,
      onClick: onTurnOff,
      active: !on && online,
      color: "hover:border-cyan-500/50 hover:bg-cyan-500/5 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] text-cyan-400",
      disabled: !online,
    },
    {
      label: "Ask Cypher AI",
      desc: "Trigger voice mode",
      icon: Mic,
      onClick: onTriggerCypher,
      color: "hover:border-primary/50 hover:bg-primary/5 hover:shadow-[0_0_15px_rgba(99,102,241,0.1)] text-primary",
      disabled: false,
    },
    {
      label: "Sync Cloud Status",
      desc: "Manual tele-pull",
      icon: RefreshCw,
      onClick: onTriggerRefresh,
      color: "hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] text-emerald-400",
      disabled: false,
    },
    {
      label: "System Settings",
      desc: "Device configuration",
      icon: Settings,
      onClick: onNavigateSettings,
      color: "hover:border-slate-400/50 hover:bg-slate-400/5 text-slate-300",
      disabled: false,
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0A1020]/40 p-5 sm:p-6 shadow-card hover:shadow-glow transition-all duration-300">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Cpu className="h-4.5 w-4.5" />
          </span>
          <div>
            <h3 className="font-display text-sm font-bold tracking-widest text-foreground">
              QUICK CONTROLS
            </h3>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Direct telemetry overrides
            </p>
          </div>
        </div>
      </div>

      {/* Button Layout Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {actions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <button
              key={idx}
              onClick={act.onClick}
              disabled={act.disabled}
              className={cn(
                "relative flex flex-col items-center justify-center p-4 rounded-xl border bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-300 text-center group shadow-sm focus:outline-none focus:ring-1 focus:ring-primary/40",
                act.disabled
                  ? "border-white/5 opacity-40 cursor-not-allowed"
                  : cn("border-white/10", act.color),
                act.active && "border-primary/45 bg-primary/5"
              )}
            >
              <div className="p-2.5 rounded-full bg-white/[0.02] border border-white/5 group-hover:scale-110 transition-transform duration-300 mb-2">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-foreground block tracking-tight">
                {act.label}
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                {act.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
export default QuickActionsCard;
