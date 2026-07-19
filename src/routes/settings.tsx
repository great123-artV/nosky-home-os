import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  VolumeX,
  Loader2,
  FileText,
  BookOpen,
  Info,
  Zap,
  MicOff,
  History,
  Trash2,
  Sparkles,
  Sliders,
} from "lucide-react";

import { supabase, supabaseConfigured } from "@/lib/supabase";
import { Toggle } from "@/components/primitives";
import { LegalModal } from "@/components/legal-modal";
import { cn } from "@/lib/utils";
import type { LegalDoc } from "@/lib/legal";

// Cypher & Session imports
import { useSessionContext } from "@/cypher/context/SessionContext";
import { CypherSettings, ListeningMode } from "@/cypher/types";
import { cypherSettingsService } from "@/cypher/settings/settingsService";
import { cypherHistoryService } from "@/cypher/history/historyService";
import { elevenLabsSpeechService } from "@/cypher/services/elevenLabsSpeechService";
import { Slider } from "@/components/ui/slider";
import { InstallPwaButton } from "@/components/install-pwa";

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
  const sessionCtx = useSessionContext();
  const [legal, setLegal] = useState<LegalDoc["id"] | null>(null);

  // Cypher integrated configuration state
  const [cypherSettings, setCypherSettings] = useState<CypherSettings>(() =>
    cypherSettingsService.getSettings(),
  );

  const [theme, setTheme] = useLocalPref("sw.theme", "dark");

  const [elevenLabsStatus, setElevenLabsStatus] = useState<{
    configured: boolean;
    voiceId: string;
    modelId: string;
    loading: boolean;
  }>({
    configured: false,
    voiceId: "",
    modelId: "",
    loading: true,
  });

  useEffect(() => {
    const unsub = cypherSettingsService.subscribe(setCypherSettings);
    return () => unsub();
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/public/cypher-tts")
      .then((res) => {
        if (!res.ok) throw new Error("Status check failed");
        return res.json() as Promise<{ configured: boolean; voiceId: string; modelId: string }>;
      })
      .then((data) => {
        if (active) {
          setElevenLabsStatus({
            configured: data.configured,
            voiceId: data.voiceId,
            modelId: data.modelId,
            loading: false,
          });
        }
      })
      .catch((err) => {
        console.warn("[Settings] ElevenLabs status fetch failed", err);
        if (active) {
          setElevenLabsStatus({
            configured: false,
            voiceId: "",
            modelId: "",
            loading: false,
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const updateCypher = (val: Partial<CypherSettings>) => {
    cypherSettingsService.saveSettings(val);
  };

  if (sessionCtx.authStatus === "initializing") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!sessionCtx.isAuthenticated) {
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

  const email = sessionCtx.user?.email ?? "—";

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            SMART WATT
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Legal documents effective from July 2026.
          </p>
        </div>

        {/* Live / Simulation switch in settings */}
        <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-background/40 p-1.5">
          <button
            onClick={() => sessionCtx.setSimulationMode(false)}
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-all",
              !sessionCtx.simulationMode ? "bg-primary text-primary-foreground font-bold shadow-glow" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Live Mode
          </button>
          <button
            onClick={() => sessionCtx.setSimulationMode(true)}
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-all",
              sessionCtx.simulationMode ? "bg-amber-500 text-black font-bold shadow-glow" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Simulation
          </button>
        </div>
      </header>

      {/* ACCOUNT */}
      <Section title="Account">
        <Row
          icon={<UserIcon className="h-5 w-5" />}
          label={email}
          desc="Authenticated · SMART WATT session"
        />
        <div className="p-4 flex items-center justify-between gap-3 border-t border-white/[0.04]">
          <div>
            <p className="text-sm font-semibold text-foreground">Install as an app</p>
            <p className="text-[11px] text-muted-foreground">
              Add SMART WATT to your Home Screen for a native-app experience.
            </p>
          </div>
          <InstallPwaButton variant="primary" label="Install" />
        </div>
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
          desc={`Device code · ${sessionCtx.deviceId || "SW-0001"} (read-only)`}
        />
        <Row
          icon={<Cpu className="h-5 w-5" />}
          label={sessionCtx.deviceOnline ? "Online" : "Offline"}
          desc={`Confirmed state · ${sessionCtx.actualState ? "ON" : "OFF"}`}
        />
        <Row
          icon={<Info className="h-5 w-5" />}
          label={sessionCtx.lastUpdated ? new Date(sessionCtx.lastUpdated).toLocaleString() : "—"}
          desc="Last update"
        />
        <Row
          icon={<Info className="h-5 w-5" />}
          label="App version 1.0.0"
          desc="SMART WATT · Powered by NoskyTech"
        />
      </Section>

      {/* CYPHER VOICE ASSISTANT */}
      <Section title="Cypher voice assistant">
        {/* Listening Mode Option */}
        <div className="flex flex-col gap-3 px-5 py-4">
          <div className="flex items-center gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Mic className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Listening Mode</p>
              <p className="truncate text-xs text-muted-foreground">
                Choose how Cypher interacts with your voice
              </p>
            </div>
            <select
              value={cypherSettings.listeningMode}
              onChange={(e) => {
                const mode = e.target.value as ListeningMode;
                updateCypher({
                  listeningMode: mode,
                  alwaysOnListening: mode === "always_on",
                });
              }}
              className="h-9 rounded-lg border border-border bg-background/40 px-2 text-xs text-foreground focus:border-primary/60 focus:outline-none"
            >
              <option value="push_to_talk">Push-to-Talk</option>
              <option value="always_on">Always-On Listening</option>
            </select>
          </div>
        </div>

        {/* Wake Phrase Option */}
        {cypherSettings.listeningMode === "always_on" && (
          <div className="flex items-center gap-4 px-5 py-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Wake Phrase</p>
              <p className="truncate text-xs text-muted-foreground">
                Words that activate Always-On Cypher
              </p>
            </div>
            <select
              value={cypherSettings.wakePhrase}
              onChange={(e) => updateCypher({ wakePhrase: e.target.value as any })}
              className="h-9 rounded-lg border border-border bg-background/40 px-2 text-xs text-foreground focus:border-primary/60 focus:outline-none"
            >
              <option value="Hey Cypher">Hey Cypher</option>
              <option value="Cypher">Cypher</option>
            </select>
          </div>
        )}

        {/* Voice System Details & Status Card */}
        <div className="mx-5 my-4 rounded-xl border border-white/5 bg-background/20 p-4 space-y-3.5">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Voice System Status
            </h3>
            {elevenLabsStatus.loading ? (
              <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin text-primary" /> Checking...
              </span>
            ) : elevenLabsStatus.configured && sessionCtx.networkOnline ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                Offline
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
            <div>
              <p className="text-muted-foreground font-medium">Voice Provider</p>
              <p className="text-foreground font-semibold mt-0.5">
                {elevenLabsStatus.loading
                  ? "—"
                  : elevenLabsStatus.configured && sessionCtx.networkOnline
                    ? "ElevenLabs (Premium)"
                    : "Web Speech API (Fallback)"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Premium Voice</p>
              <p className="text-foreground font-semibold mt-0.5">
                {elevenLabsStatus.loading
                  ? "—"
                  : elevenLabsStatus.configured && sessionCtx.networkOnline
                    ? "Sarah (Premium Default)"
                    : "Device Default"}
              </p>
            </div>
            <div className="col-span-2 border-t border-white/5 pt-2.5">
              <p className="text-muted-foreground font-medium">Voice Status</p>
              {elevenLabsStatus.loading ? (
                <p className="text-muted-foreground mt-0.5">Determining status...</p>
              ) : elevenLabsStatus.configured && sessionCtx.networkOnline ? (
                cypherSettings.browserVoiceFallback ? (
                  <p className="text-amber-400 font-semibold mt-0.5">
                    Using device voice (fallback forced by user)
                  </p>
                ) : (
                  <p className="text-emerald-400 font-semibold mt-0.5">
                    Premium voice active
                  </p>
                )
              ) : (
                <p className="text-amber-400 font-semibold mt-0.5">
                  Premium voice unavailable. Using device voice.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Premium Voice Selector (Future-ready) */}
        <div className="flex flex-col gap-3 px-5 py-4">
          <div className="flex items-center gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Premium Voice Profile</p>
              <p className="truncate text-xs text-muted-foreground">
                Select your preferred premium voice style
              </p>
            </div>
            <select
              value="premium_default"
              disabled
              className="h-9 rounded-lg border border-border bg-background/40 px-2 text-xs text-foreground focus:border-primary/60 focus:outline-none opacity-80"
            >
              <option value="premium_default">Premium (Default)</option>
              <option value="premium_futuristic" disabled>Futuristic (Coming Soon)</option>
              <option value="premium_warm" disabled>Warm Male (Coming Soon)</option>
            </select>
          </div>
        </div>

        {/* Spoken feedback (Mute Cypher) */}
        <Row
          icon={<Volume2 className="h-5 w-5" />}
          label="Mute Cypher"
          desc="Enable or disable voice responses from Cypher"
          control={
            <Toggle
              on={!cypherSettings.voiceResponses}
              onChange={() => updateCypher({ voiceResponses: !cypherSettings.voiceResponses })}
              label="Mute Cypher"
            />
          }
        />

        {/* Play Startup Sound */}
        <Row
          icon={<Volume2 className="h-5 w-5" />}
          label="Play startup sound"
          desc="Play a premium chime sound upon activation"
          control={
            <Toggle
              on={cypherSettings.startupSound}
              onChange={() => updateCypher({ startupSound: !cypherSettings.startupSound })}
              label="Play startup sound"
            />
          }
        />

        {/* Browser Voice Fallback (ElevenLabs proxy vs Web Speech API) */}
        <Row
          icon={<Globe className="h-5 w-5" />}
          label="Use Browser Voice (Fallback)"
          desc="Force local SpeechSynthesis voice instead of ElevenLabs proxy"
          control={
            <Toggle
              on={cypherSettings.browserVoiceFallback}
              onChange={() =>
                updateCypher({ browserVoiceFallback: !cypherSettings.browserVoiceFallback })
              }
              label="Use Browser Voice (Fallback)"
            />
          }
        />

        {/* Volume controls */}
        <div className="flex flex-col gap-2.5 px-5 py-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Voice Volume</span>
            <span>{Math.round(cypherSettings.voiceVolume * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <VolumeX className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Slider
              value={[cypherSettings.voiceVolume * 100]}
              min={0}
              max={100}
              step={5}
              onValueChange={(val) => updateCypher({ voiceVolume: val[0] / 100 })}
              className="flex-1 py-1"
            />
            <Volume2 className="h-4 w-4 shrink-0 text-primary" />
          </div>
        </div>

        {/* Speech Rate controls */}
        <div className="flex flex-col gap-2.5 px-5 py-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Speech Speed</span>
            <span>{cypherSettings.speechRate.toFixed(1)}x</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground">Slow</span>
            <Slider
              value={[cypherSettings.speechRate * 100]}
              min={50}
              max={200}
              step={10}
              onValueChange={(val) => updateCypher({ speechRate: val[0] / 100 })}
              className="flex-1 py-1"
            />
            <span className="text-[10px] text-primary">Fast</span>
          </div>
        </div>

        {/* Clear History */}
        <Row
          icon={<History className="h-5 w-5" />}
          label="Clear conversation history"
          desc="Delete all cached transcripts and voice actions"
          onClick={() => {
            cypherHistoryService.clearHistory();
          }}
        />

        <Row
          icon={sessionCtx.microphonePermission === "denied" ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          label={`Microphone permission · ${sessionCtx.microphonePermission}`}
          desc="Managed securely by your browser settings"
        />

        <Row
          icon={<Volume2 className="h-5 w-5" />}
          label="Test Voice"
          desc="Play a quick audio test using chosen path"
          onClick={() => {
            void elevenLabsSpeechService.speak(
              "This is Cypher, your premium NoskyTech voice assistant.",
              () => {},
            );
          }}
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
