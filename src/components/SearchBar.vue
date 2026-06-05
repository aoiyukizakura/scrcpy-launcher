<script setup lang="ts">
import { ref, watch } from "vue";
import { useAppStore } from "@/stores/apps";
import { Search, Star } from "lucide-vue-next";

const appStore = useAppStore();

const localQuery = ref("");
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced search input → syncs to the app store */
watch(localQuery, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    appStore.searchQuery = val;
  }, 200);
});
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Search input -->
    <div class="relative flex-1">
      <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <input
        v-model="localQuery"
        type="text"
        placeholder="搜索应用名或包名…"
        class="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none transition-colors focus:border-brand-600/50 focus:bg-zinc-900"
      />
    </div>

    <!-- Favorites filter toggle -->
    <button
      @click="appStore.showFavoritesOnly = !appStore.showFavoritesOnly"
      :class="
        appStore.showFavoritesOnly
          ? 'bg-amber-950/30 border-amber-800/50 text-amber-300'
          : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
      "
      class="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
      title="只看收藏"
    >
      <Star
        :class="appStore.showFavoritesOnly ? 'fill-amber-400 text-amber-400' : ''"
        class="h-4 w-4"
      />
      <span class="hidden sm:inline">收藏</span>
    </button>
  </div>
</template>
