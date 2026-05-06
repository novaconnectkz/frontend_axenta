<template>
  <v-card class="mb-4" variant="outlined" elevation="2">
    <v-card-text class="py-3">
      <v-row align="center" no-gutters>
        <v-col cols="12" md="6" class="pr-3">
          <v-text-field
            v-model="filters.search"
            placeholder="Поиск по названию, IMEI, номеру телефона..."
            prepend-icon="mdi-magnify"
            clearable
            variant="outlined"
            density="compact"
            hide-details
            @input="$emit('search')"
          />
        </v-col>

        <v-col cols="12" md="3" class="pr-3">
          <v-select
            v-model="filters.source"
            :items="sourceOptions"
            label="Система"
            clearable
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="$emit('change')"
          />
        </v-col>

        <v-col cols="auto" class="pr-3">
          <v-btn
            :icon="showDeletedObjects ? 'mdi-delete' : 'mdi-delete-outline'"
            :color="showDeletedObjects ? 'error' : 'default'"
            variant="flat"
            density="comfortable"
            :title="showDeletedObjects ? 'Корзина (включена)' : 'Показать корзину'"
            @click="showDeletedObjects = !showDeletedObjects"
          />
        </v-col>

        <v-col v-if="hasActiveFilters" cols="auto">
          <v-btn
            icon="mdi-filter-off-outline"
            variant="flat"
            color="warning"
            density="comfortable"
            title="Сбросить активные фильтры"
            data-testid="clear-filters"
            @click="$emit('clearFilters')"
          >
            <v-badge :content="activeFiltersCount" color="white" text-color="warning" inline />
          </v-btn>
        </v-col>

        <v-spacer />

        <v-col cols="auto">
          <v-btn-toggle v-model="viewMode" mandatory variant="outlined" density="compact">
            <v-btn value="table" icon="mdi-table" />
            <v-btn value="grid" icon="mdi-grid" />
          </v-btn-toggle>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface SourceOption {
  title: string;
  value: string | null;
}

interface FiltersModel {
  search: string;
  source: string | null;
  [key: string]: unknown;
}

defineProps<{
  filters: FiltersModel;
  sourceOptions: SourceOption[];
  hasActiveFilters: boolean;
  activeFiltersCount: number;
}>();

const showDeletedObjects = defineModel<boolean>('showDeletedObjects', { required: true });
const viewMode = defineModel<'table' | 'grid'>('viewMode', { required: true });

defineEmits<{
  search: [];
  change: [];
  clearFilters: [];
}>();
</script>
