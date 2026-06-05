<script setup lang="ts">
import { computed, onMounted } from "vue";
import type { AppInfo } from "@/types";
import { useConfigStore } from "@/stores/config";
import { useLauncher } from "@/composables/useLauncher";
import { useDeviceStore } from "@/stores/device";
import { useIcons } from "@/composables/useIcons";
import { Star, Play, Loader2 } from "lucide-vue-next";

const props = defineProps<{
  app: AppInfo;
}>();

const configStore = useConfigStore();
const deviceStore = useDeviceStore();
const { launching, launchApp } = useLauncher();
const { loadIcon } = useIcons();

// Trigger icon loading when card mounts (lazy, per-card)
onMounted(() => {
  if (!props.app.iconUrl) {
    loadIcon(props.app.packageName);
  }
});

const isFavorite = computed(() => configStore.isFavorite(props.app.packageName));
const isLaunching = computed(() => launching.value.has(props.app.packageName));
const canLaunch = computed(() => deviceStore.hasDevice() && !isLaunching.value);

/** Generate a deterministic background color from the package name for placeholder icons */
const placeholderColor = computed(() => {
  let hash = 0;
  for (let i = 0; i < props.app.packageName.length; i++) {
    hash = props.app.packageName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 35%)`;
});

/** First character for the fallback placeholder */
const initial = computed(() => {
  const ch = props.app.name.charAt(0);
  // Handle CJK characters — they display well as single-char
  return ch || "?";
});

async function handleLaunch() {
  if (!canLaunch.value) return;
  await launchApp(props.app.packageName);
}
</script>

<template>
  <div
    class="group relative flex flex-col items-center gap-2 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900/80"
  >
    <!-- Favorite star -->
    <button
      @click.stop="configStore.toggleFavorite(app.packageName)"
      class="absolute right-2 top-2 z-10 rounded p-0.5 transition-colors hover:bg-zinc-800"
      :title="isFavorite ? '取消收藏' : '收藏'"
    >
      <Star
        :class="isFavorite ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'"
        class="h-4 w-4 transition-colors hover:text-amber-300"
      />
    </button>

    <!-- Icon area -->
    <div class="relative mt-2 flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl">
      <!-- Real icon (loaded asynchronously) -->
      <img
        v-if="app.iconUrl"
        :src="app.iconUrl"
        :alt="app.name"
        class="h-full w-full object-cover"
        loading="lazy"
      />
      <!-- Fallback placeholder -->
      <div
        v-else
        :style="{ backgroundColor: placeholderColor }"
        class="flex h-full w-full items-center justify-center text-xl font-bold text-white/80"
      >
        {{ initial }}
      </div>
    </div>

    <!-- App name -->
    <span
      class="w-full truncate text-center text-sm font-medium text-zinc-200"
      :title="app.name"
    >
      {{ app.name }}
    </span>

    <!-- Package name (subtle) -->
    <span
      class="-mt-1 w-full truncate text-center text-xs text-zinc-500"
      :title="app.packageName"
    >
      {{ app.packageName }}
    </span>

    <!-- Launch button -->
    <button
      @click="handleLaunch"
      :disabled="!canLaunch"
      class="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
      :class="
        canLaunch
          ? 'bg-brand-600 text-white hover:bg-brand-500 active:scale-[0.97]'
          : 'cursor-not-allowed bg-zinc-800 text-zinc-500'
      "
    >
      <Loader2 v-if="isLaunching" class="h-3 w-3 animate-spin" />
      <Play v-else class="h-3 w-3" />
      {{ isLaunching ? '启动中…' : '运行' }}
    </button>
  </div>
</template>
