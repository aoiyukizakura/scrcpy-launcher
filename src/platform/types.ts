import type { AppConfig, EnvCheckResult } from "@/types";

/**
 * Result of executing a shell command via the platform adapter.
 */
export interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

/**
 * Unified platform API — every platform adapter must implement this.
 *
 * Desktop (Tauri): uses `@tauri-apps/plugin-shell` + Rust `invoke()`.
 * Web: uses localStorage for persistence; shell commands are mocked.
 * Future: Companion server mode via HTTP/WebSocket.
 */
export interface PlatformApi {
  /** Unique identifier for the current platform */
  readonly kind: "tauri" | "web";

  /** Whether this platform can actually launch scrcpy windows */
  readonly canLaunchApps: boolean;

  // ── Environment ────────────────────────────────────────────

  /** Check if scrcpy and adb are available */
  checkEnvironment(): Promise<EnvCheckResult>;

  // ── Config persistence ─────────────────────────────────────

  /** Load persisted configuration */
  getConfig(): Promise<AppConfig>;

  /** Save configuration to persistent storage */
  saveConfig(config: AppConfig): Promise<void>;

  // ── Shell command execution ────────────────────────────────

  /**
   * Execute a command and wait for its output.
   * On web, returns mock data or an error for unsupported commands.
   */
  executeCommand(program: string, args: string[]): Promise<CommandResult>;

  /**
   * Spawn a long-running command (e.g., scrcpy).
   * On web, this will throw or show a notice — only Tauri can actually spawn.
   */
  spawnCommand(program: string, args: string[]): Promise<void>;

  // ── Icon cache ─────────────────────────────────────────────

  /** Read a cached icon as a base64 data URL, or null if not cached */
  readCachedIcon(packageName: string): Promise<string | null>;

  /** Save icon data (raw base64) to the local cache */
  saveCachedIcon(packageName: string, base64Data: string): Promise<void>;
}
