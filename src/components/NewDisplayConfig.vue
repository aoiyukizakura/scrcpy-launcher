<script setup lang="ts">
import { computed } from "vue";
import { useConfigStore } from "@/stores/config";
import { Monitor } from "lucide-vue-next";

const configStore = useConfigStore();
const p = configStore.params;

/**
 * Preview the assembled --new-display argument value.
 * This is just a display hint — actual assembly happens in useLauncher.
 */
const preview = computed(() => {
  const res = p.newDisplayResolution;
  const dpi = p.newDisplayDpi;
  const flex = p.flexibleDisplay;
  const parts: string[] = [];
  if (flex) parts.push("-x");
  if (res && dpi) parts.push(`--new-display=${res}/${dpi}`);
  else if (res) parts.push(`--new-display=${res}`);
  else if (dpi) parts.push(`--new-display=${dpi}`);
  if (parts.length === 0) return "（未启用）";
  return parts.join(" ");
});
</script>

<template>
  <div class="space-y-3 rounded-lg border border-zinc-800/60 bg-zinc-900/30 p-3">
    <div class="flex items-center gap-2">
      <Monitor class="h-4 w-4 text-brand-400" />
      <span class="text-xs font-medium text-zinc-300">New Display（虚拟显示器）</span>
    </div>

    <!-- Flexible display toggle -->
    <label
      class="group flex cursor-pointer select-none items-center gap-2.5 rounded-md border border-zinc-800/40 bg-zinc-900/50 px-2.5 py-2 transition-colors hover:border-zinc-700/60 hover:bg-zinc-900/70"
    >
      <!-- Hidden native checkbox (v-model + a11y) -->
      <input
        v-model="p.flexibleDisplay"
        type="checkbox"
        class="peer sr-only"
      />

      <!-- Custom toggle track -->
      <div
        class="relative h-4 w-7 shrink-0 rounded-full transition-colors duration-200 ease-out
          bg-zinc-700
          peer-checked:bg-brand-600/80
          peer-focus-visible:ring-1 peer-focus-visible:ring-brand-500/50 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-zinc-900"
      >
        <!-- Toggle thumb -->
        <div
          class="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out
            peer-checked:translate-x-3"
        />
      </div>

      <div class="flex flex-col gap-px leading-none">
        <span class="text-xs text-zinc-300 transition-colors group-hover:text-zinc-200">
          弹性显示
        </span>
        <span class="text-[10px] text-zinc-500">附加 <code class="text-[10px] text-zinc-500">-x</code> / <code class="text-[10px] text-zinc-500">--flex-display</code></span>
      </div>
    </label>

    <div class="grid grid-cols-2 gap-2">
      <!-- Resolution input -->
      <div>
        <label class="mb-1 block text-[10px] text-zinc-500">分辨率 (WxH)</label>
        <input
          v-model="p.newDisplayResolution"
          type="text"
          placeholder="例如 1920x1080"
          class="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-brand-600/50"
        />
      </div>

      <!-- DPI input -->
      <div>
        <label class="mb-1 block text-[10px] text-zinc-500">PPI / DPI</label>
        <input
          v-model.number="p.newDisplayDpi"
          type="number"
          placeholder="例如 224"
          class="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-brand-600/50"
        />
      </div>
    </div>
    <!-- Preview -->
    <div class="rounded-md bg-zinc-950 px-2.5 py-1.5">
      <code class="text-[10px] text-zinc-500">{{ preview }}</code>
    </div>
  </div>
</template>
