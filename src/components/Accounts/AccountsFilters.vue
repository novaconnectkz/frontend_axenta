<template>
  <div>
    <AppleCard class="filters-card" variant="outlined">
      <div class="filters-content">
        <div class="filters-row">
          <div class="filter-item filter-search">
            <v-text-field
              :model-value="searchQuery"
              placeholder="Поиск по названию компании (через запятую для нескольких)..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              clearable
              class="search-field"
              @update:model-value="$emit('update:searchQuery', $event ?? '')"
              @input="$emit('search')"
            />
          </div>

          <div class="filter-item">
            <v-select
              :model-value="filters.type"
              label="Тип аккаунта"
              :items="accountTypes"
              variant="outlined"
              density="comfortable"
              @update:model-value="onTypeChange"
            />
          </div>

          <div class="filter-item">
            <v-select
              :model-value="filters.is_active"
              label="Статус"
              :items="statusOptions"
              variant="outlined"
              density="comfortable"
              @update:model-value="onStatusChange"
            />
          </div>

          <div class="filter-item">
            <v-select
              :model-value="filters.source"
              label="Система"
              :items="sourceOptions"
              variant="outlined"
              density="comfortable"
              @update:model-value="onSourceChange"
            />
          </div>

          <div class="filter-item">
            <v-autocomplete
              :model-value="selectedParent"
              label="Родительский аккаунт"
              :items="parentOptions"
              variant="outlined"
              density="comfortable"
              clearable
              no-data-text="Нет данных"
              @update:model-value="onParentChange"
            />
          </div>

          <div class="filter-clear">
            <v-btn
              v-show="hasActiveFilters"
              icon="mdi-filter-off-outline"
              variant="flat"
              color="warning"
              density="comfortable"
              :title="hasActiveFilters ? 'Сбросить активные фильтры' : 'Сбросить фильтры'"
              :class="{ 'filter-clear-active': hasActiveFilters }"
              @click="$emit('reset')"
            >
              <v-badge :content="activeFiltersCount" color="white" text-color="warning" inline />
            </v-btn>
          </div>
        </div>
      </div>
    </AppleCard>

    <div v-if="isMultipleSearch && searchTerms.length > 0" class="search-chips-row mb-3">
      <span class="text-caption text-grey mr-2">Найдено по запросу:</span>
      <template v-for="(term, realIndex) in searchTerms" :key="realIndex">
        <v-chip
          v-if="showAllChips || realIndex < 3"
          size="small"
          color="primary"
          variant="outlined"
          class="mr-1"
          closable
          @click:close="$emit('removeSearchTerm', realIndex)"
        >
          {{ term }}
        </v-chip>
      </template>
      <v-chip
        v-if="searchTerms.length > 3"
        size="small"
        color="grey"
        variant="tonal"
        class="mr-1"
        @click="$emit('update:showAllChips', !showAllChips)"
      >
        <v-icon size="14" class="mr-1">{{ showAllChips ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        {{ showAllChips ? 'Скрыть' : `Ещё +${searchTerms.length - 3}` }}
      </v-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppleCard from '@/components/Apple/AppleCard.vue';

interface FiltersValue {
  type: string | null;
  is_active: boolean | null;
  source: string | null;
}

interface Option {
  title?: string;
  value: any;
}

const props = defineProps<{
  searchQuery: string;
  filters: FiltersValue;
  selectedParent: string;
  showAllChips: boolean;
  parentOptions: Array<{ title: string; value: string }>;
  accountTypes: Option[];
  statusOptions: Option[];
  sourceOptions: Option[];
  searchTerms: string[];
  isMultipleSearch: boolean;
  hasActiveFilters: boolean;
  activeFiltersCount: number;
}>();

const emit = defineEmits<{
  (e: 'update:searchQuery', value: string): void;
  (e: 'update:filters', value: FiltersValue): void;
  (e: 'update:selectedParent', value: string): void;
  (e: 'update:showAllChips', value: boolean): void;
  (e: 'search'): void;
  (e: 'typeChange', value: string | null): void;
  (e: 'statusChange', value: boolean | null): void;
  (e: 'sourceChange', value: string | null): void;
  (e: 'parentChange', value: string): void;
  (e: 'reset'): void;
  (e: 'removeSearchTerm', index: number): void;
}>();

const onTypeChange = (value: string | null) => {
  emit('update:filters', { ...props.filters, type: value });
  emit('typeChange', value);
};

const onStatusChange = (value: boolean | null) => {
  emit('update:filters', { ...props.filters, is_active: value });
  emit('statusChange', value);
};

const onSourceChange = (value: string | null) => {
  emit('update:filters', { ...props.filters, source: value });
  emit('sourceChange', value);
};

const onParentChange = (value: string) => {
  emit('update:selectedParent', value);
  emit('parentChange', value);
};
</script>

<style scoped>
.filters-card {
  margin-bottom: 24px;
}

.filters-content {
  padding: 20px 0 0 0;
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
  margin-top: -20px;
  width: 100%;
  padding: 0 0 0px 0;
}

.filter-item {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
}

.filter-search {
  flex: 3;
  display: flex;
  align-items: center;
  min-width: 0;
}

.filter-clear {
  flex-shrink: 0;
  flex-grow: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  width: 44px;
  min-width: 44px;
  max-width: 44px;
  margin-top: -20px;
}

.filters-row :deep(.v-select) {
  width: 100%;
  flex: 1;
}

.search-field {
  width: 100%;
  flex: 1;
}

.search-field :deep(.v-field) {
  height: 44px;
  min-height: 44px;
  border-radius: 10px !important;
  border: 1px solid rgba(0, 0, 0, 0.23) !important;
  background-color: white !important;
}

.search-field :deep(.v-field--focused) {
  border-color: rgba(0, 0, 0, 0.87) !important;
  box-shadow: none !important;
}

.filters-row :deep(.v-field) {
  height: 44px;
  min-height: 44px;
  border-radius: 10px !important;
}

.filter-clear :deep(.v-btn) {
  height: 44px !important;
  min-height: 44px !important;
  width: 44px !important;
  min-width: 44px !important;
  padding: 0 !important;
  border-radius: 10px !important;
  transition: all 0.3s ease;
}

.filter-clear :deep(.v-btn:hover) {
  transform: scale(1.05);
}

.filter-clear :deep(.v-btn .v-icon) {
  font-size: 20px !important;
}

.filter-clear :deep(.v-btn .v-btn__content) {
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.filter-clear-active {
  position: relative;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3) !important;
  animation: pulse-filter 2s infinite;
}

@keyframes pulse-filter {
  0% { box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3); }
  50% { box-shadow: 0 4px 12px rgba(255, 152, 0, 0.5); }
  100% { box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3); }
}

