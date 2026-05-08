<template>
  <AppleCard class="filters-card" variant="outlined">
    <div class="filters-content">
      <div class="filters-row">
        <div class="filter-item filter-search">
          <AppleInput
            v-model="searchModel"
            placeholder="Поиск по имени, email, логину (без создателя)..."
            clearable
            @input="onSearchInput"
            :color="isMultipleSearch ? 'primary' : undefined"
          >
            <template #prepend-icon>
              <v-icon
                :icon="isMultipleSearch ? 'mdi-account-search' : 'mdi-magnify'"
                :color="isMultipleSearch ? 'primary' : undefined"
              />
            </template>
            <template #append-inner v-if="isMultipleSearch">
              <v-chip size="x-small" color="primary" variant="flat">
                {{ searchTermsArray.length }}
              </v-chip>
            </template>
          </AppleInput>
        </div>

        <div class="filter-item">
          <v-select
            v-model="roleModel"
            :items="roleOptions"
            label="Роль"
            clearable
            variant="outlined"
            density="comfortable"
            :loading="loadingRoles"
          />
        </div>

        <div class="filter-item">
          <v-select
            v-model="activeModel"
            :items="[
              { title: 'Активные', value: true },
              { title: 'Неактивные', value: false },
            ]"
            label="Статус"
            clearable
            variant="outlined"
            density="comfortable"
          />
        </div>

        <div class="filter-item">
          <v-select
            v-model="sourceModel"
            :items="sourceOptions"
            label="Система"
            clearable
            variant="outlined"
            density="comfortable"
          />
        </div>

        <div class="filter-item filter-clear">
          <v-btn
            v-show="hasActive"
            icon="mdi-filter-off-outline"
            variant="flat"
            color="warning"
            size="small"
            @click="$emit('clear')"
            title="Сбросить активные фильтры"
            :class="{ 'filter-clear-active': hasActive }"
            data-testid="clear-filters"
          >
            <v-badge :content="activeCount" color="white" text-color="warning" inline />
          </v-btn>
        </div>
      </div>

      <div v-if="isMultipleSearch && searchTermsArray.length > 0" class="search-chips mt-2">
        <v-chip
          v-for="(term, index) in searchTermsArray"
          :key="index"
          size="small"
          color="primary"
          variant="outlined"
          class="mr-1 mb-1"
          closable
          @click:close="removeSearchTerm(index)"
        >
          {{ term }}
        </v-chip>
      </div>
    </div>
  </AppleCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import AppleInput from '@/components/Apple/AppleInput.vue';

interface FiltersValue {
  search?: string;
  role?: string;
  active?: boolean;
  source?: string | null;
  ordering?: string;
  user_type?: string;
}

const props = defineProps<{
  filters: FiltersValue;
  roleOptions: Array<{ title: string; value: string }>;
  loadingRoles: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:filters', v: FiltersValue): void;
  (e: 'search'): void;
  (e: 'clear'): void;
}>();

const sourceOptions = [
  { title: 'Все системы', value: null },
  { title: 'Axenta', value: 'axenta' },
  { title: 'Wialon (все)', value: 'wialon' },
  { title: 'WH (Hosting)', value: 'wh' },
  { title: 'WL (Local)', value: 'wl' },
  { title: 'SKIF.PRO', value: 'skif' },
];

const searchModel = computed({
  get: () => props.filters.search ?? '',
  set: (v) => emit('update:filters', { ...props.filters, search: v }),
});
const roleModel = computed({
  get: () => props.filters.role,
  set: (v) => emit('update:filters', { ...props.filters, role: v }),
});
const activeModel = computed({
  get: () => props.filters.active,
  set: (v) => emit('update:filters', { ...props.filters, active: v }),
});
const sourceModel = computed({
  get: () => props.filters.source,
  set: (v) => emit('update:filters', { ...props.filters, source: v }),
});

const searchTermsArray = computed(() => {
  if (!props.filters.search) return [];
  return props.filters.search.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
});

