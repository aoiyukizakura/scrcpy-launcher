import { defineStore } from "pinia";
import { ref } from "vue";
import type { DeviceInfo } from "@/types";

/**
 * Device store — manages connected Android device state.
 * Polls `adb devices` periodically and tracks the currently selected device.
 */
export const useDeviceStore = defineStore("device", () => {
  const devices = ref<DeviceInfo[]>([]);
  const selectedSerial = ref<string | null>(null);
  const isPolling = ref(false);
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  /** Update the device list from a raw `adb devices` output string */
  function updateFromAdbOutput(output: string) {
    const lines = output.split("\n").slice(1); // Skip "List of devices attached"
    const parsed: DeviceInfo[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        parsed.push({ serial: parts[0], state: parts[1] });
      }
    }
    devices.value = parsed;

    // Auto-select first device if none selected
    if (!selectedSerial.value && parsed.length > 0) {
      selectedSerial.value = parsed[0].serial;
    }
    // Deselect if current device disconnected
    if (
      selectedSerial.value &&
      !parsed.find((d) => d.serial === selectedSerial.value)
    ) {
      selectedSerial.value = parsed[0]?.serial ?? null;
    }
  }

  function startPolling() {
    if (isPolling.value) return;
    isPolling.value = true;
  }

  function stopPolling() {
    isPolling.value = false;
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function selectDevice(serial: string) {
    selectedSerial.value = serial;
  }

  /** Whether we have at least one authorized device */
  const hasDevice = () =>
    devices.value.some((d) => d.state === "device");

  return {
    devices,
    selectedSerial,
    isPolling,
    updateFromAdbOutput,
    startPolling,
    stopPolling,
    selectDevice,
    hasDevice,
  };
});
