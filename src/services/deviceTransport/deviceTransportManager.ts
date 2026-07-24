import {
  DeviceTransport,
  DeviceStatus,
  RelayCommandResult,
  DeviceConnectionConfig,
  TransportMode,
} from "./deviceTransport";
import { CloudTransport } from "./cloudTransport";
import { LocalWifiTransport } from "./localWifiTransport";
import { BluetoothTransport } from "./bluetoothTransport";

export class DeviceTransportManager implements DeviceTransport {
  private static instance: DeviceTransportManager | null = null;

  static getInstance(): DeviceTransportManager {
    if (!DeviceTransportManager.instance) {
      DeviceTransportManager.instance = new DeviceTransportManager();
    }
    return DeviceTransportManager.instance;
  }

  private cloudTransport = new CloudTransport();
  private localWifiTransport = new LocalWifiTransport();
  private bluetoothTransport = new BluetoothTransport();

  private config: DeviceConnectionConfig | null = null;
  private activeMode: TransportMode = "offline";
  private callbacks: Set<(status: DeviceStatus) => void> = new Set();
  private unsubscribes: (() => void)[] = [];

  get activeTransportMode(): TransportMode {
    return this.activeMode;
  }

  // Allow setting mode dynamically
  get mode(): TransportMode {
    return this.activeMode;
  }

  async connect(config: DeviceConnectionConfig): Promise<void> {
    this.config = config;
    this.unsubscribes.forEach((unsub) => unsub());
    this.unsubscribes = [];

    // Connect to all transports
    await this.cloudTransport.connect(config);
    await this.localWifiTransport.connect(config);
    await this.bluetoothTransport.connect(config);

    // Setup multi-subscribe to broadcast status changes
    this.unsubscribes.push(
      this.localWifiTransport.subscribe((status) => this.handleStatusUpdate("local-wifi", status)),
    );
    this.unsubscribes.push(
      this.cloudTransport.subscribe((status) => this.handleStatusUpdate("cloud", status)),
    );
    this.unsubscribes.push(
      this.bluetoothTransport.subscribe((status) => this.handleStatusUpdate("bluetooth", status)),
    );

    // Determine initial best active mode
    await this.determineActiveTransport();
  }

  async disconnect(): Promise<void> {
    this.unsubscribes.forEach((unsub) => unsub());
    this.unsubscribes = [];

    await this.cloudTransport.disconnect();
    await this.localWifiTransport.disconnect();
    await this.bluetoothTransport.disconnect();

    this.config = null;
    this.activeMode = "offline";
    this.callbacks.clear();
  }

  async isAvailable(config: DeviceConnectionConfig): Promise<boolean> {
    return (
      (await this.localWifiTransport.isAvailable(config)) ||
      (await this.cloudTransport.isAvailable(config)) ||
      (await this.bluetoothTransport.isAvailable(config))
    );
  }

  private handleStatusUpdate(sourceMode: TransportMode, status: DeviceStatus) {
    // Only accept status updates if they match the active transport, or if they prompt a transport upgrade/downgrade
    if (this.activeMode === "offline" || sourceMode === this.activeMode) {
      this.activeMode = sourceMode;
      const updatedStatus = { ...status, connectionMode: this.activeMode };
      this.callbacks.forEach((cb) => cb(updatedStatus));
    }
  }

  async determineActiveTransport(): Promise<TransportMode> {
    if (!this.config) {
      this.activeMode = "offline";
      return "offline";
    }

    // 1. Try Local Wi-Fi
    try {
      const isWifiAvail = await this.localWifiTransport.isAvailable(this.config);
      if (isWifiAvail) {
        this.activeMode = "local-wifi";
        return "local-wifi";
      }
    } catch {
      // Ignore Wifi failure
    }

    // 2. Try Cloud
    try {
      const isCloudAvail = await this.cloudTransport.isAvailable(this.config);
      if (isCloudAvail) {
        this.activeMode = "cloud";
        return "cloud";
      }
    } catch {
      // Ignore Cloud failure
    }

    // 3. Try Bluetooth
    try {
      const isBTAvail = await this.bluetoothTransport.isAvailable(this.config);
      if (isBTAvail) {
        this.activeMode = "bluetooth";
        return "bluetooth";
      }
    } catch {
      // Ignore Bluetooth failure
    }

    this.activeMode = "offline";
    return "offline";
  }

  async getStatus(): Promise<DeviceStatus> {
    if (!this.config) {
      throw new Error("DeviceTransportManager is not connected to a device.");
    }

    // Determine best active mode and get status from it
    await this.determineActiveTransport();

    if (this.activeMode === "local-wifi") {
      try {
        const status = await this.localWifiTransport.getStatus();
        return { ...status, connectionMode: "local-wifi" };
      } catch (err) {
        console.warn("Local Wi-Fi getStatus failed. Falling back to Cloud.", err);
        this.activeMode = "cloud";
      }
    }

    if (this.activeMode === "cloud") {
      try {
        const status = await this.cloudTransport.getStatus();
        return { ...status, connectionMode: "cloud" };
      } catch (err) {
        console.warn("Cloud getStatus failed. Falling back to Offline.", err);
        this.activeMode = "offline";
      }
    }

    if (this.activeMode === "bluetooth") {
      try {
        const status = await this.bluetoothTransport.getStatus();
        return { ...status, connectionMode: "bluetooth" };
      } catch (err) {
        console.warn("Bluetooth getStatus failed.", err);
        this.activeMode = "offline";
      }
    }

    // If everything failed or is offline
    return {
      deviceId: this.config.deviceId,
      relayState: null,
      voltage: null,
      currentAmp: null,
      powerWatts: null,
      energyKwh: null,
      connectionMode: "offline",
      updatedAt: new Date().toISOString(),
    };
  }

  async setRelayState(state: boolean): Promise<RelayCommandResult> {
    if (!this.config) {
      return { success: false, error: "DeviceTransportManager is not connected." };
    }

    // Ensure we have current best active transport
    await this.determineActiveTransport();

    // 1. Try Local Wi-Fi if selected
    if (this.activeMode === "local-wifi") {
      const res = await this.localWifiTransport.setRelayState(state);
      if (res.success) {
        return { ...res, transport: "local-wifi" };
      }
      console.warn("Local Wi-Fi setRelayState failed. Retrying with Cloud fallback.", res.error);
      this.activeMode = "cloud";
    }

    // 2. Try Cloud
    if (this.activeMode === "cloud") {
      const res = await this.cloudTransport.setRelayState(state);
      if (res.success) {
        return { ...res, transport: "cloud" };
      }
      console.warn("Cloud setRelayState failed.", res.error);
      this.activeMode = "offline";
      return res;
    }

    // 3. Try Bluetooth
    if (this.activeMode === "bluetooth") {
      const res = await this.bluetoothTransport.setRelayState(state);
      if (res.success) {
        return { ...res, transport: "bluetooth" };
      }
      this.activeMode = "offline";
      return res;
    }

    return {
      success: false,
      error: "Device connection offline.",
      transport: "offline",
    };
  }

  subscribe(callback: (status: DeviceStatus) => void): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }
}

export const deviceTransportManager = DeviceTransportManager.getInstance();
