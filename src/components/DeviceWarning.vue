<script setup lang="ts">
import { computed } from "vue";
import { useDeviceStore } from "@/stores/device";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-vue-next";

const deviceStore = useDeviceStore();

const status = computed(() => {
  if (!deviceStore.isPolling) return "idle";
  if (deviceStore.devices.length === 0) return "no-device";
  if (!deviceStore.hasDevice()) return "unauthorized";
  return "connected";
});

const statusConfig = computed(() => {
  switch (status.value) {
    case "idle":
      return {
        bg: "bg-zinc-800/50",
        border: "border-zinc-700",
        text: "text-zinc-400",
        icon: Loader2,
        iconClass: "animate-spin",
        message: "Checking device connection…",
      };
    case "no-device":
      return {
        bg: "bg-amber-950/30",
        border: "border-amber-800/50",
        text: "text-amber-200",
        icon: AlertTriangle,
        iconClass: "",
        message:
          "未检测到 ADB 设备，请检查 USB 调试并连接手机",
      };
    case "unauthorized":
      return {
        bg: "bg-red-950/30",
        border: "border-red-800/50",
        text: "text-red-200",
        icon: AlertTriangle,
        iconClass: "",
        message: "设备未授权 — 请在手机上确认 USB 调试授权",
      };
    case "connected":
      return {
        bg: "bg-emerald-950/20",
        border: "border-emerald-800/50",
        text: "text-emerald-200",
        icon: CheckCircle2,
        iconClass: "",
        message: `已连接: ${deviceStore.selectedSerial}`,
      };
  }
});
</script>

<template>
  <div
    :class="[
      statusConfig.bg,
      statusConfig.border,
      statusConfig.text,
    ]"
    class="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
  >
    <component
      :is="statusConfig.icon"
      :class="statusConfig.iconClass"
      class="h-4 w-4 shrink-0"
    />
    <span class="truncate">{{ statusConfig.message }}</span>

    <!-- Multi-device selector -->
    <select
      v-if="deviceStore.devices.length > 1"
      :value="deviceStore.selectedSerial"
      @change="deviceStore.selectDevice(($event.target as HTMLSelectElement).value)"
      class="ml-auto rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-brand-500"
    >
      <option
        v-for="d in deviceStore.devices"
        :key="d.serial"
        :value="d.serial"
      >
        {{ d.serial }} ({{ d.state }})
      </option>
    </select>
  </div>
</template>
