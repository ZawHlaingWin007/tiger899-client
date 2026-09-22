<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import axios from "axios";
import { showSuccessToast, showLoadingToast, closeToast } from "vant";
import { useTranslation } from "../composables/useTranslation";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "openRegister"]);

const store = useStore();
const { t } = useTranslation();
const router = useRouter();

const phone = ref("");
const password = ref("");
const error = ref(false);
const errors = ref({});
const isSignin = ref(false);
const isShow = ref(false);

const passwordInput = ref(null);

// Get contact info from store for Viber link
const contactInfo = computed(() => {
  return store?.state?.contactInfo || "";
});

// Viber link function
const viberLink = (phone) => {
  if (!phone) return "#";
  return `viber://contact?number=%2B${phone.replace("+", "")}`;
};

const togglePasswordVisibility = () => {
  if (isShow.value) {
    passwordInput.value.type = "password";
  } else {
    passwordInput.value.type = "text";
  }
  isShow.value = !isShow.value;
};

const focusOnPasswordInputBox = () => {
  if (passwordInput.value) {
    passwordInput.value.focus();
  }
};

const handleClose = () => {
  emit("close");
};

const handleOpenRegister = () => {
  emit("openRegister");
};

const handleLogin = async () => {
  isSignin.value = true;
  errors.value = {};
  error.value = false;

  // Validation
  if (!phone.value) {
    errors.value.phone = t(
      "Required Phone",
      "ဖုန်းနံပါတ် လိုအပ်ပါသည်။",
      "需要手机号",
      "ต้องใช้หมายเลขโทรศัพท์"
    );
    isSignin.value = false;
    return false;
  }

  if (!password.value) {
    errors.value.password = t(
      "Required Password",
      "Password လိုအပ်ပါသည်။",
      "需要密码",
      "ต้องใช้รหัสผ่าน",
    );
    isSignin.value = false;
    return false;
  }

  try {
    showLoadingToast({
      message: t(
        "Loading...",
        "ဆောင်ရွက်နေသည်...",
        "加载中...",
        "กำลังโหลด...",
      ),
      duration: 0,
      forbidClick: true,
    });
    const res = await axios.post("/auth/login", {
      phone: phone.value,
      password: password.value,
      roles: "normal",
      // fcm: localStorage.getItem('fcm'),
    });

    // Store credentials and token (phone for pre-fill on next login)
    localStorage.setItem("loginPhone", phone.value);
    localStorage.setItem("password", password.value);
    localStorage.setItem("token", res.data.token);

    // Set token expiration (1 hour)
    const currentTime = new Date();
    localStorage.setItem(
      "tokenExpire",
      new Date(currentTime.getTime() + 60 * 60 * 1000).toISOString(),
    );

    // Fetch user data
    await store.dispatch("fetchUser");

    // Show success message with toast
    showSuccessToast({
      message: t(
        "Login successful!",
        "အကောင့်ဝင်ခြင်း အောင်မြင်ပါသည်။",
        "登录成功！",
        "เข้าสู่ระบบสำเร็จ!",
      ),
      position: "top",
    });

    // Close modal and redirect
    handleClose();
    router.push("/");
  } catch (err) {
    console.log(err);
    error.value = true;
  } finally {
    isSignin.value = false;
    closeToast();
  }
};

// Auto-fill from localStorage
onMounted(() => {
  const storedPhone = localStorage.getItem("loginPhone");
  const userPassword = localStorage.getItem("password");
  if (storedPhone) phone.value = storedPhone;
  if (userPassword) password.value = userPassword;
});

