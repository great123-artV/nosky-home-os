import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { User, Bell, Shield, Wifi, Moon, Globe, Cpu, ChevronRight } from "lucide-react";

import { PageHeader, GlassCard, Toggle } from "@/components/primitives";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Nosky HomeOS" },
      { name: "description", content: "Manage your profile, automation, privacy and Nosky HomeOS preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingRow({
  icon,
  title,
  desc,
  control,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function SettingsPage() {
  const [auto, setAuto] = useState(true);
  const [notif, setNotif] = useState(true);
  const [eco, setEco] = useState(false);
  const [twoFa, setTwoFa] = useState(true);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Personalize Nosky HomeOS to fit how you live." />

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <span className="grid h-20 w-20 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-2xl font-bold text-primary-foreground shadow-glow">
              AR
            </span>
            <h3 className="mt-4 text-lg font-semibold text-foreground">Alex Rivera</h3>
            <p className="text-sm text-muted-foreground">alex@noskytech.com</p>
            <span className="mt-3 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success">
              Home Owner · Pro Plan
            </span>
            <button className="mt-5 w-full rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent">
              Edit Profile
            </button>
          </div>

          <div className="mt-6 space-y-2 border-t border-border pt-5">
            {["Hub: Nosky Core X2", "HomeOS v4.2.1", "33 devices paired"].map((t) => (
              <div key={t} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Cpu className="h-3.5 w-3.5 text-primary" /> {t}
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <h2 className="px-5 pt-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Preferences
            </h2>
            <div className="mt-2 divide-y divide-border">
              <SettingRow icon={<Cpu className="h-5 w-5" />} title="Smart Automation" desc="Let HomeOS optimize routines automatically" control={<Toggle on={auto} onChange={() => setAuto((v) => !v)} />} />
              <SettingRow icon={<Bell className="h-5 w-5" />} title="Push Notifications" desc="Alerts for security, energy and devices" control={<Toggle on={notif} onChange={() => setNotif((v) => !v)} />} />
              <SettingRow icon={<Moon className="h-5 w-5" />} title="Eco Mode" desc="Reduce standby power during off-hours" control={<Toggle on={eco} onChange={() => setEco((v) => !v)} />} />
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="px-5 pt-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Security & Network
            </h2>
            <div className="mt-2 divide-y divide-border">
              <SettingRow icon={<Shield className="h-5 w-5" />} title="Two-Factor Auth" desc="Extra protection for your account" control={<Toggle on={twoFa} onChange={() => setTwoFa((v) => !v)} />} />
              <SettingRow icon={<Wifi className="h-5 w-5" />} title="Network" desc="Nosky-Mesh · Connected · 1.2 Gbps" control={<ChevronRight className="h-4 w-4 text-muted-foreground" />} />
              <SettingRow icon={<User className="h-5 w-5" />} title="Household Members" desc="3 people · 2 admins" control={<ChevronRight className="h-4 w-4 text-muted-foreground" />} />
              <SettingRow icon={<Globe className="h-5 w-5" />} title="Language & Region" desc="English (US) · Metric units" control={<ChevronRight className="h-4 w-4 text-muted-foreground" />} />
            </div>
          </GlassCard>

          <p className="text-center text-xs text-muted-foreground">
            Nosky HomeOS · Powered by <span className="font-semibold text-foreground/80">Nosky Tech</span>
          </p>
        </div>
      </div>
    </div>
  );
}
