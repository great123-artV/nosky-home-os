import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  CartesianGrid,
} from "recharts";
import {
  Zap,
  Thermometer,
  ShieldCheck,
  Cpu,
  Lightbulb,
  Lock,
  Camera,
  Wind,
  Music,
  ArrowRight,
} from "lucide-react";

import { PageHeader, StatCard, GlassCard } from "@/components/primitives";
import { energyByDay, rooms } from "@/lib/home-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Nosky HomeOS" },
      { name: "description", content: "Your home at a glance — energy, climate, security and devices in one premium control center." },
    ],
  }),
  component: Dashboard,
});

const scenes = [
  { name: "Good Morning", icon: Lightbulb, hint: "12 devices" },
  { name: "Away Mode", icon: Lock, hint: "Secure all" },
  { name: "Movie Night", icon: Music, hint: "Living Room" },
  { name: "Cool Down", icon: Wind, hint: "Climate −2°C" },
];

function Dashboard() {
  return (
    <div>
      <PageHeader
        title="Welcome home, Alex"
        subtitle="Everything is running smoothly across 6 rooms and 33 connected devices."
        action={
          <span className="inline-flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3.5 py-2 text-sm font-medium text-success">
            <ShieldCheck className="h-4 w-4" /> Home Secured
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index={0} label="Energy Today" value="24.6" unit="kWh" delta="−12%" icon={<Zap className="h-5 w-5" />} />
        <StatCard index={1} label="Avg. Temperature" value="22" unit="°C" delta="Stable" icon={<Thermometer className="h-5 w-5" />} />
        <StatCard index={2} label="Active Devices" value="17" unit="/ 33" delta="+3" icon={<Cpu className="h-5 w-5" />} />
        <StatCard index={3} label="Security Score" value="98" unit="%" delta="Optimal" icon={<ShieldCheck className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Energy & Solar</h2>
              <p className="text-sm text-muted-foreground">Weekly consumption vs. solar generation</p>
            </div>
            <span className="hidden gap-3 text-xs text-muted-foreground sm:flex">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Usage</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Solar</span>
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={energyByDay} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.19 256)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.62 0.19 256)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.74 0.19 149)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.74 0.19 149)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.4 0.03 260 / 0.2)" vertical={false} />
                <XAxis dataKey="day" stroke="oklch(0.7 0.03 258)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.24 0.038 264)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: "0.75rem",
                    color: "oklch(0.97 0.01 255)",
                  }}
                />
                <Area type="monotone" dataKey="usage" stroke="oklch(0.62 0.19 256)" strokeWidth={2.5} fill="url(#gUsage)" />
                <Area type="monotone" dataKey="solar" stroke="oklch(0.74 0.19 149)" strokeWidth={2.5} fill="url(#gSolar)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-foreground">Quick Scenes</h2>
          <p className="text-sm text-muted-foreground">One tap to set the mood</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {scenes.map((s, i) => (
              <motion.button
                key={s.name}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-background/30 p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/10"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <s.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{s.name}</span>
                  <span className="block text-xs text-muted-foreground">{s.hint}</span>
                </span>
              </motion.button>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Your Rooms</h2>
          <Link to="/rooms" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {rooms.slice(0, 6).map((room, i) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to="/rooms">
                <GlassCard hover className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{room.name}</span>
                    <span className="text-xs font-medium text-primary">{room.temp}°C</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {room.active} of {room.devices} active
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[image:var(--gradient-primary)]"
                      style={{ width: `${(room.active / room.devices) * 100}%` }}
                    />
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