// When modal opens, pre-fill from localStorage (e.g. after registration)
watch(
  () => props.isOpen,
  async (newVal) => {
    if (newVal) {
      const storedPhone = localStorage.getItem("loginPhone");
      const storedPass = localStorage.getItem("password");
      if (storedPhone) phone.value = storedPhone;
      if (storedPass) password.value = storedPass;
      const authUser = await store.dispatch("fetchUser");
      if (authUser && store.state.authUser?.roles === "normal") {
        handleClose();
        router.push("/");
      }
    }
  },
);
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    @click.self="handleClose"
  >
    <div
      class="bg-[#080E1E] rounded-2xl w-full max-w-md relative shadow-2xl border border-white/10 overflow-hidden"
    >
      <!-- Header -->
      <div class="bg-[#080E1E] px-6 pt-6 pb-5">
        <button
          @click="handleClose"
          class="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <h2 class="text-white text-xl font-bold font-['Pyidaungsu','Padauk',sans-serif] pr-8">
          {{ t("Login", "အကောင့်ဝင်ရန်", "登录", "เข้าสู่ระบบ") }}
        </h2>
        <p class="text-white/60 text-sm mt-1 font-['Pyidaungsu','Padauk',sans-serif]">
          {{ t("Sign in to your account", "သင့်အကောင့်သို့ ဝင်ရောက်ပါ", "登录您的账户", "เข้าสู่บัญชีของคุณ") }}
        </p>
      </div>

      <div class="px-6 py-5">
        <!-- Error Message -->
        <div
          v-if="error"
          class="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-sm font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{ t("Login Failed!", "အကောင့်ဝင်ခြင်း ကျရှုံးပါသည်။", "登录失败！", "เข้าสู่ระบบไม่สำเร็จ!") }}
        </div>

        <!-- Phone Field -->
        <div class="mb-3">
          <label class="block text-white/80 text-xs font-medium mb-1.5 font-['Pyidaungsu','Padauk',sans-serif]">
            {{ t("Phone", "ဖုန်းနံပါတ်", "手机号", "หมายเลขโทรศัพท์") }}
          </label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
            </span>
            <input
              v-model="phone"
              type="tel"
              :placeholder="t('Enter phone number', 'ဖုန်းနံပါတ်ထည့်ပါ', '请输入手机号', 'กรอกหมายเลขโทรศัพท์')"
              @keyup.enter="focusOnPasswordInputBox"
              class="w-full bg-[#172240]/80 text-white pl-10 pr-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#1986E1] focus:ring-1 focus:ring-[#1986E1]/50 font-['Pyidaungsu','Padauk',sans-serif] placeholder:text-white/40 transition-colors"
            />
          </div>
          <small v-if="errors.phone" class="text-red-400 text-xs mt-1 block font-['Pyidaungsu','Padauk',sans-serif]">{{ typeof errors.phone === 'string' ? errors.phone : errors.phone?.[0] }}</small>
        </div>

        <!-- Password Field -->
        <div class="mb-4">
          <label class="block text-white/80 text-xs font-medium mb-1.5 font-['Pyidaungsu','Padauk',sans-serif]">
            {{ t("Password", "စကားဝှက်", "密码", "รหัสผ่าน") }}
          </label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </span>
            <input
              ref="passwordInput"
              v-model="password"
              type="password"
              :placeholder="t('Enter password', 'စကားဝှက်ထည့်ပါ', '请输入密码', 'กรอกรหัสผ่าน')"
              @keyup.enter="handleLogin"
              class="w-full bg-[#172240]/80 text-white pl-10 pr-10 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#1986E1] focus:ring-1 focus:ring-[#1986E1]/50 font-['Pyidaungsu','Padauk',sans-serif] placeholder:text-white/40 transition-colors"
            />
            <button
              type="button"
              @click="togglePasswordVisibility"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white/80 transition-colors"
            >
              <svg v-if="!isShow" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
          <small v-if="errors.password" class="text-red-400 text-xs mt-1 block font-['Pyidaungsu','Padauk',sans-serif]">{{ typeof errors.password === 'string' ? errors.password : errors.password?.[0] }}</small>
        </div>

        <!-- Login Button -->
        <button
          type="button"
          @click="handleLogin"
          :disabled="isSignin"
          class="btn-app btn-app-blue w-full mt-1 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm font-['Pyidaungsu','Padauk',sans-serif] flex items-center justify-center gap-2"
        >
          <template v-if="!isSignin">{{ t("Login", "အကောင့်ဝင်ရန်", "登录", "เข้าสู่ระบบ") }}</template>
          <template v-else>
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ t("Logging in...", "ဝင်နေသည်...", "登录中...", "กำลังเข้าสู่ระบบ...") }}
          </template>
        </button>

        <!-- Viber Contact Link -->
        <!-- <div v-if="contactInfo" class="flex justify-center mt-4">
          <a
            :href="viberLink(contactInfo)"
            class="flex items-center gap-2 text-white/70 hover:text-white/90 transition-colors font-['Pyidaungsu','Padauk',sans-serif] text-sm"
          >
            <img src="https://space-tech.sgp1.cdn.digitaloceanspaces.com/shwe-ohh/general/shweohhhhh_viber.webp" class="w-9 h-9" alt="Viber" />
            <span>{{ t("Contact", "ဆက်သွယ်ရန်", "联系", "ติดต่อ") }}</span>
          </a>
        </div> -->

        <!-- Register Link -->
        <div class="mt-4 pt-4 border-t border-white/10 text-center">
          <span class="text-white/70 text-sm font-['Pyidaungsu','Padauk',sans-serif]">
            {{ t("No account?", "အကောင့်မရှိသေးပါ?", "还没有账号？", "ยังไม่มีบัญชี?") }}
          </span>
          <button
            type="button"
            @click.prevent="handleOpenRegister"
            class="text-[#38bdf8] hover:text-[#7dd3fc] text-sm font-semibold font-['Pyidaungsu','Padauk',sans-serif] ml-1.5 transition-colors"
          >
            {{ t("Register", "လျှောက်ထားပါ။", "注册", "สมัครสมาชิก") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

