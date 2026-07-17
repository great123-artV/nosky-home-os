import { Clock, MessageSquare, Power, User, Sparkles, RefreshCw, Radio } from "lucide-react";
import { HistoryItem } from "@/cypher/types";
import { cn } from "@/lib/utils";

interface ActivityTimelineCardProps {
  deviceLastUpdated?: string;
  history: HistoryItem[];
}

export function ActivityTimelineCard({
  deviceLastUpdated,
  history,
}: ActivityTimelineCardProps) {

  // Aggregate authentic timeline logs
  const timelineEvents: {
    id: string;
    type: "device" | "voice" | "auth";
    icon: any;
    title: string;
    subtitle: string;
    timestamp: Date;
    colorClass: string;
  }[] = [];

  // 1. Device Realtime Events
  if (deviceLastUpdated) {
    timelineEvents.push({
      id: "device-update",
      type: "device",
      icon: Radio,
      title: "Device Telemetry Synced",
      subtitle: "Secure cloud state broadcast confirmed",
      timestamp: new Date(deviceLastUpdated),
      colorClass: "bg-success/15 text-success border-success/30",
    });
  }

  // 2. Cypher Interaction Events
  history.forEach((it) => {
    const isSuccess = it.status === "Completed" || it.status === "Answered";
    timelineEvents.push({
      id: `voice-${it.id}`,
      type: "voice",
      icon: isSuccess ? Sparkles : MessageSquare,
      title: `Cypher: ${it.command}`,
      subtitle: it.result,
      timestamp: new Date(it.timestamp),
      colorClass: isSuccess
        ? "bg-primary/15 text-primary border-primary/30"
        : "bg-destructive/15 text-destructive border-destructive/30",
    });
  });

  // Sort events chronologically (newest first)
  const sortedEvents = timelineEvents.sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0A1020]/40 p-5 sm:p-6 shadow-card hover:shadow-glow transition-all duration-300">

      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Clock className="h-4.5 w-4.5" />
          </span>
          <div>
            <h3 className="font-display text-sm font-bold tracking-widest text-foreground">
              RECENT ACTIVITY
            </h3>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              System transaction stream
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Timeline Stream or Elegant Empty State */}
      {sortedEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-white/[0.02] border border-white/5 text-muted-foreground">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">No recent transactions</p>
            <p className="text-[10px] text-muted-foreground">
              Trigger a bulb control or speak with Cypher to stream data
            </p>
          </div>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6">
          {/* Vertical connection line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-[1.5px] bg-gradient-to-b from-primary/30 via-white/5 to-transparent pointer-events-none" />

          {sortedEvents.slice(0, 5).map((ev) => {
            const Icon = ev.icon;
            return (
              <div key={ev.id} className="relative group">
                {/* Timeline node icon marker */}
                <div
                  className={cn(
                    "absolute -left-[21px] top-0.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border text-[10px] transition-transform duration-300 group-hover:scale-110",
                    ev.colorClass
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                {/* Event text blocks */}
                <div className="space-y-0.5 pl-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {ev.title}
                    </p>
                    <span className="text-[9px] font-medium text-muted-foreground">
                      {ev.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] leading-normal text-muted-foreground font-medium">
                    {ev.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default ActivityTimelineCard;
