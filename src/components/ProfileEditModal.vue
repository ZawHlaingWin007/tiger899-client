<script setup>
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";
import axios from "axios";
import { useTranslation } from "../composables/useTranslation";
import {
  getProfileUrlByIndex,
  getProfileIndex,
} from "../composables/useProfileImage";
import {
  showFailToast,
  showSuccessToast,
  showLoadingToast,
  closeToast,
} from "vant";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);

const store = useStore();
const { t } = useTranslation();

const authUser = computed(() => store.state.authUser || {});
const profileForm = ref({ name: "", profile_image: null });
const profileImagePreview = ref("");
const isSavingProfile = ref(false);

function openModal() {
  const index = getProfileIndex(authUser.value);
  const u = authUser.value?.user ?? authUser.value;
  profileForm.value = {
    name: u?.user_name || u?.name || "",
    profile_image: index >= 1 && index <= 10 ? index : null,
  };
  profileImagePreview.value = profileForm.value.profile_image
    ? getProfileUrlByIndex(profileForm.value.profile_image)
    : "/logo-profile.png";
}

function closeModal() {
  emit("update:modelValue", false);
  profileForm.value = { name: "", profile_image: null };
  profileImagePreview.value = "";
}

function selectAvatar(index) {
  profileForm.value.profile_image = index;
  profileImagePreview.value = getProfileUrlByIndex(index);
}

async function saveProfile() {
  const name = (profileForm.value.name || "").trim();
  if (!name) {
    showFailToast({
      message: t("Name is required", "အမည်ထည့်ပါ", "请输入名称", "กรุณากรอกชื่อ"),
      position: "top",
    });
    return;
  }
  if (
    profileForm.value.profile_image == null ||
    profileForm.value.profile_image < 1 ||
    profileForm.value.profile_image > 10
  ) {
    showFailToast({
      message: t("Please choose an avatar", "ဓာတ်ပုံရွေးပါ", "请选择头像", "กรุณาเลือกรูปโปรไฟล์"),
      position: "top",
    });
    return;
  }
  isSavingProfile.value = true;
  showLoadingToast({
    message: t("Saving...", "သိမ်းဆည်းနေသည်...", "保存中...", "กำลังบันทึก..."),
    duration: 0,
    forbidClick: true,
  });
  try {
    const res = await axios.put(
      "/auth/profile",
      {
        user_name: name,
        profile: profileForm.value.profile_image,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      }
    );
    const updated = res?.data?.data ?? res?.data ?? {};
    if (updated && Object.keys(updated).length) {
      const merged = {
        ...authUser.value,
        ...updated,
        profile_image: updated.profile ?? updated.profile_image,
      };
      store.commit("SET_USER", merged);
      const stored = JSON.parse(localStorage.getItem("userData") || "{}");
      localStorage.setItem(
        "userData",
        JSON.stringify({
          ...stored,
          ...updated,
          profile_image: updated.profile ?? stored.profile_image,
        })
      );
    }
    closeToast();
    showSuccessToast({
      message: t("Profile updated", "ပရိုဖိုင်ပြင်ပြီးပါပြီ", "资料已更新", "อัปเดตโปรไฟล์แล้ว"),
      position: "top",
    });
    closeModal();
    await store.dispatch("fetchUser");
  } catch (err) {
    closeToast();
    const data = err?.response?.data ?? {};
    const msg =
      data.message ||
      data.errors?.user_name?.[0] ||
      data.errors?.profile?.[0] ||
      t("Failed to update profile", "ပရိုဖိုင်ပြင်၍မရပါ", "更新失败", "อัปเดตไม่สำเร็จ");
    showFailToast({ message: msg, position: "top" });
  } finally {
    isSavingProfile.value = false;
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) openModal();
  }
);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      @click="closeModal"
    >
    <div
      class="bg-[#080E1E] rounded-lg w-full max-w-md relative shadow-2xl max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <button
        type="button"
        @click="closeModal"
        class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="px-6 pt-6 pb-4 border-b border-white/10">
        <h2 class="text-white text-xl font-bold font-['Pyidaungsu','Padauk',sans-serif]">
          {{ t("Edit Profile", "ပရိုဖိုင်ပြင်", "编辑资料", "แก้ไขโปรไฟล์") }}
        </h2>
      </div>
      <div class="p-6 space-y-4">
        <div class="flex flex-col items-center gap-3">
          <img
            :src="profileImagePreview"
            alt="Preview"
            class="w-20 h-20 rounded-full object-cover border-2 border-white/20 bg-[#080E1E]"
          />
          <span class="text-white/70 text-sm font-['Pyidaungsu','Padauk',sans-serif]">
            {{ t("Choose avatar", "ဓာတ်ပုံရွေးပါ", "选择头像", "เลือกรูปโปรไฟล์") }}
          </span>
        </div>
        <div>
          <p class="text-white/80 text-sm font-medium mb-2 font-['Pyidaungsu','Padauk',sans-serif]">
            {{ t("Profiles", "ပရိုဖိုင်များ", "头像", "โปรไฟล์") }}
          </p>
          <div class="flex flex-wrap justify-center gap-2">
            <button
              v-for="n in 10"
              :key="n"
              type="button"
              @click="selectAvatar(n)"
              class="w-14 h-14 rounded-full overflow-hidden border transition-all shrink-0 bg-[#080E1E]"
              :class="profileForm.profile_image === n ? 'border-[#1986E1] ring-2 ring-[#1986E1]/50' : 'border-white/20 hover:border-white/40'"
            >
              <img :src="getProfileUrlByIndex(n)" :alt="'profile_' + n" class="w-full h-full object-cover" @error="($event.target).src = '/logo-profile.png'" />
            </button>
          </div>
        </div>
        <div>
          <label class="block text-white/80 text-sm font-medium mb-1 font-['Pyidaungsu','Padauk',sans-serif]">
            {{ t("Display name", "အမည်", "显示名称", "ชื่อที่แสดง") }}
          </label>
          <input
            v-model="profileForm.name"
            type="text"
            maxlength="50"
            :placeholder="t('Enter name', 'အမည်ထည့်ပါ', '请输入名称', 'กรอกชื่อ')"
            class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#1986E1] font-['Pyidaungsu','Padauk',sans-serif]"
          />
        </div>
      </div>
      <div class="px-6 pb-6 flex gap-3">
        <button
          type="button"
          @click="closeModal"
          class="flex-1 py-3 rounded-lg border border-white/20 text-white font-['Pyidaungsu','Padauk',sans-serif] font-medium hover:bg-white/5"
        >
          {{ t("Cancel", "ပယ်မည်", "取消", "ยกเลิก") }}
        </button>
        <button
          type="button"
          :disabled="isSavingProfile"
          @click="saveProfile"
          class="flex-1 py-3 rounded-lg bg-[#1986E1] text-white font-['Pyidaungsu','Padauk',sans-serif] font-medium hover:bg-[#156FBD] disabled:opacity-50"
        >
          {{ isSavingProfile ? t("Saving...", "သိမ်းနေသည်...", "保存中...", "กำลังบันทึก...") : t("Save", "သိမ်းမည်", "保存", "บันทึก") }}
        </button>
      </div>
    </div>
  </div>
  </Teleport>
</template>
