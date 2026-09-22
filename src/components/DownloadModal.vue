<template>
  <Teleport to="body">
    <Transition name="van-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="$emit('close')"
      >
        <!-- Close X - top right -->
        <button
          type="button"
          class="absolute top-4 right-4 z-10 p-2 text-white hover:text-white/80 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close"
          @click="$emit('close')"
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

        <!-- Modal card -->
        <div
          class="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl bg-[#080E1E]"
          @click.stop
        >
          <!-- Top banner: futuristic image + text -->
          <div
            class="relative h-44 sm:h-52 bg-cover bg-center bg-no-repeat"
            :style="{ backgroundImage: `url(${bannerImage})` }"
          >
            <div
              class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent"
            />
            <div class="absolute inset-0 flex items-center px-5 sm:px-6">
              <h2
                class="text-5xl w-[200px] sm:text-2xl font-bold text-white font-['Pyidaungsu','Padauk',sans-serif] drop-shadow-[0_0_8px_rgba(0,0,0,0.9)]"
                style="text-shadow: 0 0 4px #000, 0 0 8px #000, 0 1px 2px #000"
              >
                {{
                  t(
                    "Download the APP",
                    "APP ကို ဒေါင်းလုဒ် လုပ်ပါ။",
                    "下载APP",
                    "ดาวน์โหลดแอป"
                  )
                }}
              </h2>
            </div>
          </div>

          <!-- Bottom CTA bar -->
          <div
            class="flex items-center gap-3 sm:gap-4 px-4 py-4 bg-[#0F212E] border-t border-white/10"
          >
            <!-- App icon -->
            <div
              class="flex items-center w-full rounded-md p-2 justify-between bg-[#080E1E]"
            >
              <div class="flex items-center gap-2">
                <img src="@/assets/tiger899-logo.png" alt="Tiger899" class="w-[50px] h-auto object-contain" />
                <div class="flex-1 min-w-0">
                  <p class="text-white text-sm sm:text-base font-bold font-['Pyidaungsu','Padauk',sans-serif]">
                    Tiger899
                  </p>
                  <p
                    class="text-white/80 text-xs sm:text-sm font-['Pyidaungsu','Padauk',sans-serif]"
                  >
                    {{
                      t(
                        "Install iOS APP",
                        "iOS APP ထည့်သွင်းပါ။",
                        "安装iOS APP",
                        "ติดตั้งแอป iOS"
                      )
                    }}
                  </p>
                </div>
              </div>

              <!-- Download button -->
              <button
                type="button"
                class="shrink-0 px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 !text-[#080E1E] font-bold text-sm font-['Pyidaungsu','Padauk',sans-serif] transition-colors"
                @click="
                  $emit('download');
                  $emit('close');
                "
              >
                {{ t("Download", "ဒေါင်းလုဒ်", "下载", "ดาวน์โหลด") }}
              </button>
            </div>

            <!-- Text -->
          </div>
          <div
            class="flex items-center gap-3 sm:gap-4 px-4 py-4 bg-[#0F212E] border-t border-white/10"
          >
            <!-- App icon -->
            <div
              class="flex items-center w-full rounded-md p-2 justify-between bg-[#080E1E]"
            >
              <div class="flex items-center gap-2">
                <img src="@/assets/tiger899-logo.png" alt="Tiger899" class="w-[50px] h-auto object-contain" />
                <div class="flex-1 min-w-0">
                  <p class="text-white text-sm sm:text-base font-bold font-['Pyidaungsu','Padauk',sans-serif]">
                    Tiger899
                  </p>
                  <p
                    class="text-white/80 text-xs sm:text-sm font-['Pyidaungsu','Padauk',sans-serif]"
                  >
                    {{
                      t(
                        "Install Android APP",
                        "Android APP ထည့်သွင်းပါ။",
                        "安装安卓APP",
                        "ติดตั้งแอป Android"
                      )
                    }}
                  </p>
                </div>
              </div>

              <!-- Download button -->
              <button
                type="button"
                class="shrink-0 px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 !text-[#080E1E] font-bold text-sm font-['Pyidaungsu','Padauk',sans-serif] transition-colors"
                @click="
                  $emit('download');
                  $emit('close');
                "
              >
                {{ t("Download", "ဒေါင်းလုဒ်", "下载", "ดาวน์โหลด") }}
              </button>
            </div>

            <!-- Text -->
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useTranslation } from "../composables/useTranslation";
defineOptions({ name: "DownloadModal" });

const props = defineProps({
  show: { type: Boolean, default: false },
  /** Banner image URL (top section). Default: /download-banner.png */
  bannerImage: { type: String, default: "/download-banner.png" },
});

defineEmits(["close", "download"]);

const { t } = useTranslation();
</script>

<style scoped>
.download-modal-title {
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  /* Optional: thin stroke so text stays readable on any background */
  -webkit-text-stroke: 1px rgba(0, 0, 0, 0.3);
  paint-order: stroke fill;
}
</style>
