<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import type { DateValue, Time as TimeValue } from "@internationalized/date";
import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
  now,
  parseDateTime,
  Time,
} from "@internationalized/date";

const emits = defineEmits<{
  (event: "update:value", value: string): void;
}>();
const props = withDefaults(
  defineProps<{
    label?: string;
    value?: string;
    name?: string;
    error?: string;
    class?: HTMLAttributes["class"];
    required?: boolean;
    placeholder?: string;
    icon?: string;
    includeTime?: boolean; // Add time picker
    timePlaceholder?: string;
  }>(),
  {
    label: "",
    required: false,
    placeholder: "Select a date",
    icon: "i-lucide-calendar",
    includeTime: false,
    timePlaceholder: "HH:MM",
  },
);

const modelValue = useVModel(props, "value", emits, {
  passive: true,
  defaultValue: "",
});

const df = new DateFormatter("en-US", {
  dateStyle: "medium",
  timeStyle: props.includeTime ? "short" : undefined,
});

// For date only
const dateValue = computed({
  get: () => {
    if (!modelValue.value) return null;

    try {
      const date = new Date(modelValue.value);
      if (isNaN(date.getTime())) return null;

      return new CalendarDate(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
      );
    } catch {
      return null;
    }
  },
  set: (newValue: DateValue | null) => {
    if (!newValue) {
      modelValue.value = "";
      return;
    }

    let dateTime;

    if (props.includeTime && timeValue.value) {
      // Combine date and time
      dateTime = new Date(
        newValue.year,
        newValue.month - 1,
        newValue.day,
        timeValue.value.hour,
        timeValue.value.minute,
      );
    } else {
      // Date only (set to start of day)
      dateTime = new Date(newValue.year, newValue.month - 1, newValue.day);
    }

    modelValue.value = dateTime.toISOString();
  },
});

// For time only (if includeTime is true)
const timeValue = computed({
  get: () => {
    if (!modelValue.value || !props.includeTime) return null;

    try {
      const date = new Date(modelValue.value);
      if (isNaN(date.getTime())) return null;

      return new Time(date.getHours(), date.getMinutes());
    } catch {
      return null;
    }
  },
  set: (newValue: TimeValue | null) => {
    if (!dateValue.value || !newValue) return;

    const dateTime = new Date(
      dateValue.value.year,
      dateValue.value.month - 1,
      dateValue.value.day,
      newValue.hour,
      newValue.minute,
    );

    modelValue.value = dateTime.toISOString();
  },
});

// Utility functions
const formatForPostgreSQL = (date: Date): string => {
  return date.toISOString();
};

const parseFromPostgreSQL = (postgresTimestamp: string): Date | null => {
  if (!postgresTimestamp) return null;

  try {
    const date = new Date(postgresTimestamp);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

defineExpose({
  formatForPostgreSQL,
  parseFromPostgreSQL,
});
</script>

<template>
  <UFormField
    :label="label"
    :class="cn('w-full', props.class)"
    :required="required"
    :error="error"
  >
    <UInput type="hidden" :value="modelValue" :name="name" />

    <div class="flex gap-2">
      <!-- Date Picker -->
      <UPopover class="flex-1">
        <UButton
          color="neutral"
          variant="subtle"
          :icon="icon"
          class="w-full justify-start"
          :class="{ 'text-neutral-400': !dateValue }"
        >
          {{
            dateValue
              ? df.format(dateValue.toDate(getLocalTimeZone()))
              : placeholder
          }}
        </UButton>

        <template #content>
          <div class="p-2">
            <UCalendar v-model="dateValue" />
          </div>
        </template>
      </UPopover>

      <!-- Time Picker (optional) -->
      <UPopover v-if="includeTime" class="flex-1">
        <UButton
          color="neutral"
          variant="subtle"
          icon="i-lucide-clock"
          class="w-full justify-start"
          :class="{ 'text-neutral-400': !timeValue }"
        >
          {{
            timeValue
              ? `${timeValue.hour.toString().padStart(2, "0")}:${timeValue.minute.toString().padStart(2, "0")}`
              : timePlaceholder
          }}
        </UButton>

        <template #content>
          <div class="p-2">
            <!-- <UTimePicker v-model="timeValue" /> -->
          </div>
        </template>
      </UPopover>
    </div>

    <!-- PostgreSQL format hint -->
    <template v-if="modelValue" #hint>
      <div class="mt-1 text-xs text-neutral-500">
        PostgreSQL: {{ modelValue }}
      </div>
    </template>
  </UFormField>
</template>
