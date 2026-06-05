import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { AppInfo } from "@/types";

/**
 * App store — manages the list of apps from the connected device,
 * along with search/filter state.
 */
export const useAppStore = defineStore("app", () => {
  const apps = ref<AppInfo[]>([]);
  const loading = ref(false);
  const searchQuery = ref("");
  const showFavoritesOnly = ref(false);

  /** Filtered and sorted app list based on current search/filter */
  const filteredApps = computed(() => {
    let result = apps.value;

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.packageName.toLowerCase().includes(q),
      );
    }

    if (showFavoritesOnly.value) {
      result = result.filter((a) => a.isFavorite);
    }

    return result;
  });

  function setApps(newApps: AppInfo[]) {
    apps.value = newApps;
  }

  function updateAppIcon(packageName: string, iconUrl: string) {
    const app = apps.value.find((a) => a.packageName === packageName);
    if (app) {
      app.iconUrl = iconUrl;
    }
  }

  return {
    apps,
    loading,
    searchQuery,
    showFavoritesOnly,
    filteredApps,
    setApps,
    updateAppIcon,
  };
});
