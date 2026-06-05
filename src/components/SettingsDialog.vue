<script setup lang="ts">
import { ref, watch } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { useConfigStore } from "@/stores/config";
import type { EnvCheckResult } from "@/types";
import { X, FolderSearch, CheckCircle2, AlertTriangle } from "lucide-vue-next";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

function close() {
  emit("update:open", false);
}

const configStore = useConfigStore();
const envCheck = ref<EnvCheckResult | null>(null);
const checking = ref(false);

/** Re-check the environment */
async function checkEnvironment() {
  checking.value = true;
  try {
    envCheck.value = await invoke<EnvCheckResult>("check_environment");
  } catch (e) {
    console.error("Env check failed:", e);
  } finally {
    checking.value = false;
  }
}

// Run env check when dialog opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) checkEnvironment();
  },
);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      @click.self="close()"
    >
      <div
        class="mx-4 w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <h3 class="text-sm font-semibold text-zinc-200">环境设置</h3>
          <button
            @click="close()"
            class="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Content -->
        <div class="space-y-4 px-5 py-4">
          <!-- Environment status -->
          <div class="space-y-2">
            <h4 class="text-xs font-medium text-zinc-400">依赖检测</h4>
            <div class="space-y-1.5">
              <div class="flex items-center gap-2 text-sm">
                <CheckCircle2
                  v-if="envCheck?.scrcpy"
                  class="h-4 w-4 text-emerald-400"
                />
                <AlertTriangle
                  v-else-if="envCheck && !envCheck.scrcpy"
                  class="h-4 w-4 text-amber-400"
                />
                <span
                  v-else
                  class="h-4 w-4 animate-pulse rounded-full bg-zinc-700"
                />
                <span class="text-zinc-300">scrcpy</span>
                <span
                  v-if="envCheck"
                  :class="envCheck.scrcpy ? 'text-emerald-400' : 'text-amber-400'"
                  class="ml-auto text-xs"
                >
                  {{ envCheck.scrcpy ? '已找到' : '未找到' }}
                </span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <CheckCircle2
                  v-if="envCheck?.adb"
                  class="h-4 w-4 text-emerald-400"
                />
                <AlertTriangle
                  v-else-if="envCheck && !envCheck.adb"
                  class="h-4 w-4 text-amber-400"
                />
                <span
                  v-else
                  class="h-4 w-4 animate-pulse rounded-full bg-zinc-700"
                />
                <span class="text-zinc-300">adb</span>
                <span
                  v-if="envCheck"
                  :class="envCheck.adb ? 'text-emerald-400' : 'text-amber-400'"
                  class="ml-auto text-xs"
                >
                  {{ envCheck.adb ? '已找到' : '未找到' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Manual path overrides -->
          <div class="space-y-3">
            <h4 class="text-xs font-medium text-zinc-400">手动路径覆盖</h4>
            <div>
              <label class="mb-1 block text-xs text-zinc-500">scrcpy 路径</label>
              <input
                v-model="configStore.scrcpyPath"
                type="text"
                placeholder="留空则使用系统 PATH"
                class="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-brand-600/50"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs text-zinc-500">adb 路径</label>
              <input
                v-model="configStore.adbPath"
                type="text"
                placeholder="留空则使用系统 PATH"
                class="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-brand-600/50"
              />
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 border-t border-zinc-800 px-5 py-3">
          <button
            @click="checkEnvironment"
            :disabled="checking"
            class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50"
          >
            <FolderSearch class="h-3.5 w-3.5" />
            重新检测
          </button>
          <button
            @click="configStore.save(); close()"
            class="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-500"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
