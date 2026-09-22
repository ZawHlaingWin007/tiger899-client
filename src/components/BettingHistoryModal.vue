<script setup>
import { useTranslation } from "../composables/useTranslation";
import { useModal } from "../composables/useModal";
import BettingHistoryContent from "./BettingHistoryContent.vue";

const props = defineProps({
  isOpen: { type: Boolean, default: false },
});

const emit = defineEmits(["close"]);
const { t } = useTranslation();
const { closeBettingHistoryModal } = useModal();

function handleClose() {
  closeBettingHistoryModal();
  emit("close");
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
    @click.self="handleClose"
  >
    <div
      class="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
    >
      <div
        class="sticky top-0 z-10 flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-white rounded-t-2xl"
      >
        <h2
          class="text-xl font-bold text-gray-900 font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{
            t(
              "Betting History",
              "လောင်းကြေးမှတ်တမ်း",
              "投注记录",
              "บันทึกการเดิมพัน",
            )
          }}
        </h2>
        <button
          type="button"
          @click="handleClose"
          class="text-gray-500 hover:text-gray-700 p-2 rounded-lg transition-colors"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div class="overflow-y-auto flex-1 min-h-0">
        <BettingHistoryContent embedded />
      </div>
    </div>
  </div>
</template>
