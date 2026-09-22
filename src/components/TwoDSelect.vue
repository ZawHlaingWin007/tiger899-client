<template>
  <div class="two-d-select-wrapper">
    <!-- Draw Select -->
    <div
      v-if="type === 'draw'"
      class="custom-select"
      :class="{ 'is-open': isOpen }"
      @click="toggleDropdown"
      @blur="closeDropdown"
      tabindex="0"
    >
      <div class="select-trigger">
        <span class="select-value">
          {{ selectedLabel || "Select draw" }}
        </span>
        <svg
          class="select-arrow"
          :class="{ 'is-open': isOpen }"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      <div v-if="isOpen" class="select-dropdown">
        <div
          v-for="option in drawOptions"
          :key="option.data"
          class="select-option"
          :class="{ 'is-selected': isSelected(option) }"
          @mousedown.prevent="selectOption(option)"
        >
          {{ option.label }}
        </div>
      </div>
    </div>

    <!-- Number Select -->
    <div
      v-else-if="type === 'number'"
      class="custom-select"
      :class="{ 'is-open': isOpen }"
      @click="toggleDropdown"
      @blur="closeDropdown"
      tabindex="0"
    >
      <div class="select-trigger">
        <span class="select-value">
          {{ selectedNumberLabel || "Select number" }}
        </span>
        <svg
          class="select-arrow"
          :class="{ 'is-open': isOpen }"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      <div v-if="isOpen" class="select-dropdown">
        <div
          v-for="number in availableNumbers"
          :key="number.number"
          class="select-option"
          :class="{ 'is-selected': isNumberSelected(number) }"
          @mousedown.prevent="selectNumber(number)"
        >
          {{ number.number }}
        </div>
      </div>
    </div>

    <!-- Default Select (0-9) -->
    <div
      v-else
      class="custom-select"
      :class="{ 'is-open': isOpen }"
      @click="toggleDropdown"
      @blur="closeDropdown"
      tabindex="0"
    >
      <div class="select-trigger">
        <span class="select-value">
          {{ data[field] || "Select" }}
        </span>
        <svg
          class="select-arrow"
          :class="{ 'is-open': isOpen }"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      <div v-if="isOpen" class="select-dropdown">
        <div
          v-for="option in defaultOptions"
          :key="option"
          class="select-option"
          :class="{ 'is-selected': data[field] === option }"
          @mousedown.prevent="selectDefault(option)"
        >
          {{ option }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  field: {
    type: String,
    required: true,
  },
  numbers: {
    type: Array,
    default: () => [],
  },
});

const isOpen = ref(false);

const drawOptions = [
  {
    label: "10:45 AM",
    data: "10:45",
  },
  {
    label: "12:00 AM",
    data: "12:00",
  },
  {
    label: "2:45 PM",
    data: "2:45",
  },
  {
    label: "4:30 PM",
    data: "4:30",
  },
];

const defaultOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, "0"];

const selectedLabel = computed(() => {
  if (props.type === "draw") {
    const selected = drawOptions.find(
      (opt) => opt.data === props.data[props.field]
    );
    return selected ? selected.label : "";
  }
  return "";
});

const availableNumbers = computed(() => {
  return props.numbers.filter((num) => num.isOpen);
});

const selectedNumberLabel = computed(() => {
  if (props.type === "number") {
    const selected = availableNumbers.value.find(
      (num) => num.number === props.data[props.field]
    );
    return selected ? selected.number : "";
  }
  return "";
});

const isSelected = (option) => {
  return props.data[props.field] === option.data;
};

const isNumberSelected = (number) => {
  return props.data[props.field] === number.number;
};

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const closeDropdown = () => {
  // Small delay to allow click events to fire
  setTimeout(() => {
    isOpen.value = false;
  }, 200);
};

const selectOption = (option) => {
  props.data[props.field] = option.data;
  isOpen.value = false;
};

const selectNumber = (number) => {
  props.data[props.field] = number.number;
  isOpen.value = false;
};

const selectDefault = (option) => {
  props.data[props.field] = option;
  isOpen.value = false;
};
</script>

<style scoped>
.two-d-select-wrapper {
  position: relative;
  width: 100%;
}

.custom-select {
  position: relative;
  width: 100%;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background-color: #080E1E;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  color: white;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-family: "Pyidaungsu", "Padauk", sans-serif;
}

.select-trigger:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.custom-select.is-open .select-trigger {
  border-color: #dc2626;
  outline: none;
}

.select-value {
  flex: 1;
  text-align: left;
  color: white;
}

.select-arrow {
  margin-left: 0.5rem;
  transition: transform 0.2s;
  color: white;
  flex-shrink: 0;
}

.select-arrow.is-open {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  background-color: #080E1E;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  margin-top: 0.25rem;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3),
    0 4px 6px -2px rgba(0, 0, 0, 0.2);
}

.select-option {
  padding: 0.5rem 0.75rem;
  color: white;
  cursor: pointer;
  transition: background-color 0.15s;
  font-size: 0.875rem;
  font-family: "Pyidaungsu", "Padauk", sans-serif;
}

.select-option:hover {
  background-color: #172240;
}

.select-option.is-selected {
  background-color: #374164;
  color: white;
}

/* Custom scrollbar for dropdown */
.select-dropdown::-webkit-scrollbar {
  width: 6px;
}

.select-dropdown::-webkit-scrollbar-track {
  background: #080E1E;
}

.select-dropdown::-webkit-scrollbar-thumb {
  background: #172240;
  border-radius: 3px;
}

.select-dropdown::-webkit-scrollbar-thumb:hover {
  background: #4a5561;
}
</style>
