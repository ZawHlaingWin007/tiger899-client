<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { showToast, showConfirmDialog } from 'vant';
import { useRouter } from 'vue-router';
import { useTranslation } from '../../composables/useTranslation';

const router = useRouter();
const { t } = useTranslation();
const store = useStore();

const categories = ref([
    { id: 'e-wallet', label: 'Cards' },
    { id: 'bank', label: 'Banks' },
    { id: 'crypto', label: 'Crypto' }
]);

/** Format for card display: **** **** **** 1234 */
function cardNumberFormatted(item) {
    const raw = item.replace(/\s/g, "");
    if (raw.length <= 4) return raw;
    const last4 = raw.slice(-4);
    return "****  ****  ****  " + last4;
}

// State
const showModal = ref(false);
const isSubmitting = ref(false);
const activeCategory = ref('');

// Form Data 
const form = ref({
    id: null,
    user_bank_type_id: null,
    name: '',
    account_number: '',
    qr_image: [] // For Vant Uploader
});

// Computed Data from Vuex
const activeBankTypes = computed(() => store.getters['userBanks/typesByCategory'](activeCategory.value));

const getUserBanks = (categoryId) => store.getters['userBanks/banksByCategory'](categoryId);
const getBanksCount = (categoryId) => getUserBanks(categoryId).length;

const openModal = (categoryId, bank = null) => {
    activeCategory.value = categoryId;
    if (bank) {
        form.value = {
            id: bank.id,
            user_bank_type_id: bank.user_bank_type_id,
            name: bank.name,
            account_number: bank.account_number,
            qr_image: bank.qr_image ? [{ url: bank.qr_image, isImage: true }] : []
        };
    } else {
        form.value = { id: null, user_bank_type_id: null, name: '', account_number: '', qr_image: [] };
    }
    showModal.value = true;
};

// Form Submission
const onSubmit = async () => {
    if (!form.value.user_bank_type_id) {
        showToast('ဘဏ်အမျိုးအစား ရွေးချယ်ပေးပါ');
        return;
    }

    isSubmitting.value = true;

    try {
        const formData = new FormData();
        formData.append('name', form.value.name);
        formData.append('account_number', form.value.account_number);
        formData.append('user_bank_type_id', form.value.user_bank_type_id);

        if (form.value.qr_image.length > 0 && form.value.qr_image[0].file) {
            formData.append('qr_image', form.value.qr_image[0].file);
        }

        await store.dispatch('userBanks/saveUserBank', { id: form.value.id, formData });

        showToast('အောင်မြင်စွာ သိမ်းဆည်းလိုက်ပါပြီ');
        showModal.value = false;
    } catch (error) {
        const serverError = error.response?.data?.errors || error.response?.data?.message || "Error occurred";
        if (typeof serverError === 'object') {
            const firstErrorKey = Object.keys(serverError)[0];
            const errorMessage = serverError[firstErrorKey][0];
            showToast(errorMessage);
        } else {
            showToast(serverError);
        }
    } finally {
        isSubmitting.value = false;
    }
};

const onOversize = () => showToast('ဓာတ်ပုံအရွယ်အစား 5MB ထက်မကျော်လွန်ရပါ');

// Delete Action
const confirmDelete = (id) => {
    showConfirmDialog({
        title: 'သေချာပါသလား?',
        message: 'ဤကဒ်ကို ဖျက်ပစ်မည်မှာ သေချာပါသလား?',
    }).then(async () => {
        try {
            await store.dispatch('userBanks/deleteUserBank', id);
            showToast('ဖျက်ပစ်လိုက်ပါပြီ');
        } catch (error) {
            showToast('ဖျက်၍မရပါ');
        }
    }).catch(() => {
        // cancel
    });
};

onMounted(() => {
    store.dispatch('userBanks/fetchBankTypes');
    store.dispatch('userBanks/fetchUserBanks');
});

</script>


