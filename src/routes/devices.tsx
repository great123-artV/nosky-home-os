import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Lightbulb,
  Thermometer,
  Lock,
  LockOpen,
  Camera,
  Speaker,
  Blinds,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { PageHeader, GlassCard, Toggle } from "@/components/primitives";
import { devices as deviceData, type Device } from "@/lib/home-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/devices")({
  head: () => ({
    meta: [
      { title: "Devices — Nosky HomeOS" },
      { name: "description", content: "Control every connected device — lights, climate, locks, cameras and more from one panel." },
    ],
  }),
  component: DevicesPage,
});

const typeIcon: Record<Device["type"], LucideIcon> = {
  light: Lightbulb,
  climate: Thermometer,
  lock: Lock,
  camera: Camera,
  speaker: Speaker,
  blinds: Blinds,
  energy: Zap,
};

const filters = ["All", "Lights", "Climate", "Security", "Energy"] as const;
type Filter = (typeof filters)[number];

const filterMap: Record<Filter, Device["type"][] | null> = {
  All: null,
  Lights: ["light", "blinds"],
  Climate: ["climate"],
  Security: ["lock", "camera"],
  Energy: ["energy", "speaker"],
};

function DeviceCard({ device, index }: { device: Device; index: number }) {
  const [on, setOn] = useState(device.on);
  const Icon = on && device.type === "lock" ? LockOpen : typeIcon[device.type];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <GlassCard hover className={cn("p-5", on && "ring-1 ring-primary/30")}>
        <div className="flex items-start justify-between">
          <span
            className={cn(
              "grid h-12 w-12 place-items-center rounded-xl transition-colors",
              on ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <Toggle on={on} onChange={() => setOn((v) => !v)} label={`Toggle ${device.name}`} />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-foreground">{device.name}</h3>
        <p className="text-xs text-muted-foreground">{device.room}</p>

        {device.value !== undefined ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Level</span>
              <span className="font-semibold text-foreground">
                {device.value}
                {device.unit}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", on ? "bg-[image:var(--gradient-primary)]" : "bg-muted-foreground/40")}
                style={{ width: `${device.value}%` }}
              />
            </div>
          </div>
        ) : (
          <p className={cn("mt-4 text-xs font-medium", on ? "text-success" : "text-muted-foreground")}>
            {on ? "Online · Active" : "Standby"}
          </p>
        )}
      </GlassCard>
    </motion.div>
  );
}

function DevicesPage() {
  const [active, setActive] = useState<Filter>("All");
  const list = useMemo(() => {
    const types = filterMap[active];
    return types ? deviceData.filter((d) => types.includes(d.type)) : deviceData;
  }, [active]);

  return (
    <div>
      <PageHeader
        title="Device Control"
        subtitle={`${deviceData.length} connected devices across your home.`}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-all",
              active === f
                ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-soft"
                : "border border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((d, i) => (
          <DeviceCard key={d.id} device={d} index={i} />
        ))}
      </div>
    </div>
  );
}
