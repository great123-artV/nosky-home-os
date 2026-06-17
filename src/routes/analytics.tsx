import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingDown, Gauge, Leaf, DollarSign } from "lucide-react";

import { PageHeader, StatCard, GlassCard } from "@/components/primitives";
import { energyByDay, usageByHour } from "@/lib/home-data";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Nosky HomeOS" },
      { name: "description", content: "Deep insights into energy use, efficiency and device performance across your smart home." },
    ],
  }),
  component: AnalyticsPage,
});

const tooltipStyle = {
  background: "oklch(0.24 0.038 264)",
  border: "1px solid oklch(1 0 0 / 0.1)",
  borderRadius: "0.75rem",
  color: "oklch(0.97 0.01 255)",
};

const distribution = [
  { name: "Climate", value: 42, color: "oklch(0.62 0.19 256)" },
  { name: "Lighting", value: 21, color: "oklch(0.74 0.19 149)" },
  { name: "Appliances", value: 27, color: "oklch(0.7 0.16 250)" },
  { name: "Other", value: 10, color: "oklch(0.8 0.16 80)" },
];

function AnalyticsPage() {
  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Understand how your home consumes energy and performs over time."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index={0} label="Monthly Cost" value="$182" delta="−9%" icon={<DollarSign className="h-5 w-5" />} />
        <StatCard index={1} label="Efficiency" value="91" unit="%" delta="+4%" icon={<Gauge className="h-5 w-5" />} />
        <StatCard index={2} label="Carbon Saved" value="312" unit="kg" delta="+18%" icon={<Leaf className="h-5 w-5" />} />
        <StatCard index={3} label="Peak Reduction" value="23" unit="%" delta="Better" icon={<TrendingDown className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Daily Consumption</h2>
          <p className="text-sm text-muted-foreground">Energy drawn per day (kWh)</p>
          <div className="mt-5 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyByDay} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.4 0.03 260 / 0.2)" vertical={false} />
                <XAxis dataKey="day" stroke="oklch(0.7 0.03 258)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.7 0.03 258)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(0.62 0.19 256 / 0.08)" }} />
                <Bar dataKey="usage" radius={[8, 8, 0, 0]} fill="oklch(0.62 0.19 256)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-foreground">Energy Mix</h2>
          <p className="text-sm text-muted-foreground">By category</p>
          <div className="mt-2 h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={3} stroke="none">
                  {distribution.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2">
            {distribution.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </span>
                <span className="font-semibold text-foreground">{d.value}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="mt-6 p-6">
        <h2 className="text-lg font-semibold text-foreground">Load Curve</h2>
        <p className="text-sm text-muted-foreground">Average power load throughout the day (%)</p>
        <div className="mt-5 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={usageByHour} margin={{ left: -20, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.4 0.03 260 / 0.2)" vertical={false} />
              <XAxis dataKey="hour" stroke="oklch(0.7 0.03 258)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.7 0.03 258)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="load" stroke="oklch(0.74 0.19 149)" strokeWidth={3} dot={{ r: 4, fill: "oklch(0.74 0.19 149)" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
