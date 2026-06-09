import { ref } from "vue";
import { platform } from "@/platform";
import { useConfigStore } from "@/stores/config";
import type { ScrcpyParams } from "@/types";

/**
 * Build the --new-display and --flex-display arguments.
 *
 * scrcpy rule: -x / --flex-display MUST be paired with --new-display.
 *   --new-display            → virtual display with default size
 *   --new-display=WxH        → specific resolution
 *   --new-display=WxH/DPI    → resolution + DPI
 *   -x --new-display[=...]   → flexible virtual display
 *
 * DPI alone without resolution is NOT valid — it would be misinterpreted
 * as a resolution. If only DPI is set, we fall back to bare --new-display.
 */
export function buildNewDisplayArg(p: ScrcpyParams, args: string[]) {
  const res = p.newDisplayResolution;
  const dpi = p.newDisplayDpi;
  const wantNewDisplay = p.flexibleDisplay || res || dpi;

  if (!wantNewDisplay) return;

  // -x must always be paired with --new-display
  if (p.flexibleDisplay) {
    args.push("-x");
  }

  // Build --new-display value
  // Resolution + DPI → --new-display=WxH/DPI
  // Resolution only   → --new-display=WxH
  // DPI only          → bare --new-display (DPI alone would be misread as resolution)
  // Neither           → bare --new-display (use device default)
  if (res && dpi) {
    args.push(`--new-display=${res}/${dpi}`);
  } else if (res) {
    args.push(`--new-display=${res}`);
  } else {
    // Flexible display on, or DPI-only, or neither res/dpi —
    // always safe with bare --new-display (device default size)
    args.push("--new-display");
  }
}

/**
 * Build the complete scrcpy argument list from params.
 * Pure function — no reactivity dependencies, callable from computed().
 */
export function buildScrcpyArgs(
  p: ScrcpyParams,
  packageName: string,
): string[] {
  const args: string[] = [];

  // Boolean flags
  if (p.turnScreenOff) args.push("-S");
  if (p.keyboardUhid) args.push("-K");
  if (p.gamepadUhid) args.push("-G");
  if (p.stayAwake) args.push("-w");
  if (p.alwaysOnTop) args.push("--always-on-top");

  // Numeric / string params
  if (p.maxSize) args.push("-m", String(p.maxSize));
  if (p.maxFps) args.push("--max-fps", String(p.maxFps));
  if (p.videoBitRate) args.push("-b", `${p.videoBitRate}M`);
  if (p.videoCodec) args.push("--video-codec", p.videoCodec);
  if (p.audioCodec) args.push("--audio-codec", p.audioCodec);

  // New display composite
  buildNewDisplayArg(p, args);

  // The app to launch
  args.push("--start-app", packageName);

  return args;
}

/**
 * Composable for launching scrcpy with the current parameter configuration.
 * Handles command assembly, pre-launch validation, and error capture.
 */
export function useLauncher() {
  const configStore = useConfigStore();
  const lastError = ref<string | null>(null);
  const launching = ref<Set<string>>(new Set());
  const showDesktopNotice = ref(false);

  /** Build args from the live store (reactive) */
  function buildArgs(packageName: string): string[] {
    return buildScrcpyArgs(configStore.params, packageName);
  }

  /** Pre-validate that the target package is still installed on the device. */
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
   */
  async function launchApp(packageName: string): Promise<boolean> {
    if (launching.value.has(packageName)) return false;

    if (!platform.canLaunchApps) {
      showDesktopNotice.value = true;
      return false;
    }

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
