import {
  DeviceTransport,
  DeviceStatus,
  RelayCommandResult,
  DeviceConnectionConfig,
  TransportMode,
} from "./deviceTransport";

export class BluetoothTransport implements DeviceTransport {
  readonly mode: TransportMode = "bluetooth";

  async connect(config: DeviceConnectionConfig): Promise<void> {
    throw new Error("Bluetooth Transport: Not implemented");
  }

  async disconnect(): Promise<void> {
    // Noop
  }

  async isAvailable(config: DeviceConnectionConfig): Promise<boolean> {
    // Bluetooth is unsupported on browser level until Capacitor/Native layer is ready
    return false;
  }

  async getStatus(): Promise<DeviceStatus> {
    throw new Error("Bluetooth Transport: Not implemented");
  }

  async setRelayState(state: boolean): Promise<RelayCommandResult> {
    return {
      success: false,
      error: "Bluetooth Transport: Not implemented",
    };
  }

  subscribe(callback: (status: DeviceStatus) => void): () => void {
    return () => {
      // Noop
    };
  }

  // BLE placeholding methods
  async scan(): Promise<unknown[]> {
    throw new Error("Bluetooth scanning is not implemented yet.");
  }

  async readStatus(): Promise<unknown> {
    throw new Error("Bluetooth read status is not implemented yet.");
  }

  async writeRelay(state: boolean): Promise<unknown> {
    throw new Error("Bluetooth write relay is not implemented yet.");
  }

  async wifiProvision(ssid: string, pass: string): Promise<unknown> {
    throw new Error("Bluetooth Wi-Fi provisioning is not implemented yet.");
  }
}
