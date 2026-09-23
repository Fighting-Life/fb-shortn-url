<script setup lang="ts">
import {
  DateFormatter,
  getLocalTimeZone,
  CalendarDate,
  today,
  type DateValue,
} from "@internationalized/date";
import { sub } from "date-fns";

const df = new DateFormatter("en-US", {
  dateStyle: "medium",
});

// Model untuk PostgreSQL timestamp format
const selected = defineModel<PostgresRangeDate>({ required: true });

const ranges = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 14 days", days: 14 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 3 months", months: 3 },
  { label: "Last 6 months", months: 6 },
  { label: "Last year", years: 1 },
];

/**
 * Convert Date to CalendarDate
 */
const toCalendarDate = (date: Date): DateValue => {
  return new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
};

/**
 * Convert CalendarDate to PostgreSQL timestamp with timezone
 */
const toPostgresTimestamp = (calendarDate: DateValue): string => {
  const date = calendarDate.toDate(getLocalTimeZone());
  return date.toISOString();
};

/**
 * Convert PostgreSQL timestamp to CalendarDate
 */
const fromPostgresTimestamp = (timestamp: string): DateValue => {
  const date = new Date(timestamp);
  return new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
};

/**
 * Parse PostgreSQL timestamp to Date object untuk display
 */
const parsePostgresTimestamp = (timestamp: string): Date => {
  return new Date(timestamp);
};

/**
 * Get default range (last 14 days)
 */
const getDefaultRange = (): PostgresRangeDate => {
  const end = new Date();
  const start = sub(end, { days: 14 });

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

// Initialize dengan default range jika kosong
watchEffect(() => {
  if (!selected.value.start || !selected.value.end) {
    selected.value = getDefaultRange();
  }
});

/**
 * Computed untuk calendar value (sesuai dengan UCalendar expectations)
 */
const calendarValue = computed({
  get: (): { start: DateValue | null; end: DateValue | null } => {
    try {
      return {
        start: selected.value.start
          ? fromPostgresTimestamp(selected.value.start)
          : null,
        end: selected.value.end
          ? fromPostgresTimestamp(selected.value.end)
          : null,
      };
    } catch (error) {
      console.error("Error parsing dates:", error);
      const defaultRange = getDefaultRange();
      return {
        start: fromPostgresTimestamp(defaultRange.start),
        end: fromPostgresTimestamp(defaultRange.end),
      };
    }
  },
  set: (newValue: { start: DateValue | null; end: DateValue | null }) => {
    if (!newValue.start || !newValue.end) return;

    try {
      selected.value = {
        start: toPostgresTimestamp(newValue.start),
        end: toPostgresTimestamp(newValue.end),
      };
    } catch (error) {
      console.error("Error setting dates:", error);
    }
  },
});

/**
 * Handle individual date changes (untuk UCalendar yang memisahkan start/end)
 */
const handleStartDateChange = (date: DateValue | undefined) => {
  if (!date) return;

  const currentEnd = calendarValue.value.end;
  if (currentEnd && date.compare(currentEnd) > 0) {
    // Jika start date setelah end date, set end date sama dengan start date
    calendarValue.value = {
      start: date,
      end: date,
    };
  } else {
    calendarValue.value = {
      start: date,
      end: currentEnd || date,
    };
  }
};

const handleEndDateChange = (date: DateValue | undefined) => {
  if (!date) return;

  const currentStart = calendarValue.value.start;
  if (currentStart && date.compare(currentStart) < 0) {
    // Jika end date sebelum start date, set start date sama dengan end date
    calendarValue.value = {
      start: date,
      end: date,
    };
  } else {
    calendarValue.value = {
      start: currentStart || date,
      end: date,
    };
  }
};

/**
 * Check if range is selected
 */
const isRangeSelected = (range: {
  days?: number;
  months?: number;
  years?: number;
}) => {
  if (!selected.value.start || !selected.value.end) return false;

  try {
    const currentDate = today(getLocalTimeZone());
    let startDate = currentDate.copy();

    if (range.days) {
      startDate = startDate.subtract({ days: range.days });
    } else if (range.months) {
      startDate = startDate.subtract({ months: range.months });
    } else if (range.years) {
      startDate = startDate.subtract({ years: range.years });
    }

    const selectedStart = fromPostgresTimestamp(selected.value.start);
    const selectedEnd = fromPostgresTimestamp(selected.value.end);

    return (
      selectedStart.compare(startDate) === 0 &&
      selectedEnd.compare(currentDate) === 0
    );
  } catch (error) {
    console.error("Error checking range:", error);
    return false;
  }
};

/**
 * Select predefined range
 */
const selectRange = (range: {
  days?: number;
  months?: number;
  years?: number;
}) => {
  try {
    const endDate = today(getLocalTimeZone());
    let startDate = endDate.copy();

    if (range.days) {
      startDate = startDate.subtract({ days: range.days });
    } else if (range.months) {
      startDate = startDate.subtract({ months: range.months });
    } else if (range.years) {
      startDate = startDate.subtract({ years: range.years });
    }

    selected.value = {
      start: toPostgresTimestamp(startDate),
      end: toPostgresTimestamp(endDate),
    };
  } catch (error) {
    console.error("Error selecting range:", error);
  }
};

/**
 * Format date untuk display
 */
const formatDisplayDate = (timestamp: string): string => {
  try {
    const date = parsePostgresTimestamp(timestamp);
    return df.format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

/**
 * Validate PostgreSQL timestamp
 */
const isValidPostgresTimestamp = (timestamp: string): boolean => {
  try {
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};

// Debug logging
watch(
  selected,
  (newValue) => {
    console.log("Selected range (PostgreSQL):", {
      start: newValue.start,
      end: newValue.end,
    });
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <UPopover :content="{ align: 'start' }" :modal="true">
    <UButton
      color="neutral"
      variant="ghost"
      icon="i-lucide-calendar"
      class="data-[state=open]:bg-elevated group"
    >
      <span class="truncate">
        <template v-if="selected.start && selected.end">
          <template
            v-if="
              isValidPostgresTimestamp(selected.start) &&
              isValidPostgresTimestamp(selected.end)
            "
          >
            {{ formatDisplayDate(selected.start) }} -
            {{ formatDisplayDate(selected.end) }}
          </template>
          <template v-else> Invalid date range </template>
        </template>
        <template v-else>Pick a date range</template>
      </span>

      <template #trailing>
        <UIcon
          name="icons:chevron-down"
          class="text-dimmed size-5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
        />
      </template>
    </UButton>

    <template #content>
      <div class="divide-default flex items-stretch sm:divide-x">
        <!-- Quick Range Selector -->
        <div class="hidden flex-col justify-center sm:flex">
          <UButton
            v-for="(range, index) in ranges"
            :key="index"
            :label="range.label"
            color="neutral"
            variant="ghost"
            class="rounded-none px-4"
            :class="[
              isRangeSelected(range) ? 'bg-elevated' : 'hover:bg-elevated/50',
            ]"
            truncate
            @click="selectRange(range)"
          />
        </div>

        <!-- Calendar -->
        <div class="p-2">
          <UCalendar
            v-model:start-value="calendarValue.start"
            v-model:end-value="calendarValue.end"
            :number-of-months="2"
            @update:start-value="handleStartDateChange"
            @update:end-value="handleEndDateChange"
          />

          <!-- PostgreSQL Format Info (Optional debug) -->
          <div v-if="false" class="mt-3 border-t pt-3 text-xs text-neutral-500">
            <div>Start: {{ selected.start }}</div>
            <div>End: {{ selected.end }}</div>
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>
