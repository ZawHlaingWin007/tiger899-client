<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import axios from "axios";
import { showLoadingToast, closeToast, showSuccessToast } from "vant";
import { useTranslation } from "../composables/useTranslation";
import { useQuickLogin } from "../composables/useQuickLogin";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "openLogin"]);

const { t } = useTranslation();
const router = useRouter();
const route = useRoute();
const { isQuickLogin, quickLogin } = useQuickLogin();

const userName = ref("");
const phone = ref("");
const password = ref("");
const confirmPassword = ref("");
const referralCode = ref(localStorage.getItem("referralCode") || "");
const storedCode = ref(localStorage.getItem("referralCode"));
const error = ref(null);
const errors = ref({});
const isSignin = ref(false);
const isShowPassword = ref(false);
const isShowConfirmPassword = ref(false);
const showSuccessBox = ref(false);
const successPhone = ref("");
const successUsername = ref("");
const successPassword = ref("");

const passwordInput = ref(null);
const confirmPasswordInput = ref(null);

const togglePasswordVisibility = () => {
  if (isShowPassword.value) {
    passwordInput.value.type = "password";
  } else {
    passwordInput.value.type = "text";
  }
  isShowPassword.value = !isShowPassword.value;
};

const toggleConfirmPasswordVisibility = () => {
  if (isShowConfirmPassword.value) {
    confirmPasswordInput.value.type = "password";
  } else {
    confirmPasswordInput.value.type = "text";
  }
  isShowConfirmPassword.value = !isShowConfirmPassword.value;
};

const handleClose = () => {
  showSuccessBox.value = false;
  emit("close");
};

const handleOpenLogin = () => {
  emit("openLogin");
};

const handleQuickLogin = () => {
  quickLogin({ onSuccess: handleClose });
};

