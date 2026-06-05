<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useAppStore } from "@/stores/apps";
import { useAppList } from "@/composables/useAppList";
import { useDeviceStore } from "@/stores/device";
import AppCard from "./AppCard.vue";
import { Loader2, RefreshCw, PackageOpen } from "lucide-vue-next";

const appStore = useAppStore();
const deviceStore = useDeviceStore();
const { fetchApps, error } = useAppList();

// ---- Infinite scroll pagination ----
const pageSize = 48;
const visibleCount = ref(pageSize);
const sentinel = ref<HTMLDivElement | null>(null);

/** Show more apps when the sentinel element scrolls into view */
let observer: IntersectionObserver | null = null;

function setupObserver() {
  if (observer) observer.disconnect();
  if (!sentinel.value) return;

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        visibleCount.value = Math.min(
          visibleCount.value + pageSize,
          appStore.filteredApps.length,
        );
      }
    },
    { rootMargin: "200px" },
  );
  observer.observe(sentinel.value);
}

// Re-attach observer when filtered list changes
watch(
  () => appStore.filteredApps.length,
  () => {
    visibleCount.value = Math.min(pageSize, appStore.filteredApps.length);
    // Use nextTick-alike via setTimeout
    setTimeout(setupObserver, 0);
  },
);

onMounted(() => setTimeout(setupObserver, 100));
onUnmounted(() => observer?.disconnect());

/** Visible slice of apps */
const visibleApps = computed(() =>
  appStore.filteredApps.slice(0, visibleCount.value),
);

const hasMore = computed(
  () => visibleCount.value < appStore.filteredApps.length,
);

// Auto-fetch apps when device connects
watch(
  () => deviceStore.hasDevice(),
  (connected) => {
    if (connected) fetchApps();
  },
);
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-1 py-3">
      <span class="text-sm text-zinc-400">
        {{ appStore.apps.length }} 个应用
        <template v-if="appStore.filteredApps.length !== appStore.apps.length">
          · 匹配 {{ appStore.filteredApps.length }}
        </template>
      </span>
      <button
        @click="fetchApps"
        :disabled="appStore.loading"
        class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50"
      >
        <RefreshCw
          :class="{ 'animate-spin': appStore.loading }"
          class="h-3.5 w-3.5"
        />
        刷新
      </button>
    </div>

    <!-- Loading state -->
    <div
      v-if="appStore.loading && appStore.apps.length === 0"
      class="flex flex-1 items-center justify-center"
    >
      <div class="flex flex-col items-center gap-3 text-zinc-500">
        <Loader2 class="h-8 w-8 animate-spin" />
        <span class="text-sm">正在读取应用列表…</span>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-else-if="error && appStore.apps.length === 0"
      class="flex flex-1 items-center justify-center"
    >
      <div class="flex flex-col items-center gap-3 text-red-400">
        <PackageOpen class="h-8 w-8" />
        <span class="text-sm">{{ error }}</span>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!appStore.loading && appStore.filteredApps.length === 0 && appStore.apps.length > 0"
      class="flex flex-1 items-center justify-center"
    >
      <div class="flex flex-col items-center gap-3 text-zinc-500">
        <PackageOpen class="h-8 w-8" />
        <span class="text-sm">无匹配结果</span>
      </div>
    </div>

    <!-- App grid -->
    <div
      v-else
      class="flex-1 overflow-y-auto pr-1"
      style="contain: content"
    >
      <div
        class="grid gap-3"
        style="grid-template-columns: repeat(auto-fill, minmax(140px, 1fr))"
      >
        <AppCard
          v-for="app in visibleApps"
          :key="app.packageName"
          :app="app"
        />
      </div>

      <!-- Infinite scroll sentinel -->
      <div
        v-if="hasMore"
        ref="sentinel"
        class="flex items-center justify-center py-6"
      >
        <Loader2 class="h-5 w-5 animate-spin text-zinc-600" />
      </div>
    </div>
  </div>
</template>
