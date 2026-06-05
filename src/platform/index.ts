/**
 * Platform auto-detection.
 *
 * Detects the current runtime environment and returns the appropriate
 * PlatformApi implementation:
 *   - Tauri desktop: uses `window.__TAURI__` to detect
 *   - Web browser:    localStorage-based demo mode
 *
 * Usage:
 *   import { platform } from "@/platform";
 *   const config = await platform.getConfig();
 */

import type { PlatformApi } from "./types";
import { TAURI_PLATFORM } from "./tauri";
import { WEB_PLATFORM } from "./web";

/**
 * Detect whether we're running inside a Tauri WebView.
 * Tauri injects `window.__TAURI__` (or `window.__TAURI_INTERNALS__`).
 */
function isTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.__TAURI__ !== undefined ||
      window.__TAURI_INTERNALS__ !== undefined)
  );
}

/** The singleton platform adapter for the current runtime */
export const platform: PlatformApi = isTauri() ? TAURI_PLATFORM : WEB_PLATFORM;

/** Re-export types for convenience */
export type { PlatformApi, CommandResult } from "./types";
