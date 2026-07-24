export type TransportMode = "cloud" | "local-wifi" | "bluetooth" | "offline";

export interface DeviceStatus {
  deviceId: string;
  relayState: boolean | null;

  voltage: number | null;
  currentAmp: number | null;
  powerWatts: number | null;
  energyKwh: number | null;

  connectionMode: TransportMode;
  localIp?: string | null;
  wifiRssi?: number | null;
  firmwareVersion?: string | null;

  updatedAt: string;
}

export interface RelayCommandResult {
  success: boolean;
  state?: boolean;
  transport?: TransportMode;
  error?: string;
}

export interface DeviceConnectionConfig {
  deviceId: string;
  localIp?: string | null;
}

export interface DeviceTransport {
  readonly mode: TransportMode;

  connect(config: DeviceConnectionConfig): Promise<void>;

  disconnect(): Promise<void>;

  isAvailable(config: DeviceConnectionConfig): Promise<boolean>;

  getStatus(): Promise<DeviceStatus>;

  setRelayState(state: boolean): Promise<RelayCommandResult>;

  subscribe(callback: (status: DeviceStatus) => void): () => void;
}
