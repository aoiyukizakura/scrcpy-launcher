<script setup lang="ts">
import { ref, onMounted } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { useDevices } from "@/composables/useDevices";
import { useLauncher } from "@/composables/useLauncher";
import { useConfigStore } from "@/stores/config";
import type { EnvCheckResult } from "@/types";
import DeviceWarning from "@/components/DeviceWarning.vue";
import SearchBar from "@/components/SearchBar.vue";
import AppGrid from "@/components/AppGrid.vue";
import SettingsDialog from "@/components/SettingsDialog.vue";
import ConfigPanel from "@/components/ConfigPanel.vue";
import ErrorDialog from "@/components/ErrorDialog.vue";
import { Settings, Wrench } from "lucide-vue-next";

// ---- Environment check ----
const scrcpyFound = ref<boolean | null>(null);
const adbFound = ref<boolean | null>(null);

async function checkEnv() {
  try {
    const result = await invoke<EnvCheckResult>("check_environment");
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
const { lastError } = useLauncher();

// ---- Dialog visibility ----
const showSettings = ref(false);
const showConfig = ref(false);

// ---- Lifecycle ----
onMounted(async () => {
  await checkEnv();
  await configStore.load();
  // Start device polling if adb is available
  if (adbFound.value) {
    startPolling();
  }
});
</script>

<template>
  <div class="flex h-screen w-screen flex-col bg-zinc-950">
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
    <ErrorDialog
      :open="!!lastError"
      :message="lastError ?? ''"
      @close="lastError = null"
    />
  </div>
</template>
