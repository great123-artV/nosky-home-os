import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Plus, Thermometer, Lightbulb, Cpu, Snowflake, Flame, Sun } from "lucide-react";

import { PageHeader, GlassCard, Toggle } from "@/components/primitives";
import { rooms as roomData, type Room } from "@/lib/home-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rooms")({
  head: () => ({
    meta: [
      { title: "Rooms — Nosky HomeOS" },
      { name: "description", content: "Manage every room in your home — climate, lighting and active devices at a glance." },
    ],
  }),
  component: RoomsPage,
});

const statusMeta: Record<Room["status"], { label: string; icon: typeof Sun; cls: string }> = {
  comfortable: { label: "Comfortable", icon: Sun, cls: "text-success bg-success/15" },
  cooling: { label: "Cooling", icon: Snowflake, cls: "text-primary bg-primary/15" },
  heating: { label: "Heating", icon: Flame, cls: "text-warning bg-warning/15" },
};

function RoomCard({ room, index }: { room: Room; index: number }) {
  const [on, setOn] = useState(room.active > 0);
  const s = statusMeta[room.status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <GlassCard hover className="overflow-hidden p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{room.name}</h3>
            <span className={cn("mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", s.cls)}>
              <s.icon className="h-3.5 w-3.5" /> {s.label}
            </span>
          </div>
          <Toggle on={on} onChange={() => setOn((v) => !v)} label={`Toggle ${room.name}`} />
        </div>

        <div className="my-6 flex items-end gap-1">
          <span className="font-display text-5xl font-bold text-foreground">{room.temp}</span>
          <span className="pb-1.5 text-xl font-medium text-muted-foreground">°C</span>
        </div>

        <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
          <Stat icon={<Cpu className="h-4 w-4" />} label="Devices" value={`${room.devices}`} />
          <Stat icon={<Lightbulb className="h-4 w-4" />} label="Active" value={`${room.active}`} />
          <Stat icon={<Thermometer className="h-4 w-4" />} label="Target" value={`${room.temp}°`} />
        </div>
      </GlassCard>
    </motion.div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-background/30 py-3">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

function RoomsPage() {
  return (
    <div>
      <PageHeader
        title="Room Management"
        subtitle="Control climate, lighting and devices across every space."
        action={
          <button className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]">
            <Plus className="h-4 w-4" /> Add Room
          </button>
        }
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {roomData.map((room, i) => (
          <RoomCard key={room.id} room={room} index={i} />
        ))}
      </div>
    </div>
  );
}
