<script setup lang="ts">
import { ref, onMounted } from "vue";
import { platform } from "@/platform";
import { useDevices } from "@/composables/useDevices";
import { useLauncher } from "@/composables/useLauncher";
import { useConfigStore } from "@/stores/config";
import DeviceWarning from "@/components/DeviceWarning.vue";
import SearchBar from "@/components/SearchBar.vue";
import AppGrid from "@/components/AppGrid.vue";
import SettingsDialog from "@/components/SettingsDialog.vue";
import ConfigPanel from "@/components/ConfigPanel.vue";
import ErrorDialog from "@/components/ErrorDialog.vue";
import { Settings, Wrench, Monitor, X } from "lucide-vue-next";

// ---- Environment check ----
const scrcpyFound = ref<boolean | null>(null);
const adbFound = ref<boolean | null>(null);

async function checkEnv() {
  try {
    const result = await platform.checkEnvironment();
    scrcpyFound.value = result.scrcpy;
    adbFound.value = result.adb;
  } catch (e) {
    console.error("Failed to check environment:", e);
    scrcpyFound.value = false;
    adbFound.value = false;
  }
}

// ---- Config ----
const configStore = useConfigStore();

// ---- Device polling ----
const { startPolling } = useDevices();

// ---- Launcher ----
const { lastError, showDesktopNotice } = useLauncher();

// ---- Dialog visibility ----
const showSettings = ref(false);
const showConfig = ref(false);

/** Whether to show the web-mode demo banner */
const isWebMode = platform.kind === "web";
const dismissWebBanner = ref(false);

// ---- Lifecycle ----
onMounted(async () => {
  await checkEnv();
  await configStore.load();
  // Start device polling (desktop: real ADB; web: mock data)
  startPolling();
});
</script>

<template>
  <div class="flex h-screen w-screen flex-col bg-zinc-950">
    <!-- ===== Web Demo Banner ===== -->
    <div
      v-if="isWebMode && !dismissWebBanner"
      class="flex shrink-0 items-center justify-between bg-brand-900/40 border-b border-brand-700/30 px-4 py-2"
    >
      <div class="flex items-center gap-2 text-sm text-brand-200">
        <Monitor class="h-4 w-4 shrink-0" />
        <span>
          <strong>网页演示模式</strong>
          <span class="hidden sm:inline">
            — 展示模拟数据，完整功能请使用桌面版
          </span>
        </span>
      </div>
      <button
        @click="dismissWebBanner = true"
        class="rounded p-1 text-brand-300 transition-colors hover:bg-brand-800/50 hover:text-brand-100"
        title="关闭"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <!-- ===== Status Bar ===== -->
    <header class="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-2">
      <div class="flex items-center gap-3">
        <h1 class="text-lg font-semibold tracking-tight text-zinc-100">
          Scrcpy Launcher
        </h1>
        <!-- Tool status dots -->
        <div class="flex items-center gap-2 text-xs">
          <span
            :class="
              scrcpyFound
                ? 'text-emerald-400'
                : scrcpyFound === false
                  ? 'text-red-400'
                  : 'text-zinc-500'
            "
            class="flex items-center gap-1"
          >
            <span
              class="inline-block h-1.5 w-1.5 rounded-full"
              :class="
                scrcpyFound
                  ? 'bg-emerald-400'
                  : scrcpyFound === false
                    ? 'bg-red-400'
                    : 'bg-zinc-600'
              "
            />
            scrcpy
          </span>
          <span
            :class="
              adbFound
                ? 'text-emerald-400'
                : adbFound === false
                  ? 'text-red-400'
                  : 'text-zinc-500'
            "
            class="flex items-center gap-1"
          >
            <span
              class="inline-block h-1.5 w-1.5 rounded-full"
              :class="
                adbFound
                  ? 'bg-emerald-400'
                  : adbFound === false
                    ? 'bg-red-400'
                    : 'bg-zinc-600'
              "
            />
            adb
          </span>
        </div>
      </div>

      <!-- Toolbar buttons -->
      <div class="flex items-center gap-1.5">
        <button
          @click="showConfig = true"
          class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          title="参数配置"
        >
          <Wrench class="h-3.5 w-3.5" />
          <span class="hidden sm:inline">配置</span>
        </button>
        <button
          @click="showSettings = true"
          class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          title="环境设置"
        >
          <Settings class="h-3.5 w-3.5" />
          <span class="hidden sm:inline">设置</span>
        </button>
      </div>
    </header>

    <!-- ===== Device Warning ===== -->
    <div class="shrink-0 px-4 pt-3">
      <DeviceWarning />
    </div>

    <!-- ===== Search ===== -->
    <div class="shrink-0 px-4 pt-3">
      <SearchBar />
    </div>

    <!-- ===== Main Content: App Grid ===== -->
    <main class="flex-1 overflow-hidden px-4 pb-4 pt-3">
      <AppGrid />
    </main>

    <!-- ===== Dialogs & Panels ===== -->
    <SettingsDialog v-model:open="showSettings" />
    <ConfigPanel :open="showConfig" @close="showConfig = false" />

    <!-- Error from scrcpy -->
    <ErrorDialog
      :open="!!lastError"
      :message="lastError ?? ''"
      @close="lastError = null"
    />

    <!-- Desktop notice (web mode click) -->
    <ErrorDialog
      :open="showDesktopNotice"
      message="此功能仅限桌面版使用。请下载 Scrcpy Launcher 桌面客户端以通过 scrcpy 启动 Android 应用。"
      @close="showDesktopNotice = false"
    />
  </div>
</template>
