/**
 * Tauri Desktop Platform Adapter
 *
 * Wraps all Tauri-specific APIs:
 *   - Rust `invoke()` for config, icon cache, env checks
 *   - `@tauri-apps/plugin-shell` for scrcpy/adb command execution
 */

import { invoke } from "@tauri-apps/api/core";
import { Command } from "@tauri-apps/plugin-shell";
import type { PlatformApi, CommandResult } from "./types";
import type { AppConfig, EnvCheckResult } from "@/types";

export const TAURI_PLATFORM: PlatformApi = {
  kind: "tauri",
  canLaunchApps: true,

  // ── Environment ──────────────────────────────────────────

  async checkEnvironment(): Promise<EnvCheckResult> {
    return invoke<EnvCheckResult>("check_environment");
  },

  // ── Config ───────────────────────────────────────────────

  async getConfig(): Promise<AppConfig> {
    return invoke<AppConfig>("get_config");
  },

  async saveConfig(config: AppConfig): Promise<void> {
    await invoke("save_config", { config });
  },

  // ── Shell commands ───────────────────────────────────────

  async executeCommand(program: string, args: string[]): Promise<CommandResult> {
    const cmd = Command.create(program, args);
    const output = await cmd.execute();
    return {
      code: output.code ?? 1,
      stdout: output.stdout,
      stderr: output.stderr,
    };
  },

  async spawnCommand(program: string, args: string[]): Promise<void> {
    const cmd = Command.create(program, args);
    await cmd.spawn();
  },

  // ── Icon cache ───────────────────────────────────────────

  async readCachedIcon(packageName: string): Promise<string | null> {
    return invoke<string | null>("read_cached_icon", { packageName });
  },

  async saveCachedIcon(packageName: string, base64Data: string): Promise<void> {
    await invoke("save_cached_icon", { packageName, iconBase64: base64Data });
  },
};
