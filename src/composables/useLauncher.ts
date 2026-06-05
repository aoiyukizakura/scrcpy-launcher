import { ref } from "vue";
import { Command } from "@tauri-apps/plugin-shell";
import { useConfigStore } from "@/stores/config";
import type { ScrcpyParams } from "@/types";

/**
 * Composable for launching scrcpy with the current parameter configuration.
 * Handles command assembly, pre-launch validation, and error capture.
 */
export function useLauncher() {
  const configStore = useConfigStore();
  const lastError = ref<string | null>(null);
  const launching = ref<Set<string>>(new Set()); // Track in-flight packages

  /**
   * Build the scrcpy argument list from the current config params.
   * Returns an array of arguments ready to pass to Command.create().
   */
  function buildArgs(packageName: string): string[] {
    const args: string[] = [];
    const p = configStore.params;

    // Boolean flags (use short forms for compatibility)
    if (p.turnScreenOff) args.push("-S", "--turn-screen-off");
    if (p.keyboardUhid) args.push("-K", "--keyboard=uhid");
    if (p.mouseUhid) args.push("-G", "--mouse=uhid");
    if (p.stayAwake) args.push("-w", "--stay-awake");
    if (p.alwaysOnTop) args.push("--always-on-top");

    // Numeric / string params
    if (p.maxSize) args.push("-m", String(p.maxSize));
    if (p.maxFps) args.push("--max-fps", String(p.maxFps));
    if (p.videoBitRate) args.push("-b", p.videoBitRate);
    if (p.videoCodec) args.push("--video-codec", p.videoCodec);
    if (p.audioCodec) args.push("--audio-codec", p.audioCodec);

    // New display composite
    buildNewDisplayArg(p, args);

    // The app to launch
    args.push("--start-app", packageName);

    return args;
  }

  /**
   * Build the --new-display argument from resolution and DPI.
   * Format: --new-display=1920x1080/224
   *   - Resolution only → --new-display=1920x1080
   *   - DPI only → --new-display (no value, or just the value)
   *   - Both → --new-display=1920x1080/224
   *   - Neither → no --new-display flag at all
   */
  function buildNewDisplayArg(p: ScrcpyParams, args: string[]) {
    const res = p.newDisplayResolution;
    const dpi = p.newDisplayDpi;

    if (res && dpi) {
      args.push(`--new-display=${res}/${dpi}`);
    } else if (res) {
      args.push(`--new-display=${res}`);
    } else if (dpi) {
      args.push(`--new-display=${dpi}`);
    }
    // Neither: omit the flag entirely
  }

  /**
   * Pre-validate that the target package is still installed on the device.
   * Uses `adb shell pm list packages` to check.
   */
  async function validatePackage(packageName: string): Promise<boolean> {
    try {
      const cmd = Command.create("adb", [
        "shell",
        "pm",
        "list",
        "packages",
        packageName,
      ]);
      const output = await cmd.execute();
      return output.stdout.includes(packageName);
    } catch {
      return false;
    }
  }

  /**
   * Launch scrcpy for a single app package.
   * Spawns asynchronously — does NOT block the launcher UI.
   * Tracks in-flight state per package to prevent double-clicks.
   *
   * @returns `true` if launch was initiated, `false` if blocked or failed validation
   */
  async function launchApp(packageName: string): Promise<boolean> {
    // Prevent double-launch of same app
    if (launching.value.has(packageName)) return false;

    // Pre-launch validation: check app is installed
    const installed = await validatePackage(packageName);
    if (!installed) {
      lastError.value = `App "${packageName}" is not installed on the device.`;
      return false;
    }

    launching.value.add(packageName);
    lastError.value = null;

    try {
      const args = buildArgs(packageName);
      // Use spawn() so scrcpy runs independently without blocking the launcher UI.
      // The returned Child runs detached — we clean up the launching flag immediately
      // since scrcpy manages its own window lifecycle.
      const cmd = Command.create("scrcpy", args);
      await cmd.spawn();

      // Remove from in-flight set after a short delay to allow the process to start
      // (and surface any immediate spawn errors via the catch block)
      setTimeout(() => launching.value.delete(packageName), 1000);

      return true;
    } catch (err) {
      launching.value.delete(packageName);
      lastError.value = String(err);
      return false;
    }
  }

  return {
    lastError,
    launching,
    buildArgs,
    launchApp,
    validatePackage,
  };
}
