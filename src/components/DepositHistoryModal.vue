<script setup>
import { useTranslation } from "../composables/useTranslation";
import { useModal } from "../composables/useModal";
import DepositHistoryPage from "../pages/DepositHistoryPage.vue";

const props = defineProps({
  isOpen: { type: Boolean, default: false },
});

const emit = defineEmits(["close"]);
const { t } = useTranslation();
const {
  closeDepositHistoryModal,
  openWithdrawHistoryModal,
} = useModal();

function handleClose() {
  closeDepositHistoryModal();
  emit("close");
}

function openWithdraw() {
  closeDepositHistoryModal();
  openWithdrawHistoryModal();
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
    @click.self="handleClose"
  >
    <div
      class="bg-[#172240] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/10"
    >
      <div
        class="sticky top-0 z-10 flex items-center justify-between px-4 py-4 border-b border-white/10 bg-[#172240] rounded-t-2xl"
      >
        <h2
          class="text-xl font-bold text-white font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{
            t(
              "Deposit History",
              "ငွေဖြည့်မှတ်တမ်း",
              "充值记录",
              "ประวัติการฝากเงิน",
            )
          }}
        </h2>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="text-white/80 hover:text-white text-sm font-['Pyidaungsu','Padauk',sans-serif] px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
            @click="openWithdraw"
          >
            {{ t("Withdraw History", "ထုတ်ယူမှတ်တမ်း", "提现记录", "ประวัติการถอนเงิน") }}
          </button>
          <button
            type="button"
            @click="handleClose"
            class="text-white/80 hover:text-white p-2 rounded-lg transition-colors"
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
      </div>
      <div class="overflow-y-auto flex-1 min-h-0">
        <DepositHistoryPage embedded />
      </div>
    </div>
  </div>
</template>
