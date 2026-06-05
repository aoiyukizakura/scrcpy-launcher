import { ref } from "vue";
import { platform } from "@/platform";
import { useAppStore } from "@/stores/apps";
import { useConfigStore } from "@/stores/config";
import type { AppInfo } from "@/types";

/**
 * Regex to parse `scrcpy --list-apps` output lines.
 *
 * Expected format (from scrcpy v3.0+):
 *   - App Name com.package.name
 *
 * The app name may contain spaces, emoji, and Unicode characters.
 * The package name is the last whitespace-separated token.
 */
const APP_LINE_RE = /^-\s+(.+?)\s+([a-zA-Z][a-zA-Z0-9_.]*)$/;

/**
 * Composable for fetching the Android app list via scrcpy.
 * Parses `scrcpy --list-apps` output into structured AppInfo objects.
 */
export function useAppList() {
  const appStore = useAppStore();
  const configStore = useConfigStore();
  const error = ref<string | null>(null);

  /**
   * Execute `scrcpy --list-apps` to fetch all launchable apps.
   * Parses the output and populates the app store.
   *
   * scrcpy --list-apps output format (simplified):
   *   [server] INFO: List of apps:
   *   - App Name com.package.name
   *   - Another App com.example.app
   */
  async function fetchApps(): Promise<void> {
    appStore.loading = true;
    error.value = null;

    try {
      const output = await platform.executeCommand("scrcpy", ["--list-apps"]);
      const stdout = output.stdout;

      if (output.code !== 0 && !stdout.includes("- ")) {
        // Real error — scrcpy failed entirely and no app list
        error.value = output.stderr || "scrcpy failed with no output";
        appStore.loading = false;
        return;
      }

      const apps: AppInfo[] = [];
      const lines = stdout.split("\n");

      for (const line of lines) {
        const match = line.trim().match(APP_LINE_RE);
        if (match) {
          const name = match[1].trim();
          const packageName = match[2];
          apps.push({
            name,
            packageName,
            isFavorite: configStore.isFavorite(packageName),
            iconUrl: null,
          });
        }
      }

      appStore.setApps(apps);
    } catch (err) {
      console.error("Failed to fetch app list:", err);
      error.value = String(err);
    } finally {
      appStore.loading = false;
    }
  }

  return {
    fetchApps,
    error,
  };
}
