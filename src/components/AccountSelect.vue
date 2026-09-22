<template>
  <div class="w-full">
    <!-- trigger -->
    <div
      @click="showPicker = true"
      class="flex items-center rounded-[10px] justify-between px-4 py-3 bg-[#2d3748] border border-[#4a5568] hover:border-[#1986E1] transition-colors cursor-pointer"
    >
      <div class="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M4.8 17.2105V19.1053H19.2V17.2105H4.8ZM4.8 6.78947H6.78C6.705 6.64737 6.65625 6.49737 6.63375 6.33947C6.61125 6.18158 6.6 6.01579 6.6 5.84211C6.6 5.05263 6.8625 4.38158 7.3875 3.82895C7.9125 3.27632 8.55 3 9.3 3C9.75 3 10.1663 3.12237 10.5488 3.36711C10.9313 3.61184 11.265 3.91579 11.55 4.27895L12 4.89474L12.45 4.27895C12.72 3.9 13.05 3.59211 13.44 3.35526C13.83 3.11842 14.25 3 14.7 3C15.45 3 16.0875 3.27632 16.6125 3.82895C17.1375 4.38158 17.4 5.05263 17.4 5.84211C17.4 6.01579 17.3888 6.18158 17.3663 6.33947C17.3438 6.49737 17.295 6.64737 17.22 6.78947H19.2C19.695 6.78947 20.1188 6.975 20.4713 7.34605C20.8238 7.71711 21 8.16316 21 8.68421V19.1053C21 19.6263 20.8238 20.0724 20.4713 20.4434C20.1188 20.8145 19.695 21 19.2 21H4.8C4.305 21 3.88125 20.8145 3.52875 20.4434C3.17625 20.0724 3 19.6263 3 19.1053V8.68421C3 8.16316 3.17625 7.71711 3.52875 7.34605C3.88125 6.975 4.305 6.78947 4.8 6.78947ZM4.8 14.3684H19.2V8.68421H14.61L16.5 11.3842L15.06 12.4737L12 8.11579L8.94 12.4737L7.5 11.3842L9.345 8.68421H4.8V14.3684ZM9.3 6.78947C9.555 6.78947 9.76875 6.69868 9.94125 6.51711C10.1138 6.33553 10.2 6.11053 10.2 5.84211C10.2 5.57368 10.1138 5.34868 9.94125 5.16711C9.76875 4.98553 9.555 4.89474 9.3 4.89474C9.045 4.89474 8.83125 4.98553 8.65875 5.16711C8.48625 5.34868 8.4 5.57368 8.4 5.84211C8.4 6.11053 8.48625 6.33553 8.65875 6.51711C8.83125 6.69868 9.045 6.78947 9.3 6.78947ZM14.7 6.78947C14.955 6.78947 15.1688 6.69868 15.3413 6.51711C15.5138 6.33553 15.6 6.11053 15.6 5.84211C15.6 5.57368 15.5138 5.34868 15.3413 5.16711C15.1688 4.98553 14.955 4.89474 14.7 4.89474C14.445 4.89474 14.2313 4.98553 14.0588 5.16711C13.8863 5.34868 13.8 5.57368 13.8 5.84211C13.8 6.11053 13.8863 6.33553 14.0588 6.51711C14.2313 6.69868 14.445 6.78947 14.7 6.78947Z"
            fill="white"
          ></path>
        </svg>
        <p class="text-white font-['Pyidaungsu','Padauk',sans-serif]">
          {{
            selectedLabel ||
            t("Select Account", "အကောင့်ရွေးချယ်ပါ", "选择账户", "เลือกบัญชี")
          }}
        </p>
      </div>
      <div class="flex items-center gap-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M15.4064 12L9.42655 18L8.03125 16.6L12.6158 12L8.03125 7.4L9.42655 6L15.4064 12Z"
            fill="white"
          ></path>
        </svg>
      </div>
    </div>

    <!-- picker -->
    <Popup
      v-model:show="showPicker"
      teleport="body"
      z-index="10000000"
      position="bottom"
      round
    >
      <Picker
        :columns="columns"
        show-toolbar
        :title="t('Select Account', 'အကောင့်ရွေးချယ်ပါ', '选择账户', 'เลือกบัญชี')"
        @confirm="onConfirm"
        @cancel="showPicker = false"
      />
    </Popup>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { Picker, Popup } from "vant";
import { useTranslation } from "../composables/useTranslation";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  field: {
    type: String,
    required: true,
  },
  accounts: {
    type: Array,
    default: () => [],
  },
});

const showPicker = ref(false);
const { t } = useTranslation();

const columns = computed(() =>
  props.accounts.map((acc) => ({
    text: acc.name,
    value: acc.id,
  }))
);

const selectedLabel = computed(() => {
  const id = props.data[props.field];
  const acc = props.accounts.find((a) => a.id === id);
  return acc ? acc.name : "";
});

const onConfirm = (option) => {
  // `option` is the selected column object
  props.data[props.field] = option.selectedValues[0];
  showPicker.value = false;
};
</script>
