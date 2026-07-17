import { motion } from "motion/react";
import { Cpu, Wifi, WifiOff, RefreshCw, Layers, ShieldCheck, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeviceHealthCardProps {
  deviceCode: string;
  online: boolean;
  desiredState: boolean;
  actualState: boolean;
  lastSeen?: string;
  realtimeOk: boolean;
}

export function DeviceHealthCard({
  deviceCode,
  online,
  desiredState,
  actualState,
  lastSeen,
  realtimeOk,
}: DeviceHealthCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0A1020]/40 p-5 sm:p-6 shadow-card hover:shadow-glow transition-all duration-300">

      {/* Outer Glow responsive to Online status */}
      <div
        className={cn(
          "absolute -right-16 -top-16 h-32 w-32 rounded-full blur-2xl opacity-10 pointer-events-none",
          online ? "bg-success" : "bg-destructive"
        )}
      />

      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Cpu className="h-4.5 w-4.5" />
          </span>
          <div>
            <h3 className="font-display text-sm font-bold tracking-widest text-foreground">
              DEVICE HEALTH
            </h3>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Realtime telemetry
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
            online
              ? "border-success/30 bg-success/15 text-success"
              : "border-destructive/30 bg-destructive/15 text-destructive"
          )}
        >
          {online ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Online
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              Offline
            </>
          )}
        </span>
      </div>

      {/* Elegant Telemetry Items (Rows without tables) */}
      <div className="space-y-3.5">

        {/* Device Code Row */}
        <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/[0.02] bg-white/[0.01]">
          <div className="flex items-center gap-2.5 min-w-0">
            <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs font-semibold text-muted-foreground">Device Identifier</span>
          </div>
          <span className="text-xs font-mono font-bold text-foreground bg-[#0F172A] border border-white/5 px-2 py-0.5 rounded-md">
            {deviceCode}
          </span>
        </div>

        {/* Cloud Connection Stream Status */}
        <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/[0.02] bg-white/[0.01]">
          <div className="flex items-center gap-2.5 min-w-0">
            {realtimeOk ? (
              <Wifi className="h-4 w-4 text-cyan-400 shrink-0" />
            ) : (
              <WifiOff className="h-4 w-4 text-warning shrink-0" />
            )}
            <span className="text-xs font-semibold text-muted-foreground">Signal Gateway</span>
          </div>
          <span
            className={cn(
              "text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border",
              realtimeOk
                ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-400"
                : "border-warning/25 bg-warning/10 text-warning"
            )}
          >
            {realtimeOk ? "Active Realtime" : "Polling Mode"}
          </span>
        </div>

        {/* Requested State Indicator */}
        <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/[0.02] bg-white/[0.01]">
          <div className="flex items-center gap-2.5 min-w-0">
            <RefreshCw className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs font-semibold text-muted-foreground">Requested State</span>
          </div>
          <span
            className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-md",
              desiredState ? "text-amber-400" : "text-muted-foreground"
            )}
          >
            {desiredState ? "ON COMMAND" : "OFF COMMAND"}
          </span>
        </div>

        {/* Confirmed State Indicator */}
        <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/[0.02] bg-white/[0.01]">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs font-semibold text-muted-foreground">Confirmed State</span>
          </div>
          <span
            className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-md",
              actualState ? "text-success" : "text-muted-foreground"
            )}
          >
            {actualState ? "CONFIRMED ON" : "CONFIRMED OFF"}
          </span>
        </div>

        {/* Secure Firmware Node */}
        <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/[0.02] bg-white/[0.01]">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldCheck className="h-4 w-4 text-success shrink-0" />
            <span className="text-xs font-semibold text-muted-foreground">Encryption Node</span>
          </div>
          <span className="text-[10px] font-bold text-success uppercase bg-success/5 px-2 py-0.5 rounded-md border border-success/15">
            SSL SHA-256
          </span>
        </div>

        {/* Last Seen timestamp */}
        {lastSeen && (
          <div className="flex items-center gap-2 pt-2.5 text-[10px] text-muted-foreground border-t border-white/5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Telemetry last updated: {lastSeen}</span>
          </div>
        )}

      </div>
    </div>
  );
}
export default DeviceHealthCard;
