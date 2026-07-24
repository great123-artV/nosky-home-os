import { supabase, type SmartWattDevice, supabaseConfigured } from "@/lib/supabase";
import {
  DeviceTransport,
  DeviceStatus,
  RelayCommandResult,
  DeviceConnectionConfig,
  TransportMode,
} from "./deviceTransport";

import { RealtimeChannel } from "@supabase/supabase-js";

export class CloudTransport implements DeviceTransport {
  readonly mode: TransportMode = "cloud";
  private deviceId: string | null = null;
  private channel: RealtimeChannel | null = null;
  private callbacks: Set<(status: DeviceStatus) => void> = new Set();

  async connect(config: DeviceConnectionConfig): Promise<void> {
    this.deviceId = config.deviceId;
    this.setupRealtimeSubscription();
  }

  async disconnect(): Promise<void> {
    this.cleanupSubscription();
    this.deviceId = null;
    this.callbacks.clear();
  }

  async isAvailable(config: DeviceConnectionConfig): Promise<boolean> {
    if (!supabaseConfigured) return false;
    try {
      // Check if we can do a quick head/maybeSingle query to verify connection
      const { error } = await supabase
        .from("smart_watt_devices")
        .select("device_code")
        .eq("device_code", config.deviceId)
        .limit(1)
        .maybeSingle();

      return !error;
    } catch {
      return false;
    }
  }

  async getStatus(): Promise<DeviceStatus> {
    if (!this.deviceId) {
      throw new Error("CloudTransport is not connected to a device.");
    }

    const { data, error } = await supabase
      .from("smart_watt_devices")
      .select("*")
      .eq("device_code", this.deviceId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(`Device not found: ${this.deviceId}`);
    }

    return this.mapToDeviceStatus(data);
  }

  async setRelayState(state: boolean): Promise<RelayCommandResult> {
    if (!this.deviceId) {
      return { success: false, error: "CloudTransport is not connected to a device." };
    }

    try {
      const { error } = await supabase
        .from("smart_watt_devices")
        .update({ desired_state: state })
        .eq("device_code", this.deviceId);

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        state,
        transport: this.mode,
      };
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Unknown error sending cloud command";
      return {
        success: false,
        error: errMsg,
      };
    }
  }

  subscribe(callback: (status: DeviceStatus) => void): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  private setupRealtimeSubscription() {
    if (!this.deviceId || !supabaseConfigured) return;

    this.cleanupSubscription();

    this.channel = supabase
      .channel(`cloud_transport_${this.deviceId}_${Math.random().toString(36).substring(2, 9)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "smart_watt_devices",
          filter: `device_code=eq.${this.deviceId}`,
        },
        (payload) => {
          const raw = payload.new as SmartWattDevice | undefined;
          if (raw && raw.device_code === this.deviceId) {
            const status = this.mapToDeviceStatus(raw);
            this.callbacks.forEach((cb) => cb(status));
          }
        },
      )
      .subscribe();
  }

  private cleanupSubscription() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  private mapToDeviceStatus(row: Record<string, unknown>): DeviceStatus {
    return {
      deviceId: (row.device_code as string) || "unknown",
      relayState: (row.actual_state as boolean | null) ?? null,
      voltage: (row.voltage as number | null) ?? null,
      currentAmp: (row.current_amp as number | null) ?? null,
      powerWatts: (row.power_watts as number | null) ?? null,
      energyKwh: (row.energy_kwh as number | null) ?? null,
      connectionMode: (row.connection_mode as TransportMode) || this.mode,
      localIp: (row.local_ip as string | null) ?? null,
      wifiRssi: (row.wifi_rssi as number | null) ?? null,
      firmwareVersion: (row.firmware_version as string | null) ?? null,
      updatedAt: (row.updated_at as string) || new Date().toISOString(),
    };
  }
}
