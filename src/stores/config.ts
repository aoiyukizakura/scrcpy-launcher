import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { platform } from "@/platform";
import type { ScrcpyParams } from "@/types";

/**
 * Config store — manages persisted application configuration.
 * Uses the platform adapter for storage, so it works on both Tauri and Web.
 */
const DEFAULT_PARAMS: ScrcpyParams = {
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
};

export const useConfigStore = defineStore("config", () => {
  const scrcpyPath = ref<string | null>(null);
  const adbPath = ref<string | null>(null);
  const favoritePackages = ref<string[]>([]);
  const params = ref<ScrcpyParams>({ ...DEFAULT_PARAMS });
  const loaded = ref(false);

  /** Load config from the platform adapter */
  async function load() {
    try {
      const config = await platform.getConfig();
      scrcpyPath.value = config.scrcpyPath;
      adbPath.value = config.adbPath;
      favoritePackages.value = config.favoritePackages ?? [];
      if (config.params) {
        // Deep-merge defaults with loaded params
        params.value = { ...DEFAULT_PARAMS, ...config.params };
        // Migrate videoBitRate from old string format (e.g., "24M") to number
        if (typeof params.value.videoBitRate === "string") {
          const parsed = parseInt((params.value.videoBitRate as unknown as string).replace(/[^\d]/g, ""));
          params.value.videoBitRate = isNaN(parsed) ? 24 : parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load config:", e);
    } finally {
      loaded.value = true;
    }
  }

  /** Save current config via the platform adapter (debounced) */
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  function save() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try {
        await platform.saveConfig({
          scrcpyPath: scrcpyPath.value,
          adbPath: adbPath.value,
          favoritePackages: favoritePackages.value,
          params: params.value,
        });
      } catch (e) {
        console.error("Failed to save config:", e);
      }
    }, 500);
  }

  /** Toggle a favorite package */
  function toggleFavorite(packageName: string) {
    const idx = favoritePackages.value.indexOf(packageName);
    if (idx >= 0) {
      favoritePackages.value.splice(idx, 1);
    } else {
      favoritePackages.value.push(packageName);
    }
    save();
  }

  function isFavorite(packageName: string): boolean {
    return favoritePackages.value.includes(packageName);
  }

  // Watch params for changes and auto-save
  watch(params, () => save(), { deep: true });
  watch(favoritePackages, () => save(), { deep: true });

  return {
    scrcpyPath,
    adbPath,
    favoritePackages,
    params,
    loaded,
    load,
    save,
    toggleFavorite,
    isFavorite,
  };
});