<template>
    <div class="min-h-screen bg-[#F5F5F9] pb-24">
        <!-- Header -->
        <div class="fixed top-0 left-0 right-0 z-50 bg-[#080E1E] px-4 py-4 flex items-center gap-4">
            <button
                @click="router.back()"
                class="text-white p-1 -ml-1"
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
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>
            <h1 class="flex-1 text-xl font-medium text-white font-['Pyidaungsu','Padauk',sans-serif] text-center">
                {{ t("My Cards", "ကတ်များ", "我的卡", "บัตรของฉัน") }}
            </h1>
            <div class="w-8"></div>
        </div>

        <div class="pt-20 px-4">

            <div
                v-for="category in categories"
                :key="category.id"
                class="mb-8"
            >
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-semibold text-gray-700 capitalize">
                        {{ category.label }}
                        <span class="text-sm font-normal text-gray-500">({{ getBanksCount(category.id) }})</span>
                    </h2>
                </div>

                <div class="grid grid-cols-1 gap-4 mb-4">
                    <div
                        v-for="bank in getUserBanks(category.id)"
                        :key="bank.id"
                        :class="[
                            'bank-card relative overflow-hidden rounded-2xl shadow-lg min-h-30 flex flex-col justify-between p-4',
                            `bank-card-${category.id}`
                        ]"
                    >
                        <div class="flex items-start justify-between gap-2 min-w-0">
                            <div
                                class="bank-card-chip rounded-lg bg-amber-400/90 w-10 h-8 flex items-center justify-center shadow-inner shrink-0">
                                <div class="w-full h-full flex flex-wrap gap-px p-1">
                                    <span
                                        v-for="i in 12"
                                        :key="i"
                                        class="w-1.5 h-1 bg-amber-600/60 rounded-sm"
                                    ></span>
                                </div>
                            </div>
                            <span
                                class="text-white/90 text-[10px] font-['Pyidaungsu','Padauk',sans-serif] tracking-wider uppercase truncate"
                            >{{ bank.bankType.name }}</span>
                        </div>
                        <p class="font-mono text-white text-sm md:text-base tracking-[0.2em] font-medium">
                            {{ bank.masked_number }}
                        </p>
                        <div class="flex items-center justify-between gap-2 min-w-0">
                            <span
                                class="text-white/90 text-sm font-['Pyidaungsu','Padauk',sans-serif] truncate min-w-0 flex-1"
                            >
                                {{ bank.name || "Cardholder" }}
                            </span>
                            <div class="flex items-center gap-1.5 shrink-0">
                                <button
                                    type="button"
                                    class="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors"
                                    :aria-label="t('Edit', 'ပြင်မည်', '编辑', 'แก้ไข')"
                                    @click.stop="openModal(category.id, bank)"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                    >
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    class="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors"
                                    :aria-label="t('Delete', 'ဖျက်မည်', '删除', 'ลบ')"
                                    @click.stop="confirmDelete(bank.id)"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                    >
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path
                                            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                        ></path>
                                        <line
                                            x1="10"
                                            y1="11"
                                            x2="10"
                                            y2="17"
                                        ></line>
                                        <line
                                            x1="14"
                                            y1="11"
                                            x2="14"
                                            y2="17"
                                        ></line>
                                    </svg>
                                </button>
                            </div>
                            <img
                                v-if="bank.bankType.logo_url"
                                :src="bank.bankType.logo_url"
                                alt="Logo"
                                class="h-7 w-auto max-w-18 object-contain object-right rounded bg-white/10 p-0.5 shrink-0"
                            />
                            <div
                                v-else
                                class="w-10 h-7 rounded bg-white/20 flex items-center justify-center text-white text-[10px] font-bold font-['Pyidaungsu','Padauk',sans-serif] shrink-0"
                            >{{ bank.name.slice(0, 2).toUpperCase() }}</div>
                        </div>
                    </div>

                    <div
                        class="bank-card-add rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100/80 min-h-30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#1986E1] hover:bg-gray-200/80 transition-colors p-6"
                        @click="openModal(category.id)"
                    >
                        <div class="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-500">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <line
                                    x1="12"
                                    y1="5"
                                    x2="12"
                                    y2="19"
                                ></line>
                                <line
                                    x1="5"
                                    y1="12"
                                    x2="19"
                                    y2="12"
                                ></line>
                            </svg>
                        </div>
                        <span class="text-gray-500 font-['Pyidaungsu','Padauk',sans-serif] text-sm">
                            {{ t("Payment Card", "ကဒ်အသစ်ထည့်ရန်", "支付卡", "บัตรชำระเงิน") }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <van-popup
            v-model:show="showModal"
            round
            position="bottom"
            :style="{ height: '80%' }"
        >
            <div class="p-4">
                <h3 class="text-lg font-bold mb-4 text-center text-gray-800">
                    {{ form.id ? 'ကဒ်ပြင်ဆင်ရန်' : 'ကဒ်အသစ်ထည့်ရန်' }}
                </h3>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">ဘဏ်အမျိုးအစား ရွေးပါ</label>
                    <div class="grid grid-cols-3 gap-2">
                        <div
                            v-for="type in activeBankTypes"
                            :key="type.id"
                            @click="form.user_bank_type_id = type.id"
                            class="border rounded-lg p-2 text-center cursor-pointer text-sm"
                            :class="form.user_bank_type_id === type.id ? 'border-[#1986E1] bg-[#1986E1]/10 text-[#1986E1]' : 'border-gray-200 text-gray-600'"
                        >
                            {{ type.name }}
                        </div>
                    </div>
                </div>

                <van-form @submit="onSubmit">
                    <van-cell-group
                        inset
                        class="mx-0! border! border-gray-200!"
                    >
                        <van-field
                            v-model="form.name"
                            name="name"
                            label="Account Name"
                            placeholder="အကောင့်အမည်ထည့်ပါ"
                            :rules="[{ required: true, message: 'အမည်ထည့်ရန်လိုအပ်သည်' }]"
                            maxlength="100"
                        />
                        <van-field
                            v-model="form.account_number"
                            name="account_number"
                            label="Account Number"
                            placeholder="အကောင့်နံပါတ်ထည့်ပါ"
                            :rules="[{ required: true, message: 'နံပါတ်ထည့်ရန်လိုအပ်သည်' }]"
                            maxlength="50"
                        />
                        <div class="p-4">
                            <label class="block text-sm text-gray-700 mb-2">QR Image (Optional)</label>
                            <van-uploader
                                v-model="form.qr_image"
                                :max-count="1"
                                :max-size="5 * 1024 * 1024"
                                @oversize="onOversize"
                            />
                        </div>
                    </van-cell-group>
                    <div class="mt-6 flex gap-3">
                        <van-button
                            round
                            block
                            type="default"
                            @click="showModal = false"
                        >ပယ်ဖျက်မည်</van-button>
                        <van-button
                            round
                            block
                            type="primary"
                            native-type="submit"
                            :loading="isSubmitting"
                        >သိမ်းမည်</van-button>
                    </div>
                </van-form>
            </div>
        </van-popup>
    </div>
</template>

<style scoped>
.bank-card {
    position: relative;
    background: linear-gradient(135deg, #374164 0%, #374164 50%, #374164 100%);
    box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.35);
}

.bank-card::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
    pointer-events: none;
}

.bank-card-ewallet {
    background: linear-gradient(135deg, #1e40af 0%, #1986E1 45%, #1986E1 100%);
}

.bank-card-bank {
    background: linear-gradient(135deg, #172240 0%, #080E1E 50%, #080E1E 100%);
}

.bank-card-crypto {
    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%);
}

.bank-card-chip {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%) !important;
}
</style>