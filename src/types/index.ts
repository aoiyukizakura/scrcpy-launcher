/** Represents a single Android app entry parsed from `scrcpy --list-apps` */
export interface AppInfo {
  /** Human-readable application name (e.g., "抖音") */
  name: string;
  /** Android package name (e.g., "com.ss.android.ugc.aweme") */
  packageName: string;
  /** Whether the user has favorited this app */
  isFavorite: boolean;
  /** Cached icon path or data URL — populated asynchronously */
  iconUrl: string | null;
}

/** Global scrcpy parameters configurable via the UI */
export interface ScrcpyParams {
  // Boolean flags
  turnScreenOff: boolean; // -S / --turn-screen-off
  keyboardUhid: boolean; // -K / --keyboard=uhid
  gamepadUhid: boolean; // -G / --gamepad=uhid
  stayAwake: boolean; // -w / --stay-awake
  alwaysOnTop: boolean; // --always-on-top

  // Numeric / string values
  maxSize: number | null; // -m / --max-size
  maxFps: number | null; // --max-fps
  videoBitRate: number; // -b / --video-bit-rate (Mbps, e.g., 24)
  videoCodec: string | null; // --video-codec (h264/h265/av1)
  audioCodec: string | null; // --audio-codec (opus/aac/flac)

  // New display composite
  newDisplayResolution: string | null; // e.g., "1920x1080"
  newDisplayDpi: number | null; // e.g., 224
  flexibleDisplay: boolean; // -x / --flex-display
}

/** Persisted application configuration */
export interface AppConfig {
  scrcpyPath: string | null;
  adbPath: string | null;
  favoritePackages: string[];
  params: ScrcpyParams;
}

/** Device info parsed from `adb devices` output */
export interface DeviceInfo {
  serial: string;
  state: string; // "device", "offline", "unauthorized"
}

/** Environment check result from Rust backend */
export interface EnvCheckResult {
  scrcpy: boolean;
  adb: boolean;
}
