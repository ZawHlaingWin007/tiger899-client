<script setup>
import { computed } from "vue";
import { showConfirmDialog, showDialog } from "vant";
import { useTranslation } from "../composables/useTranslation";
import { usePwaInstall } from "../composables/usePwaInstall";

const { t } = useTranslation();
const { isInstalled, platform, promptInstall, getInstallUrl } = usePwaInstall();

const installUrl = getInstallUrl();
const qrSrc = computed(
  () =>
    `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(installUrl)}`,
);

const showInfo = (message) =>
  showDialog({
    title: "Tiger899",
    message,
    confirmButtonText: t("OK", "အိုကေ", "好的", "ตกลง"),
    theme: "round-button",
    className: "logout-dialog-dark",
    confirmButtonColor: "#1986E1",
  });

const confirmAndInstall = async (target) => {
  const isIosTarget = target === "ios";

  if (isInstalled.value) {
    await showInfo(
      t(
        "Tiger899 is already installed on this device.",
        "Tiger899 ကို ဤစက်တွင် ထည့်သွင်းပြီးဖြစ်ပါသည်။",
        "Tiger899 已安装在此设备上。",
        "ติดตั้ง Tiger899 บนอุปกรณ์นี้แล้ว",
      ),
    );
    return;
  }

  if (platform === "desktop") {
    await showInfo(
      t(
        "Scan the QR code with your phone, or use Chrome on this device to install Tiger899.",
        "ဖုန်းဖြင့် QR ကုဒ်ကို စကင်ဖတ်ပါ။ သို့မဟုတ် ဤစက်တွင် Chrome ဖြင့် Tiger899 ကို ထည့်သွင်းပါ။",
        "请用手机扫描二维码，或在此设备的 Chrome 中安装 Tiger899。",
        "สแกน QR Code ด้วยโทรศัพท์ หรือติดตั้ง Tiger899 ใน Chrome บนอุปกรณ์นี้",
      ),
    );
    return;
  }

  if (
    (isIosTarget && platform !== "ios") ||
    (!isIosTarget && platform !== "android")
  ) {
    await showInfo(
      isIosTarget
        ? t(
            "Install the iOS app from an iPhone or iPad.",
            "iOS အက်ပ်ကို iPhone သို့မဟုတ် iPad မှသာ ထည့်သွင်းနိုင်ပါသည်။",
            "请在 iPhone 或 iPad 上安装 iOS 应用。",
            "ติดตั้งแอป iOS จาก iPhone หรือ iPad เท่านั้น",
          )
        : t(
            "Install the Android app from an Android device.",
            "Android အက်ပ်ကို Android ဖုန်းမှသာ ထည့်သွင်းနိုင်ပါသည်။",
            "请在 Android 设备上安装应用。",
            "ติดตั้งแอป Android จากอุปกรณ์ Android เท่านั้น",
          ),
    );
    return;
  }

  try {
    await showConfirmDialog({
      title: "Tiger899",
      message: isIosTarget
        ? t(
            "Install Tiger899 on your iPhone or iPad?",
            "iPhone သို့မဟုတ် iPad တွင် Tiger899 ကို ထည့်သွင်းမလား?",
            "要在 iPhone 或 iPad 上安装 Tiger899 吗？",
            "ติดตั้ง Tiger899 บน iPhone หรือ iPad หรือไม่?",
          )
        : t(
            "Install Tiger899 on your Android device?",
            "Android ဖုန်းတွင် Tiger899 ကို ထည့်သွင်းမလား?",
            "要在 Android 设备上安装 Tiger899 吗？",
            "ติดตั้ง Tiger899 บนอุปกรณ์ Android หรือไม่?",
          ),
      cancelButtonText: t("Cancel", "မလုပ်တော့ပါ", "取消", "ยกเลิก"),
      confirmButtonText: t("Download", "ဒေါင်းလုဒ်", "下载", "ดาวน์โหลด"),
      theme: "round-button",
      className: "logout-dialog-dark",
      confirmButtonColor: "#1986E1",
    });
  } catch {
    return;
  }

  const result = await promptInstall();

  if (result.outcome === "ios-instructions") {
    await showInfo(
      t(
        "Tap Share, then Add to Home Screen to install Tiger899.",
        "Share ကိုနှိပ်ပြီး Add to Home Screen ကိုရွေး၍ Tiger899 ကို ထည့်သွင်းပါ။",
        "点击分享，然后选择“添加到主屏幕”以安装 Tiger899。",
        "แตะแชร์ แล้วเลือกเพิ่มไปยังหน้าจอโฮม เพื่อติดตั้ง Tiger899",
      ),
    );
    return;
  }

  if (result.outcome === "unavailable") {
    await showInfo(
      t(
        "Open this page in Chrome, tap the menu, then Install app to add Tiger899.",
        "ဤစာမျက်နှာကို Chrome တွင်ဖွင့်ပြီး မီနူးမှ Install app ကိုနှိပ်၍ Tiger899 ကို ထည့်သွင်းပါ။",
        "请在 Chrome 中打开此页面，点击菜单后选择“安装应用”以添加 Tiger899。",
        "เปิดหน้านี้ใน Chrome แตะเมนู แล้วเลือกติดตั้งแอป เพื่อเพิ่ม Tiger899",
      ),
    );
  }
};

