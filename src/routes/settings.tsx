import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  User as UserIcon,
  LogOut,
  Cpu,
  Shield,
  Mail,
  Globe,
  ChevronRight,
  Mic,
  Volume2,
  Loader2,
  FileText,
  BookOpen,
  Info,
  Zap,
  MicOff,
} from "lucide-react";

import { supabase, supabaseConfigured, type SmartWattDevice } from "@/lib/supabase";
import { Toggle } from "@/components/primitives";
import { LegalModal } from "@/components/legal-modal";
import { speak, getSpeechRecognitionCtor } from "@/lib/cypher";
import { cn } from "@/lib/utils";
import type { LegalDoc } from "@/lib/legal";

export const Route = createFileRoute("/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Settings — SMART WATT" },
      {
        name: "description",
        content:
          "Manage your SMART WATT account, device information, Cypher voice preferences and legal documents.",
      },
    ],
  }),
  component: SettingsPage,
});

const DEVICE_CODE = "SW-0001";

function useLocalPref(key: string, defaultValue: string) {
  const [v, setV] = useState(defaultValue);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) setV(stored);
    } catch {
      /* noop */
    }
  }, [key]);
  function update(next: string) {
    setV(next);
    try {
      localStorage.setItem(key, next);
    } catch {
      /* noop */
    }
  }
  return [v, update] as const;
}

function SettingsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [device, setDevice] = useState<SmartWattDevice | null>(null);
  const [legal, setLegal] = useState<LegalDoc["id"] | null>(null);
  const [micPerm, setMicPerm] = useState<string>("unknown");

  const [voice, setVoice] = useLocalPref("sw.voice", "on");
  const [speech, setSpeech] = useLocalPref("sw.speech", "on");
  const [lang, setLang] = useLocalPref("sw.lang", "en-NG");
  const [theme, setTheme] = useLocalPref("sw.theme", "dark");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session || !supabaseConfigured) return;
    let channel: RealtimeChannel | null = null;
    (async () => {
      const { data } = await supabase
        .from("smart_watt_devices")
        .select("*")
        .eq("device_code", DEVICE_CODE)
        .maybeSingle();
      if (data) setDevice(data as SmartWattDevice);
    })();
    channel = supabase
      .channel(`smart_watt_settings_${DEVICE_CODE}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "smart_watt_devices",
          filter: `device_code=eq.${DEVICE_CODE}`,
        },
        (payload) => {
          const next = payload.new as SmartWattDevice | undefined;
          if (next) setDevice(next);
        },
      )
      .subscribe();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("permissions" in navigator)) return;
    try {
      const perms = navigator.permissions as unknown as {
        query: (d: { name: string }) => Promise<{ state: string; onchange: (() => void) | null }>;
      };
      perms
        .query({ name: "microphone" })
        .then((p) => {
          setMicPerm(p.state);
          p.onchange = () => setMicPerm(p.state);
        })
        .catch(() => setMicPerm("unknown"));
    } catch {
      setMicPerm("unknown");
    }
  }, []);

  if (!authReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="glass rounded-2xl border border-white/10 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Please{" "}
          <Link to="/" className="text-primary hover:underline">
            sign in
          </Link>{" "}
          to view Settings.
        </p>
      </div>
    );
  }

  const email = session.user.email ?? "—";
  const supportsVoice = !!getSpeechRecognitionCtor();

  return (
    <div className="space-y-5">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          SMART WATT
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Legal documents effective from July 2026.
        </p>
      </header>

      {/* ACCOUNT */}
      <Section title="Account">
        <Row
          icon={<UserIcon className="h-5 w-5" />}
          label={email}
          desc="Authenticated · SMART WATT session"
        />
        <Row
          icon={<LogOut className="h-5 w-5" />}
          label="Sign out"
          desc="End this session on this device"
          onClick={() => supabase.auth.signOut()}
          destructive
        />
      </Section>

      {/* DEVICE */}
      <Section title="Device information">
        <Row
          icon={<Zap className="h-5 w-5" />}
          label="BULB"
          desc={`Device code · ${DEVICE_CODE} (read-only)`}
        />
        <Row
          icon={<Cpu className="h-5 w-5" />}
          label={device?.online ? "Online" : "Offline"}
          desc={`Confirmed state · ${device?.actual_state ? "ON" : "OFF"}`}
        />
        <Row
          icon={<Info className="h-5 w-5" />}
          label={device?.updated_at ? new Date(device.updated_at).toLocaleString() : "—"}
          desc="Last update"
        />
        <Row
          icon={<Info className="h-5 w-5" />}
          label="App version 1.0.0"
          desc="SMART WATT · Powered by NoskyTech"
        />
      </Section>

      {/* CYPHER */}
      <Section title="Cypher voice assistant">
        <Row
          icon={<Mic className="h-5 w-5" />}
          label="Voice control"
          desc={
            supportsVoice ? "Enable Cypher microphone commands" : "Not supported in this browser"
          }
          control={
            <Toggle
              on={voice === "on" && supportsVoice}
              onChange={() => setVoice(voice === "on" ? "off" : "on")}
              label="Voice control"
            />
          }
        />
        <Row
          icon={<Volume2 className="h-5 w-5" />}
          label="Spoken feedback"
          desc="Cypher speaks confirmation and status"
          control={
            <Toggle
              on={speech === "on"}
              onChange={() => setSpeech(speech === "on" ? "off" : "on")}
              label="Spoken feedback"
            />
          }
        />
        <div className="flex items-center gap-4 px-5 py-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <Globe className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Recognition language</p>
            <p className="truncate text-xs text-muted-foreground">Preferred Cypher speech locale</p>
          </div>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background/40 px-2 text-xs text-foreground focus:border-primary/60 focus:outline-none"
          >
            <option value="en-NG">English (Nigeria)</option>
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
          </select>
        </div>
        <Row
          icon={micPerm === "denied" ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          label={`Microphone permission · ${micPerm}`}
          desc="Managed by your browser"
        />
        <Row
          icon={<Volume2 className="h-5 w-5" />}
          label="Test Cypher voice"
          desc="Play a short spoken sample"
          onClick={() => speak("This is Cypher, your Smart Watt voice assistant.", true)}
        />
      </Section>

      {/* APPEARANCE */}
      <Section title="Appearance">
        <div className="flex items-center gap-4 px-5 py-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <Shield className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Theme</p>
            <p className="truncate text-xs text-muted-foreground">
              Premium dark experience by default
            </p>
          </div>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background/40 px-2 text-xs text-foreground focus:border-primary/60 focus:outline-none"
          >
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
      </Section>

      {/* SUPPORT */}
      <Section title="Support">
        <Row
          icon={<Mail className="h-5 w-5" />}
          label="noskytech1@gmail.com"
          desc="NoskyTech support"
          href="mailto:noskytech1@gmail.com"
        />
        <Row
          icon={<Globe className="h-5 w-5" />}
          label="noskytech.vercel.app"
          desc="Visit NoskyTech online"
          href="https://noskytech.vercel.app"
          external
        />
      </Section>

      {/* LEGAL */}
      <Section title="Legal">
        <Row
          icon={<Shield className="h-5 w-5" />}
          label="Privacy Policy"
          desc="Effective July 2026"
          onClick={() => setLegal("privacy")}
        />
        <Row
          icon={<FileText className="h-5 w-5" />}
          label="Terms of Use"
          desc="Effective July 2026"
          onClick={() => setLegal("terms")}
        />
        <Row
          icon={<BookOpen className="h-5 w-5" />}
          label="Electrical Safety Notice"
          desc="Important safety information"
          onClick={() => setLegal("safety")}
        />
        <Row
          icon={<Info className="h-5 w-5" />}
          label="About SMART WATT"
          desc="Product information"
          onClick={() => setLegal("about")}
        />
      </Section>

      <footer className="pt-4 text-center text-[11px] text-muted-foreground">
        <p className="font-display text-sm font-bold tracking-widest text-foreground">SMART WATT</p>
        <p className="mt-1">Powered by NoskyTech</p>
        <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1">
          <button onClick={() => setLegal("privacy")} className="hover:text-foreground">
            Privacy Policy
          </button>
          <span>·</span>
          <button onClick={() => setLegal("terms")} className="hover:text-foreground">
            Terms of Use
          </button>
          <span>·</span>
          <button onClick={() => setLegal("safety")} className="hover:text-foreground">
            Electrical Safety
          </button>
          <span>·</span>
          <button onClick={() => setLegal("about")} className="hover:text-foreground">
            About
          </button>
          <span>·</span>
          <a href="mailto:noskytech1@gmail.com" className="hover:text-foreground">
            Contact
          </a>
        </div>
        <p className="mt-4">© 2026 NoskyTech. All rights reserved.</p>
      </footer>

      <LegalModal docId={legal} onClose={() => setLegal(null)} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass overflow-hidden rounded-2xl border border-white/10">
      <h2 className="px-5 pt-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <div className="mt-2 divide-y divide-white/5">{children}</div>
    </section>
  );
}

function Row({
  icon,
  label,
  desc,
  control,
  onClick,
  href,
  external,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  control?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  destructive?: boolean;
}) {
  const interactive = !!onClick || !!href;
  const content = (
    <>
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
          destructive ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p
          className={cn(
            "text-sm font-semibold",
            destructive ? "text-destructive" : "text-foreground",
          )}
        >
          {label}
        </p>
        {desc && <p className="truncate text-xs text-muted-foreground">{desc}</p>}
      </div>
      {control ?? (interactive ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : null)}
    </>
  );
  const className = cn(
    "flex w-full items-center gap-4 px-5 py-4 text-left transition-colors",
    interactive && "hover:bg-white/[0.03]",
  );
  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={className}
      >
        {content}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }
  return <div className={className}>{content}</div>;
}
