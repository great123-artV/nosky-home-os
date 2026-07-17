import { Volume2, VolumeX, Mic, Shield } from "lucide-react";
import { CypherSettings } from "../types";
import { cypherSettingsService } from "../settings/settingsService";
import { Toggle } from "@/components/primitives";
import { Slider } from "@/components/ui/slider";

export function QuickSettings({ settings }: { settings: CypherSettings }) {
  const update = (updated: Partial<CypherSettings>) => {
    cypherSettingsService.saveSettings(updated);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-white/5 bg-background/20 p-4">
      <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
        <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Quick Controls
        </h3>
        <span className="rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
          SYS SYNCED
        </span>
      </div>

      {/* Always-On Listening Switch */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Mic className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs font-semibold text-foreground">Always-On Listening</p>
            <p className="text-[10px] text-muted-foreground">
              Detect wake phrase: "{settings.wakePhrase}"
            </p>
          </div>
        </div>
        <Toggle
          on={settings.alwaysOnListening}
          onChange={() => {
            const nextMode = !settings.alwaysOnListening;
            update({
              alwaysOnListening: nextMode,
              listeningMode: nextMode ? "always_on" : "push_to_talk",
            });
          }}
          label="Always-On Listening"
        />
      </div>

      {/* Voice Responses (Mute) Switch */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {settings.voiceResponses ? (
            <Volume2 className="h-4 w-4 text-primary" />
          ) : (
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          )}
          <div>
            <p className="text-xs font-semibold text-foreground">Voice Responses</p>
            <p className="text-[10px] text-muted-foreground">Hear confirmation from Cypher</p>
          </div>
        </div>
        <Toggle
          on={settings.voiceResponses}
          onChange={() => update({ voiceResponses: !settings.voiceResponses })}
          label="Voice Responses"
        />
      </div>

      {/* Volume Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="font-semibold">Volume</span>
          <span>{Math.round(settings.voiceVolume * 100)}%</span>
        </div>
        <div className="flex items-center gap-3">
          <VolumeX className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <Slider
            value={[settings.voiceVolume * 100]}
            min={0}
            max={100}
            step={5}
            onValueChange={(val) => update({ voiceVolume: val[0] / 100 })}
            className="flex-1 py-1"
          />
          <Volume2 className="h-3.5 w-3.5 shrink-0 text-primary" />
        </div>
      </div>
    </div>
  );
}
export default QuickSettings;