const isMultipleSearch = computed(() => searchTermsArray.value.length > 1);

const hasActive = computed(() => {
  const real = { ...props.filters };
  delete real.ordering;
  return Object.values(real).some((v) => v !== undefined && v !== null && v !== '');
});

const activeCount = computed(() => {
  const real = { ...props.filters };
  delete real.ordering;
  return Object.values(real).filter((v) => v !== undefined && v !== null && v !== '').length;
});

const onSearchInput = () => emit('search');

const removeSearchTerm = (index: number) => {
  const terms = searchTermsArray.value.slice();
  terms.splice(index, 1);
  emit('update:filters', { ...props.filters, search: terms.join(', ') });
  emit('search');
};
</script>

<style scoped>
.filters-card {
  margin: 0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
.filters-content {
  padding: 0;
  width: 100%;
  min-width: 0;
}
.filters-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  width: 100%;
  min-width: 0;
}
.filters-row :deep(.v-input) { margin-top: 0; margin-bottom: 0; }
.filters-row :deep(.v-field--variant-outlined) { height: 44px; }
.filters-row :deep(.v-field__input) {
  min-height: 44px;
  padding-top: 0;
  padding-bottom: 0;
  display: flex;
  align-items: center;
}
.filters-row :deep(.v-field--variant-outlined),
.filters-row :deep(.apple-input-wrapper-base),
.filter-clear :deep(.v-btn),
.filters-row :deep(.v-field),
.filters-row :deep(.v-field__outline) { border-radius: 10px !important; }
.filters-row :deep(.v-field--variant-outlined .v-field__outline) {
  border-color: rgba(var(--v-theme-on-surface), 0.24);
}
.filters-row :deep(.v-field--variant-outlined:hover .v-field__outline) {
  border-color: rgba(var(--v-theme-primary), 0.40);
}
.filters-row :deep(.v-field--focused .v-field__outline) {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.12);
}
.filters-row :deep(.v-field__outline) { height: 44px; }
.filter-item {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: center;
}
.filter-search {
  flex: 3 1 0;
  min-width: 420px;
  margin-top: -20px;
}
.filter-create {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  margin-top: -26px;
}
.filter-clear {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  margin-left: auto;
  margin-top: -26px;
}
.filters-row :deep(.apple-input-group) {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
  gap: 0;
  width: 100%;
}
.filters-row :deep(.apple-input-container) { height: 44px; width: 100%; }
.filters-row :deep(.apple-input-wrapper-base) {
  height: 44px;
  min-height: 44px;
  width: 100%;
  border-radius: 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.24);
  background: rgb(var(--v-theme-surface));
}
.filters-row :deep(.apple-input-focused) { transform: none; }
.filters-row :deep(.apple-input-container:hover .apple-input-wrapper-base) {
  border-color: rgba(var(--v-theme-primary), 0.40);
}
.filters-row :deep(.apple-input-focused .apple-input-wrapper-base) {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.12);
}
.filter-create :deep(.v-btn),
.filter-clear :deep(.v-btn) {
  height: 44px !important;
  width: 44px !important;
  min-width: 44px !important;
  min-height: 44px !important;
  padding: 0 !important;
  border-radius: 10px !important;
}
.filter-create :deep(.v-btn .v-icon),
.filter-clear :deep(.v-btn .v-icon) {
  font-size: 20px !important;
}
.filter-clear-active {
  position: relative;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3) !important;
  animation: pulse-filter 2s infinite;
}
@keyframes pulse-filter {
  0% { box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3); }
  50% { box-shadow: 0 2px 12px rgba(255, 152, 0, 0.5); }
  100% { box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3); }
}
@media (max-width: 768px) {
  .filters-row { flex-direction: column; gap: 8px; }
  .filter-item, .filter-search { flex: none; width: 100%; min-width: auto; }
  .filter-create, .filter-clear { align-self: flex-end; padding-top: 0; }
}
</style>
