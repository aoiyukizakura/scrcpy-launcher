import { ref } from "vue";
import { platform } from "@/platform";
import { useAppStore } from "@/stores/apps";

/**
 * Tracks which packages are currently loading their icon
 * so we don't fire duplicate requests.
 */
const loadingSet = ref<Set<string>>(new Set());

/**
 * Composable for the icon loading system with three-level fallback:
 *
 *   1. Local cache (Tauri: filesystem PNG; Web: in-memory Map)
 *   2. Remote API — fetch from `https://api.ihnet.net/icon.php?packageName=`
 *      and cache the result locally
 *   3. Generated fallback — the AppCard component renders a colored letter
 *      placeholder (no icon URL needed)
 *
 * Icons are loaded lazily — triggered when AppCard enters the viewport.
 */
export function useIcons() {
  const appStore = useAppStore();

  /**
   * Load an icon for a single package name.
   * Returns the icon URL (data URL) or null if fallback is needed.
   */
  async function loadIcon(packageName: string): Promise<string | null> {
    // Prevent duplicate loads for the same package
    if (loadingSet.value.has(packageName)) return null;
    loadingSet.value.add(packageName);

    try {
      // ---- Level 1: Check local cache (platform-aware) ----
      const cached = await platform.readCachedIcon(packageName);
      if (cached) {
        // cached is either a file path (Tauri) or raw base64 (Web)
        // Both cases: if it starts with "data:" use as-is, otherwise wrap
        const url = cached.startsWith("data:") ? cached : `data:image/png;base64,${cached}`;
        appStore.updateAppIcon(packageName, url);
        return url;
      }

      // ---- Level 2: Fetch from remote API ----
      const fetched = await fetchFromApi(packageName);
      if (fetched) {
        appStore.updateAppIcon(packageName, fetched);
        return fetched;
      }

      // ---- Level 3: null → AppCard will show fallback placeholder ----
      return null;
    } catch (err) {
      console.warn(`Icon load failed for ${packageName}:`, err);
      return null;
    } finally {
      loadingSet.value.delete(packageName);
    }
  }

  return { loadIcon };
}

/**
 * Fetch an app icon from the remote API, then save it to the local cache.
 * Returns a base64 data URL on success, or null on failure.
 */
async function fetchFromApi(packageName: string): Promise<string | null> {
  const url = `https://api.ihnet.net/icon.php?packageName=${encodeURIComponent(packageName)}`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;

    const blob = await response.blob();
    if (blob.size === 0) return null;

    // Convert blob → base64 for caching
    const base64 = await blobToBase64(blob);
    const dataUrl = `data:${blob.type || "image/png"};base64,${base64}`;

    // Persist to local cache via platform adapter (fire-and-forget)
    platform.saveCachedIcon(packageName, base64).catch((e) =>
      console.warn("Failed to cache icon:", e),
    );

    return dataUrl;
  } catch {
    return null;
  }
}

/**
 * Convert a Blob to a base64-encoded string.
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
