/**
 * Web Platform Adapter
 *
 * Runs in-browser without any native backend:
 *   - Config is persisted to localStorage
 *   - Shell commands return mock/demo data
 *   - Icon cache uses a simple in-memory Map (doesn't persist across reloads,
 *     but the remote API is fast enough)
 *   - `canLaunchApps` is false — clicking "Run" shows a notice
 */

import type { PlatformApi, CommandResult } from "./types";
import type { AppConfig, EnvCheckResult, AppInfo } from "@/types";

const CONFIG_KEY = "scrcpy-launcher-config";

// ── Demo app data (realistic Chinese apps for web preview) ──

const DEMO_APPS: AppInfo[] = [
  { name: "微信", packageName: "com.tencent.mm", isFavorite: true, iconUrl: null },
  { name: "抖音", packageName: "com.ss.android.ugc.aweme", isFavorite: true, iconUrl: null },
  { name: "支付宝", packageName: "com.eg.android.AlipayGphone", isFavorite: false, iconUrl: null },
  { name: "淘宝", packageName: "com.taobao.taobao", isFavorite: false, iconUrl: null },
  { name: "QQ", packageName: "com.tencent.mobileqq", isFavorite: false, iconUrl: null },
  { name: "小红书", packageName: "com.xingin.xhs", isFavorite: false, iconUrl: null },
  { name: "哔哩哔哩", packageName: "tv.danmaku.bili", isFavorite: true, iconUrl: null },
  { name: "网易云音乐", packageName: "com.netease.cloudmusic", isFavorite: false, iconUrl: null },
  { name: "高德地图", packageName: "com.autonavi.minimap", isFavorite: false, iconUrl: null },
  { name: "美团", packageName: "com.sankuai.meituan", isFavorite: false, iconUrl: null },
  { name: "京东", packageName: "com.jingdong.app.mall", isFavorite: false, iconUrl: null },
  { name: "拼多多", packageName: "com.xunmeng.pinduoduo", isFavorite: false, iconUrl: null },
  { name: "百度地图", packageName: "com.baidu.BaiduMap", isFavorite: false, iconUrl: null },
  { name: "钉钉", packageName: "com.alibaba.android.rimet", isFavorite: false, iconUrl: null },
  { name: "饿了么", packageName: "me.ele", isFavorite: false, iconUrl: null },
  { name: "知乎", packageName: "com.zhihu.android", isFavorite: false, iconUrl: null },
  { name: "酷安", packageName: "com.coolapk.market", isFavorite: false, iconUrl: null },
  { name: "SSH客户端", packageName: "com.termux", isFavorite: true, iconUrl: null },
  { name: "Chrome", packageName: "com.android.chrome", isFavorite: false, iconUrl: null },
  { name: "YouTube", packageName: "com.google.android.youtube", isFavorite: false, iconUrl: null },
];

// ── Mock adb devices output ──

const MOCK_ADB_OUTPUT = `List of devices attached
emulator-5554\tdevice
`;

// ── Mock scrcpy --list-apps output ──

const MOCK_LIST_APPS_OUTPUT = DEMO_APPS.map(
  (a) => `\t- ${a.name} ${a.packageName}`,
).join("\n");

// ── In-memory icon cache (per-session) ──

const iconCache = new Map<string, string>();

export const WEB_PLATFORM: PlatformApi = {
  kind: "web",
  canLaunchApps: false,

  // ── Environment ──────────────────────────────────────────

  async checkEnvironment(): Promise<EnvCheckResult> {
    // Browsers cannot access native executables
    return { scrcpy: false, adb: false };
  },

  // ── Config ───────────────────────────────────────────────

  async getConfig(): Promise<AppConfig> {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) return JSON.parse(raw) as AppConfig;
    } catch {
      // Corrupted data — reset
    }
    return {
      scrcpyPath: null,
      adbPath: null,
      favoritePackages: [],
      params: {
        turnScreenOff: false,
        keyboardUhid: false,
        gamepadUhid: false,
        stayAwake: false,
        alwaysOnTop: false,
        maxSize: null,
        maxFps: null,
        videoBitRate: 24,
        videoCodec: null,
        audioCodec: null,
        newDisplayResolution: null,
        newDisplayDpi: null,
        flexibleDisplay: false,
      },
    };
  },

  async saveConfig(config: AppConfig): Promise<void> {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  },

  // ── Shell commands ───────────────────────────────────────

  async executeCommand(program: string, args: string[]): Promise<CommandResult> {
    // Simulate adb devices
    if (program === "adb" && args.includes("devices")) {
      return { code: 0, stdout: MOCK_ADB_OUTPUT, stderr: "" };
    }

    // Simulate scrcpy --list-apps
    if (program === "scrcpy" && args.includes("--list-apps")) {
      return { code: 0, stdout: MOCK_LIST_APPS_OUTPUT, stderr: "" };
    }

    // Simulate adb shell pm list packages <pkg>
    if (program === "adb" && args.includes("list")) {
      const pkg = args[args.length - 1];
      const found = DEMO_APPS.some((a) => a.packageName === pkg);
      return {
        code: 0,
        stdout: found ? `package:${pkg}` : "",
        stderr: "",
      };
    }

    // Unknown command
    return {
      code: 1,
      stdout: "",
      stderr: `Web mode: command "${program}" is not available in the browser.`,
    };
  },

  async spawnCommand(_program: string, _args: string[]): Promise<void> {
    // scrcpy cannot be spawned from a browser.
    // The calling code should check canLaunchApps before calling spawnCommand.
    throw new Error(
      "scrcpy 只能在桌面应用中启动。请下载 Scrcpy Launcher 桌面版来运行应用。",
    );
  },

  // ── Icon cache ───────────────────────────────────────────

  async readCachedIcon(packageName: string): Promise<string | null> {
    return iconCache.get(packageName) ?? null;
  },

  async saveCachedIcon(packageName: string, base64Data: string): Promise<void> {
    iconCache.set(packageName, base64Data);
  },
};
