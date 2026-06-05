<script setup lang="ts">
import { ref, watch } from "vue";
import { X, Copy, Check } from "lucide-vue-next";

const props = defineProps<{
  open: boolean;
  message: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const copied = ref(false);

/** Copy error text to clipboard */
async function copyError() {
  try {
    await navigator.clipboard.writeText(props.message);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    // Fallback for environments without clipboard API
  }
}

// Reset copied state when dialog reopens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) copied.value = false;
  },
);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div
        class="mx-4 w-full max-w-lg rounded-xl border border-red-800/50 bg-zinc-950 shadow-2xl"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <h3 class="text-sm font-semibold text-red-400">启动错误</h3>
          <button
            @click="emit('close')"
            class="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Error content -->
        <div class="px-5 py-4">
          <pre
            class="max-h-64 overflow-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-300 whitespace-pre-wrap break-all font-mono leading-relaxed"
          >{{ message }}</pre>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 border-t border-zinc-800 px-5 py-3">
          <button
            @click="copyError"
            class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <Check v-if="copied" class="h-3.5 w-3.5 text-emerald-400" />
            <Copy v-else class="h-3.5 w-3.5" />
            {{ copied ? '已复制' : '复制日志' }}
          </button>
          <button
            @click="emit('close')"
            class="rounded-lg bg-zinc-800 px-4 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