const handleIosDownload = () => confirmAndInstall("ios");
const handleAndroidDownload = () => confirmAndInstall("android");
</script>

<template>
  <h1
    class="text-lg sm:text-xl md:text-3xl font-bold text-white mb-2 md:mb-3 mt-3 md:mt-4 px-3 sm:px-4 md:px-0 font-['Pyidaungsu','Padauk',sans-serif]"
  >
    {{ t("Download the app", "အက်ပ်ကို ဒေါင်းလုဒ်လုပ်ပါ။", "下载应用", "ดาวน์โหลดแอป") }}
  </h1>
  <div class="px-3 sm:px-4 py-4 md:py-6 lg:py-8 bg-[#172240] text-white">
    <div
      class="relative overflow-hidden rounded-xl md:rounded-2xl border-none bg-cover bg-center"
      style="
        background-image: url(/download-bg.png);
        background-size: contain;
        background-position: 50%;
        background-repeat: no-repeat;
      "
    >
      <div class="absolute inset-0 bg-black/40" />

      <!-- Stack on mobile, side-by-side from md -->
      <div
        class="flex flex-col md:flex-row md:items-center gap-3 md:gap-5 lg:gap-8 p-3 sm:p-4 md:p-6 relative"
      >
        <!-- Hero image: smaller on mobile, full width in column -->
        <div class="flex justify-center items-end order-2 md:order-1 shrink-0">
          <img
            src="@/assets/mock-download2.png"
            :alt="t('Tiger899 Download', 'Tiger899 ဒေါင်းလုဒ်', 'Tiger899 下载', 'Tiger899 ดาวน์โหลด')"
            class="w-full max-w-[200px] sm:max-w-[280px] md:max-w-[320px] lg:max-w-[420px] drop-shadow-2xl object-contain"
          />
        </div>

        <!-- Content -->
        <div class="space-y-4 md:space-y-6 order-1 md:order-2 min-w-0">
          <div class="flex items-center gap-2 md:gap-3">
            <img
              src="@/assets/tiger899-logo.png"
              :alt="t('Tiger899 Logo', 'Tiger899 လိုဂို', 'Tiger899 标志', 'โลโก้ Tiger899')"
              class="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain shrink-0"
            />
            <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold truncate">
              Tiger899
            </h2>
          </div>

          <ol
            class="space-y-2 md:space-y-3 text-sm sm:text-base md:text-lg font-['Pyidaungsu','Padauk',sans-serif] text-white/90 leading-relaxed"
          >
            <li>
              1. {{ t("Scan the QR code to get the download link.", "အသင့်တင်ထားသော လင့်အားတင်ဆောင်ရယူရန် QR ကုဒ်ကို စကင်ဖတ်ပါ။", "扫描二维码获取下载链接。", "สแกน QR Code เพื่อรับลิงก์ดาวน์โหลด") }}
            </li>
            <li>2. {{ t("Tap \"Allow\" to install.", "အသင့်ကို အော်ဒာထုတ်ရန် \"Allow\" ကို နှိပ်ပါ။", "点击「允许」以安装。", "แตะ \"Allow\" เพื่อติดตั้ง") }}</li>
            <li>3. {{ t("Log in or create a new account.", "အကောင့်ဝင်ပြီး (သို့) အကောင့်အသစ်ပြုလုပ်ပါ။", "登录或注册新账户。", "เข้าสู่ระบบหรือสร้างบัญชีใหม่") }}</li>
          </ol>

          <div
            class="grid grid-cols-2 sm:grid-cols-2 gap-4 md:gap-6 items-start font-['Pyidaungsu','Padauk',sans-serif]"
          >
            <div class="text-center flex flex-col items-center gap-1 md:gap-2">
              <img
                :src="qrSrc"
                :alt="t('iOS Lite App QR', 'iOS Lite App QR', 'iOS 轻量版应用二维码', 'QR แอป iOS Lite')"
                class="mx-auto w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-white rounded-lg p-1.5 md:p-2 shrink-0"
              />
              <div class="space-y-0.5 md:space-y-1">
                <p class="text-white text-xs sm:text-base md:text-lg font-semibold">
                  {{ t("Download", "ဒေါင်းလုဒ်ရန်", "下载", "ดาวน์โหลด") }}
                </p>
                <p class="text-white text-xs sm:text-base md:text-lg font-semibold">
                  {{ t("Scan QR code", "QR ကို စကင်ဖတ်ပါ", "扫描二维码", "สแกน QR Code") }}
                </p>
                <p class="text-[#1d9bf0] font-bold uppercase text-xs sm:text-sm">
                  IOS LITE-APP
                </p>
                <button
                  type="button"
                  class="mt-1 inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#1986E1] hover:bg-[#156FBD] text-[11px] sm:text-xs font-semibold text-white shadow-md shadow-[#1986E1]/30 transition"
                  @click="handleIosDownload"
                >
                  <svg
                    class="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 3a1 1 0 0 1 1 1v9.586l3.293-3.293a1 1 0 0 1 1.414 1.414l-5 5a1.002 1.002 0 0 1-1.414 0l-5-5A1 1 0 0 1 7.707 10.293L11 13.586V4a1 1 0 0 1 1-1Z"
                    />
                  </svg>
                  <span>{{ t("Download", "ဒေါင်းလုဒ်", "下载", "ดาวน์โหลด") }}</span>
                </button>
              </div>
            </div>
            <div class="text-center flex flex-col items-center gap-1 md:gap-2">
              <img
                :src="qrSrc"
                :alt="t('Android App QR', 'Android အက်ပ် QR', 'Android 应用二维码', 'QR แอป Android')"
                class="mx-auto w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-white rounded-lg p-1.5 md:p-2 shrink-0"
              />
              <div class="space-y-0.5 md:space-y-1">
                <p class="text-white text-xs sm:text-base md:text-lg font-semibold">
                  {{ t("Download", "ဒေါင်းလုဒ်ရန်", "下载", "ดาวน์โหลด") }}
                </p>
                <p class="text-white text-xs sm:text-base md:text-lg font-semibold">
                  {{ t("Scan QR code", "QR ကို စကင်ဖတ်ပါ", "扫描二维码", "สแกน QR Code") }}
                </p>
                <p class="text-[#1d9bf0] font-bold uppercase text-xs sm:text-sm">
                  Android APP
                </p>
                <button
                  type="button"
                  class="mt-1 inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#16a34a] hover:bg-[#15803d] text-[11px] sm:text-xs font-semibold text-white shadow-md shadow-emerald-500/30 transition"
                  @click="handleAndroidDownload"
                >
                  <svg
                    class="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 3a1 1 0 0 1 1 1v9.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-5 5a1.002 1.002 0 0 1-1.414 0l-5-5A1 1 0 0 1 7.707 10.293L11 13.586V4a1 1 0 0 1 1-1Z"
                    />
                  </svg>
                  <span>{{ t("Download", "ဒေါင်းလုဒ်", "下载", "ดาวน์โหลด") }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
