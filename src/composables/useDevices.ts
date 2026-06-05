import { onUnmounted } from "vue";
import { Command } from "@tauri-apps/plugin-shell";
import { useDeviceStore } from "@/stores/device";

/**
 * Composable for ADB device detection and polling.
 *
 * Uses the Tauri shell plugin to run `adb devices` and parses the output
 * to detect connected Android devices. Polls every 3 seconds while active.
 */
export function useDevices() {
  const store = useDeviceStore();

  let pollTimer: ReturnType<typeof setInterval> | null = null;

  /** Run `adb devices` once and update the device store */
  async function scan() {
    try {
      // Use the shell plugin to execute adb
      const cmd = Command.create("adb", ["devices"]);
      const output = await cmd.execute();

      if (output.code === 0) {
        store.updateFromAdbOutput(output.stdout);
      } else {
        // adb might not be available or gave an error
        console.warn("adb devices failed:", output.stderr);
      }
    } catch (err) {
      console.warn("Failed to run adb devices:", err);
      // adb binary not found or permission denied
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