.search-chips-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 0;
  }

  .filter-item,
  .filter-search {
    flex: none;
  }

  .filter-clear {
    align-self: flex-end;
    padding-top: 0;
  }
}

[data-theme="dark"] .filters-card {
  background-color: #2c2c2e;
  border: 1px solid #3a3a3c;
}

[data-theme="dark"] .search-field :deep(.v-field) {
  background-color: #2c2c2e !important;
  border-color: #3a3a3c !important;
  color: #ffffff !important;
}

[data-theme="dark"] .search-field :deep(.v-field__input) {
  color: #ffffff !important;
}

[data-theme="dark"] .search-field :deep(.v-label) {
  color: #8e8e93 !important;
}

[data-theme="dark"] .filters-row :deep(.v-field) {
  background-color: #2c2c2e !important;
  border-color: #3a3a3c !important;
  color: #ffffff !important;
}

[data-theme="dark"] .filters-row :deep(.v-field__input) {
  color: #ffffff !important;
}

[data-theme="dark"] .filters-row :deep(.v-label) {
  color: #8e8e93 !important;
}

[data-theme="dark"] .filters-row :deep(.v-field--focused) {
  border-color: #007AFF !important;
}

[data-theme="dark"] .filter-clear :deep(.v-btn) {
  background-color: #ff9500 !important;
  color: #ffffff !important;
}

[data-theme="dark"] .filter-clear :deep(.v-btn:hover) {
  background-color: #cc7700 !important;
}
</style>
