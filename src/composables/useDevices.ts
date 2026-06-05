import { onUnmounted } from "vue";
import { platform } from "@/platform";
import { useDeviceStore } from "@/stores/device";

/**
 * Composable for ADB device detection and polling.
 * Uses the platform adapter to execute `adb devices`.
 * Polls every 3 seconds while active.
 */
export function useDevices() {
  const store = useDeviceStore();

  let pollTimer: ReturnType<typeof setInterval> | null = null;

  /** Run `adb devices` once and update the device store */
  async function scan() {
    try {
      const output = await platform.executeCommand("adb", ["devices"]);
      if (output.code === 0) {
        store.updateFromAdbOutput(output.stdout);
      } else {
        console.warn("adb devices failed:", output.stderr);
      }
    } catch (err) {
      console.warn("Failed to run adb devices:", err);
    }
  }

  /** Start polling for devices at a regular interval (default 3s) */
  function startPolling(intervalMs = 3000) {
    stopPolling();
    store.startPolling();
    scan(); // immediate first scan
    pollTimer = setInterval(scan, intervalMs);
  }

  /** Stop device polling */
  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    store.stopPolling();
  }

  // Cleanup on component unmount
  onUnmounted(() => stopPolling());

  return {
    scan,
    startPolling,
    stopPolling,
  };
}
