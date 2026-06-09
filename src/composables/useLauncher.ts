import { ref } from "vue";
import { platform } from "@/platform";
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
  /** True when user tried to launch from a platform that can't */
  const showDesktopNotice = ref(false);

  /**
   * Build the scrcpy argument list from the current config params.
   * Returns an array of arguments ready to pass to platform.spawnCommand().
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
   */
  function buildNewDisplayArg(p: ScrcpyParams, args: string[]) {
    const res = p.newDisplayResolution;
    const dpi = p.newDisplayDpi;

    // Flexible display flag

    if (p.flexibleDisplay) {
      args.push("-x", "--flex-display");
    }

    if (res && dpi) {
      args.push(`--new-display=${res}/${dpi}`);
    } else if (res) {
      args.push(`--new-display=${res}`);
    } else if (dpi) {
      args.push(`--new-display=${dpi}`);
    }
  }

  /**
   * Pre-validate that the target package is still installed on the device.
   */
  async function validatePackage(packageName: string): Promise<boolean> {
    try {
      const output = await platform.executeCommand("adb", [
        "shell",
        "pm",
        "list",
        "packages",
        packageName,
      ]);
      return output.stdout.includes(packageName);
    } catch {
      return false;
    }
  }

  /**
   * Launch scrcpy for a single app package.
   * On desktop (Tauri): spawns a real scrcpy window.
   * On web: shows a notice that the desktop app is required.
   *
   * @returns `true` if launch was initiated, `false` if blocked
   */
  async function launchApp(packageName: string): Promise<boolean> {
    // Prevent double-launch of same app
    if (launching.value.has(packageName)) return false;

    // Web platform cannot launch native apps
    if (!platform.canLaunchApps) {
      showDesktopNotice.value = true;
      return false;
    }

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
      await platform.spawnCommand("scrcpy", args);

      // Remove from in-flight set after a short delay to allow the process to start
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
    showDesktopNotice,
    buildArgs,
    launchApp,
  };
}
