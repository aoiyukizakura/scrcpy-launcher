<script setup lang="ts">
import { useConfigStore } from "@/stores/config";
import NewDisplayConfig from "./NewDisplayConfig.vue";
import { X } from "lucide-vue-next";

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const configStore = useConfigStore();
const p = configStore.params;

/** Video codec options per scrcpy v4.0 docs */
const videoCodecOptions = [
  { value: null, label: "默认 (h264)" },
  { value: "h264", label: "H.264" },
  { value: "h265", label: "H.265 / HEVC" },
  { value: "av1", label: "AV1" },
];

/** Audio codec options per scrcpy v4.0 docs */
const audioCodecOptions = [
  { value: null, label: "默认 (opus)" },
  { value: "opus", label: "Opus" },
  { value: "aac", label: "AAC" },
  { value: "flac", label: "FLAC" },
  { value: "raw", label: "Raw (无压缩)" },
];
</script>

<template>
  <Teleport to="body">
    <Transition name="slide">
      <div
        v-if="open"
        class="fixed inset-y-0 right-0 z-40 flex w-80 flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 class="text-sm font-semibold text-zinc-200">
            全局参数配置
          </h2>
          <button
            @click="emit('close')"
            class="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Scrollable content -->
        <div class="flex-1 space-y-5 overflow-y-auto p-4">
          <!-- ===== Boolean Switches ===== -->
          <section class="space-y-3">
            <h3 class="text-xs font-medium text-zinc-400">开关选项</h3>

            <label class="flex items-center justify-between">
              <span class="text-xs text-zinc-300">关闭手机屏幕</span>
              <button
                @click="p.turnScreenOff = !p.turnScreenOff"
                :class="p.turnScreenOff ? 'bg-brand-600' : 'bg-zinc-700'"
                class="relative h-5 w-9 rounded-full transition-colors"
              >
                <span
                  :class="p.turnScreenOff && 'translate-x-4'"
                  class="absolute left-0.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white transition-transform"
                />
              </button>
            </label>

            <label class="flex items-center justify-between">
              <span class="text-xs text-zinc-300">模拟键盘 (UHID)</span>
              <button
                @click="p.keyboardUhid = !p.keyboardUhid"
                :class="p.keyboardUhid ? 'bg-brand-600' : 'bg-zinc-700'"
                class="relative h-5 w-9 rounded-full transition-colors"
              >
                <span
                  :class="p.keyboardUhid && 'translate-x-4'"
                  class="absolute left-0.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white transition-transform"
                />
              </button>
            </label>

            <label class="flex items-center justify-between">
              <span class="text-xs text-zinc-300">模拟手柄/游戏控制器 (Gamepad UHID)</span>
              <button
                @click="p.gamepadUhid = !p.gamepadUhid"
                :class="p.gamepadUhid ? 'bg-brand-600' : 'bg-zinc-700'"
                class="relative h-5 w-9 rounded-full transition-colors"
              >
                <span
                  :class="p.gamepadUhid && 'translate-x-4'"
                  class="absolute left-0.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white transition-transform"
                />
              </button>
            </label>

            <label class="flex items-center justify-between">
              <span class="text-xs text-zinc-300">保持唤醒</span>
              <button
                @click="p.stayAwake = !p.stayAwake"
                :class="p.stayAwake ? 'bg-brand-600' : 'bg-zinc-700'"
                class="relative h-5 w-9 rounded-full transition-colors"
              >
                <span
                  :class="p.stayAwake && 'translate-x-4'"
                  class="absolute left-0.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white transition-transform"
                />
              </button>
            </label>

            <label class="flex items-center justify-between">
              <span class="text-xs text-zinc-300">窗口置顶</span>
              <button
                @click="p.alwaysOnTop = !p.alwaysOnTop"
                :class="p.alwaysOnTop ? 'bg-brand-600' : 'bg-zinc-700'"
                class="relative h-5 w-9 rounded-full transition-colors"
              >
                <span
                  :class="p.alwaysOnTop && 'translate-x-4'"
                  class="absolute left-0.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white transition-transform"
                />
              </button>
            </label>
          </section>

          <!-- ===== Numeric Inputs ===== -->
          <section class="space-y-3">
            <h3 class="text-xs font-medium text-zinc-400">性能参数</h3>

            <div>
              <label class="mb-1 block text-xs text-zinc-500">最大分辨率</label>
              <input
                v-model.number="p.maxSize"
                type="number"
                placeholder="留空使用默认"
                class="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-brand-600/50"
              />
            </div>

            <div>
              <label class="mb-1 block text-xs text-zinc-500">最大帧率 (FPS)</label>
              <input
                v-model.number="p.maxFps"
                type="number"
                placeholder="留空使用默认"
                class="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-brand-600/50"
              />
            </div>

            <div>
              <label class="mb-1 block text-xs text-zinc-500">视频码率</label>
              <input
                v-model="p.videoBitRate"
                type="text"
                placeholder="例如 24M"
                class="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-brand-600/50"
              />
            </div>
          </section>

          <!-- ===== Codec Selects ===== -->
          <section class="space-y-3">
            <h3 class="text-xs font-medium text-zinc-400">编解码器</h3>

            <div>
              <label class="mb-1 block text-xs text-zinc-500">视频编码</label>
              <select
                v-model="p.videoCodec"
                class="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-brand-600/50"
              >
                <option
                  v-for="opt in videoCodecOptions"
                  :key="opt.value ?? 'default'"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-xs text-zinc-500">音频编码</label>
              <select
                v-model="p.audioCodec"
                class="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-brand-600/50"
              >
                <option
                  v-for="opt in audioCodecOptions"
                  :key="opt.value ?? 'default'"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </section>

          <!-- ===== New Display (Composite) ===== -->
          <section>
            <NewDisplayConfig />
          </section>
        </div>

        <!-- Footer hint -->
        <div class="border-t border-zinc-800 px-4 py-2.5">
          <p class="text-[10px] text-zinc-500 leading-relaxed">
            参数实时生效，每次点击「运行」时会自动拼接当前配置。
            参考 scrcpy v4.0 官方文档。
          </p>
        </div>
      </div>
    </Transition>

    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-30 bg-black/40"
        @click="emit('close')"
      />
    </Transition>
  </Teleport>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
