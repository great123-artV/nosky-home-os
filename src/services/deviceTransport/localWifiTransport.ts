import {
  DeviceTransport,
  DeviceStatus,
  RelayCommandResult,
  DeviceConnectionConfig,
  TransportMode,
} from "./deviceTransport";

const TIMEOUT_MS = 2000; // 2 seconds timeout

export class LocalWifiTransport implements DeviceTransport {
  readonly mode: TransportMode = "local-wifi";
  private deviceId: string | null = null;
  private localIp: string | null = null;
  private callbacks: Set<(status: DeviceStatus) => void> = new Set();

  private getCachedIp(deviceId: string): string | null {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem(`nosky:local_ip:${deviceId}`);
      } catch {
        return null;
      }
    }
    return null;
  }

  private setCachedIp(deviceId: string, ip: string) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`nosky:local_ip:${deviceId}`, ip);
      } catch {
        // ignore
      }
    }
  }

  resolveIp(config: DeviceConnectionConfig): string | null {
    if (config.localIp) {
      this.setCachedIp(config.deviceId, config.localIp);
      return config.localIp;
    }
    return this.getCachedIp(config.deviceId);
  }

  async connect(config: DeviceConnectionConfig): Promise<void> {
    this.deviceId = config.deviceId;
    this.localIp = this.resolveIp(config);
  }

  async disconnect(): Promise<void> {
    this.deviceId = null;
    this.localIp = null;
    this.callbacks.clear();
  }

  async isAvailable(config: DeviceConnectionConfig): Promise<boolean> {
    const ip = this.resolveIp(config);
    if (!ip) return false;

    // Do a quick test ping with a short timeout
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1500);

      const res = await fetch(`http://${ip}/api/status`, {
        signal: controller.signal,
        mode: "cors",
      });
      clearTimeout(id);

      return res.ok;
    } catch {
      return false;
    }
  }

  async getStatus(): Promise<DeviceStatus> {
    if (!this.deviceId || !this.localIp) {
      throw new Error("LocalWifiTransport: No IP available or not connected");
    }

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const res = await fetch(`http://${this.localIp}/api/status`, {
        signal: controller.signal,
        mode: "cors",
      });
      clearTimeout(id);

      if (!res.ok) {
        throw new Error(`Device responded with HTTP ${res.status}`);
      }

      const data = (await res.json()) as Record<string, unknown>;
      return this.mapToDeviceStatus(data);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Unknown local Wi-Fi error";
      throw new Error(`Local Wifi request failed: ${errMsg}`);
    }
  }

  async setRelayState(state: boolean): Promise<RelayCommandResult> {
    if (!this.deviceId || !this.localIp) {
      return { success: false, error: "LocalWifiTransport: Not connected or no IP available" };
    }

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const res = await fetch(`http://${this.localIp}/api/relay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state }),
        signal: controller.signal,
        mode: "cors",
      });
      clearTimeout(id);

      if (!res.ok) {
        return { success: false, error: `Device rejected state change (HTTP ${res.status})` };
      }

      const data = (await res.json()) as Record<string, unknown>;

      return {
        success: true,
        state: (data.state as boolean | undefined) ?? state,
        transport: this.mode,
      };
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Unknown local Wi-Fi error";
      return {
        success: false,
        error: `Local Wifi state change failed: ${errMsg}`,
      };
    }
  }

  subscribe(callback: (status: DeviceStatus) => void): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  private mapToDeviceStatus(json: Record<string, unknown>): DeviceStatus {
    return {
      deviceId: this.deviceId || "unknown",
      relayState:
        (json.relayState as boolean | null | undefined) ??
        (json.actual_state as boolean | null | undefined) ??
        null,
      voltage: (json.voltage as number | null) ?? null,
      currentAmp: (json.currentAmp as number | null) ?? (json.current_amp as number | null) ?? null,
      powerWatts: (json.powerWatts as number | null) ?? (json.power_watts as number | null) ?? null,
      energyKwh: (json.energyKwh as number | null) ?? (json.energy_kwh as number | null) ?? null,
      connectionMode: this.mode,
      localIp: this.localIp,
      wifiRssi: (json.wifiRssi as number | null) ?? (json.wifi_rssi as number | null) ?? null,
      firmwareVersion:
        (json.firmwareVersion as string | null) ?? (json.firmware_version as string | null) ?? null,
      updatedAt: new Date().toISOString(),
    };
  }
}