const copyToClipboard = async (text, label) => {
  try {
    await navigator.clipboard.writeText(text);
    // Optional: show a brief toast - Vant showToast if available
    if (typeof showSuccessToast !== "undefined") {
      showSuccessToast({ message: t("Copied!", "ကူးယူပြီး!", "已复制!", "คัดลอกแล้ว!"), position: "top" });
    }
  } catch {
    // fallback for older browsers
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
};

const goToLogin = () => {
  localStorage.setItem("loginPhone", successPhone.value);
  localStorage.setItem("password", successPassword.value);
  showSuccessBox.value = false;
  handleClose();
  emit("openLogin");
};

const handleRegister = async () => {
  isSignin.value = true;
  error.value = null;
  errors.value = {};

  if (!userName.value) {
    error.value = t(
      "Required User Name",
      "User name လိုအပ်ပါသည်။",
      "需要用户名",
      "ต้องใช้ชื่อผู้ใช้"
    );
    isSignin.value = false;
    return false;
  }

  if (!phone.value) {
    error.value = t(
      "Required Phone",
      "ဖုန်းနံပါတ် လိုအပ်ပါသည်။",
      "需要手机号",
      "ต้องใช้หมายเลขโทรศัพท์"
    );
    isSignin.value = false;
    return false;
  }

  if (!password.value) {
    error.value = t(
      "Required Password",
      "Password လိုအပ်ပါသည်။",
      "需要密码",
      "ต้องใช้รหัสผ่าน"
    );
    isSignin.value = false;
    return false;
  }

  if (password.value !== confirmPassword.value) {
    error.value = t(
      "Password Not Match",
      "Password Not Match",
      "密码不匹配",
      "รหัสผ่านไม่ตรงกัน"
    );
    isSignin.value = false;
    return false;
  }

  try {
    showLoadingToast({
      message: t("Loading...", "ဆောင်ရွက်နေသည်...", "加载中...", "กำลังโหลด..."),
      duration: 0,
      forbidClick: true,
    });
    const userData = {
      user_name: userName.value,
      phone: phone.value,
      roles: "normal",
      type: "login",
      password: password.value,
      confirmPassword: confirmPassword.value,
      referralCode: referralCode.value,
    };

    const res = await axios.post(
      "/auth/register",
      { ...userData },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (res.data.status === "success") {
      successPhone.value = res.data.data?.phone ?? phone.value;
      successUsername.value = res.data.data?.name ?? userName.value;
      successPassword.value = password.value;
      showSuccessBox.value = true;
    }
  } catch (err) {
    if (err.response && err.response.data) {
      const responseErrors = err.response.data.errors;
      if (responseErrors) {
        errors.value = responseErrors;
        const errMsg = responseErrors.user_name?.[0] ?? responseErrors.phone?.[0] ?? responseErrors.name?.[0];
        if (errMsg) error.value = errMsg;
      } else {
        error.value = t(
          "Registration Failed!",
          "အကောင့်ဖွင့်ခြင်း ကျရှုံးပါသည်။",
          "注册失败！",
          "สมัครสมาชิกไม่สำเร็จ!"
        );
      }
    } else {
      error.value = t(
        "Registration Failed!",
        "အကောင့်ဖွင့်ခြင်း ကျရှုံးပါသည်။",
        "注册失败！",
        "สมัครสมาชิกไม่สำเร็จ!"
      );
    }
  } finally {
    isSignin.value = false;
    closeToast();
  }
};

// Check for referral code in query params (?ref=, ?r=, or ?code= from invite/streamer link)
onMounted(() => {
  const code = route.query.ref || route.query.r || route.query.code;
  if (code) {
    const value = String(code).trim();
    localStorage.setItem("referralCode", value);
    storedCode.value = value;
    referralCode.value = value;
  }
});

// When modal opens (e.g. from referral link), sync referral code from localStorage
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      const code = localStorage.getItem("referralCode") || "";
      referralCode.value = code;
      storedCode.value = code;
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
          {{ t("Register", "လျှောက်ထားပါ။", "注册", "สมัครสมาชิก") }}
        </h2>
        <p class="text-white/60 text-sm mt-1 font-['Pyidaungsu','Padauk',sans-serif]">
          {{ t("Create your account", "အကောင့်အသစ်ဖွင့်ပါ", "创建账户", "สร้างบัญชีของคุณ") }}
        </p>
      </div>

      <div class="px-6 py-5">
        <!-- Success: show copyable phone, name, password, then Go to Login -->
        <div v-if="showSuccessBox" class="space-y-4">
          <div class="p-3 rounded-xl bg-green-500/15 border border-green-500/30 text-green-200 text-sm font-['Pyidaungsu','Padauk',sans-serif] text-center">
            {{ t("Registration successful! Save your credentials below.", "အကောင့်ဖွင့်ပြီးပါပြီ။ အောက်ပါအချက်အလက်များကို သိမ်းပါ။", "注册成功！请保存以下信息。", "สมัครสำเร็จ! บันทึกข้อมูลด้านล่าง") }}
          </div>
          <div class="flex items-center gap-2 rounded-xl bg-[#172240]/80 border border-white/10 px-3 py-2.5">
            <span class="text-white/70 text-sm shrink-0 font-['Pyidaungsu','Padauk',sans-serif]">{{ t("Phone", "ဖုန်းနံပါတ်", "手机号", "หมายเลขโทรศัพท์") }}:</span>
            <span class="text-white font-medium truncate flex-1 min-w-0 font-['Pyidaungsu','Padauk',sans-serif]">{{ successPhone }}</span>
            <button
              type="button"
              @click="copyToClipboard(successPhone, 'Phone')"
              class="shrink-0 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              :title="t('Copy', 'ကူးယူမည်', '复制', 'คัดลอก')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
          </div>
          <div class="flex items-center gap-2 rounded-xl bg-[#172240]/80 border border-white/10 px-3 py-2.5">
            <span class="text-white/70 text-sm shrink-0 font-['Pyidaungsu','Padauk',sans-serif]">{{ t("Name", "နာမည်", "姓名", "ชื่อ") }}:</span>
            <span class="text-white font-medium truncate flex-1 min-w-0 font-['Pyidaungsu','Padauk',sans-serif]">{{ successUsername }}</span>
            <button
              type="button"
              @click="copyToClipboard(successUsername, 'Name')"
              class="shrink-0 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              :title="t('Copy', 'ကူးယူမည်', '复制', 'คัดลอก')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
          </div>
          <div class="flex items-center gap-2 rounded-xl bg-[#172240]/80 border border-white/10 px-3 py-2.5">
            <span class="text-white/70 text-sm shrink-0 font-['Pyidaungsu','Padauk',sans-serif]">{{ t("Password", "စကားဝှက်", "密码", "รหัสผ่าน") }}:</span>
            <span class="text-white font-medium truncate flex-1 min-w-0 font-['Pyidaungsu','Padauk',sans-serif]">{{ successPassword }}</span>
            <button
              type="button"
              @click="copyToClipboard(successPassword, 'Password')"
              class="shrink-0 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              :title="t('Copy', 'ကူးယူမည်', '复制', 'คัดลอก')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
          </div>
          <p class="text-white/60 text-xs font-['Pyidaungsu','Padauk',sans-serif]">
            {{ t("Credentials are saved. Click below to open Login — then press Login to sign in.", "အချက်အလက်များ သိမ်းပြီးပါပြီ။ အောက်ပါခလုတ်နှိပ်ပြီး အကောင့်ဝင်ရန် ဖွင့်ကာ Login နှိပ်ပါ။", "信息已保存。点击下方打开登录页，然后点击登录。", "บันทึกข้อมูลแล้ว กดด้านล่างเพื่อเปิดหน้าเข้าสู่ระบบ แล้วกดเข้าสู่ระบบ") }}
          </p>
          <button
            type="button"
            @click="goToLogin"
            class="btn-app btn-app-blue w-full py-2.5 font-semibold text-sm font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{ t("Go to Login", "အကောင့်ဝင်ရန် သို့သွားမည်", "去登录", "ไปหน้าเข้าสู่ระบบ") }}
          </button>
        </div>

        <template v-else>
        <!-- Error Message -->
        <div
          v-if="error"
          class="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-sm font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{ error }}
        </div>

        <!-- User Name Field -->
        <div class="mb-3">
          <label class="block text-white/80 text-xs font-medium mb-1.5 font-['Pyidaungsu','Padauk',sans-serif]">
            {{ t("User Name", "နာမည်", "用户名", "ชื่อผู้ใช้") }}
          </label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </span>
            <input
              v-model="userName"
              type="text"
              :placeholder="t('Enter user name', 'နာမည်ထည့်ပါ', '请输入用户名', 'กรอกชื่อผู้ใช้')"
              class="register-input w-full bg-[#172240]/80 text-white pl-10 pr-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#1986E1] focus:ring-1 focus:ring-[#1986E1]/50 font-['Pyidaungsu','Padauk',sans-serif] placeholder:text-white/40 transition-colors"
            />
          </div>
          <small v-if="errors.user_name" class="text-red-400 text-xs mt-1 block font-['Pyidaungsu','Padauk',sans-serif]">{{ errors.user_name[0] }}</small>
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
              class="register-input w-full bg-[#172240]/80 text-white pl-10 pr-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#1986E1] focus:ring-1 focus:ring-[#1986E1]/50 font-['Pyidaungsu','Padauk',sans-serif] placeholder:text-white/40 transition-colors"
            />
          </div>
          <small v-if="errors.phone" class="text-red-400 text-xs mt-1 block font-['Pyidaungsu','Padauk',sans-serif]">{{ errors.phone[0] }}</small>
        </div>

          <!-- Password Field -->
        <div class="mb-3">
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
              @keyup.enter="handleRegister"
              class="register-input w-full bg-[#172240]/80 text-white pl-10 pr-10 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#1986E1] focus:ring-1 focus:ring-[#1986E1]/50 font-['Pyidaungsu','Padauk',sans-serif] placeholder:text-white/40 transition-colors"
            />
            <button
              type="button"
              @click="togglePasswordVisibility"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white/80 transition-colors"
            >
            <svg
              v-if="!isShowPassword"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
              ></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            </button>
          </div>
          <small v-if="errors.password" class="text-red-400 text-xs mt-1 block font-['Pyidaungsu','Padauk',sans-serif]">{{ errors.password[0] }}</small>
        </div>

        <!-- Confirm Password Field -->
        <div class="mb-4">
          <label class="block text-white/80 text-xs font-medium mb-1.5 font-['Pyidaungsu','Padauk',sans-serif]">
            {{ t("Confirm Password", "စကားဝှက်အတည်ပြု", "确认密码", "ยืนยันรหัสผ่าน") }}
          </label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </span>
            <input
              ref="confirmPasswordInput"
              v-model="confirmPassword"
              type="password"
              :placeholder="t('Confirm password', 'စကားဝှက်အတည်ပြုပါ', '确认密码', 'ยืนยันรหัสผ่าน')"
              @keyup.enter="handleRegister"
              class="register-input w-full bg-[#172240]/80 text-white pl-10 pr-10 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#1986E1] focus:ring-1 focus:ring-[#1986E1]/50 font-['Pyidaungsu','Padauk',sans-serif] placeholder:text-white/40 transition-colors"
            />
            <button
              type="button"
              @click="toggleConfirmPasswordVisibility"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white/80 transition-colors"
            >
            <svg
              v-if="!isShowConfirmPassword"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
              ></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            </button>
          </div>
          <small v-if="errors.confirm_password" class="text-red-400 text-xs mt-1 block font-['Pyidaungsu','Padauk',sans-serif]">{{ errors.confirm_password[0] }}</small>
        </div>

        <div class="flex gap-2 mt-1">
          <button
            type="button"
            @click="handleRegister"
            :disabled="isSignin || isQuickLogin"
            class="btn-app btn-app-blue flex-1 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm font-['Pyidaungsu','Padauk',sans-serif] flex items-center justify-center gap-2"
          >
            <template v-if="!isSignin">{{ t("Register", "လျှောက်ထားပါ။", "注册", "สมัครสมาชิก") }}</template>
            <template v-else>
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ t("Processing...", "လုပ်ဆောင်နေသည်...", "处理中...", "กำลังดำเนินการ...") }}
            </template>
          </button>
          <button
            type="button"
            class="btn-app btn-app-gold shrink-0 w-12 py-2.5 flex items-center justify-center disabled:opacity-50"
            :aria-label="t('Quick Login', 'အမြန်ဝင်မည်', '快速登录', 'เข้าสู่ระบบด่วน')"
            :title="t('Quick Login', 'အမြန်ဝင်မည်', '快速登录', 'เข้าสู่ระบบด่วน')"
            :disabled="isSignin || isQuickLogin"
            @click="handleQuickLogin"
          >
            <svg
              v-if="!isQuickLogin"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66l.07-.12L13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15L11 21z" />
            </svg>
            <svg
              v-else
              class="animate-spin h-5 w-5 text-[#1a1200]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </button>
        </div>

        <!-- Login Link -->
        <div class="mt-4 pt-4 border-t border-white/10 text-center">
          <span class="text-white/70 text-sm font-['Pyidaungsu','Padauk',sans-serif]">
            {{ t("Already have an account?", "အကောင့်ရှိပြီးသား?", "已有账户？", "มีบัญชีอยู่แล้ว?") }}
          </span>
          <button
            type="button"
            @click.prevent="handleOpenLogin"
            class="text-[#38bdf8] hover:text-[#7dd3fc] text-sm font-semibold font-['Pyidaungsu','Padauk',sans-serif] ml-1.5 transition-colors"
          >
            {{ t("Login", "အကောင့်ဝင်ရန်", "登录", "เข้าสู่ระบบ") }}
          </button>
        </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.showable-password {
  position: absolute;
  right: 15px;
  top: 15px;
  cursor: pointer;
  z-index: 1000;
}
</style>
