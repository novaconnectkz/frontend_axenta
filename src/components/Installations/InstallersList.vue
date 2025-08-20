<template>
  <div class="installers-list">
    <!-- Заголовок и фильтры -->
    <AppleCard variant="outlined" class="filters-card mb-4">
      <template #header>
        <div class="filters-header">
          <v-icon icon="mdi-account-hard-hat" class="mr-2" />
          Монтажники
          <v-chip class="ml-2" size="small">{{ installers.length }}</v-chip>
          <v-spacer />
          <AppleButton
            prepend-icon="mdi-plus"
            @click="$emit('installer-edit', null)"
            size="small"
          >
            Добавить монтажника
          </AppleButton>
        </div>
      </template>
      
      <div class="filters-content">
        <v-row>
          <v-col cols="12" md="3">
            <AppleInput
              v-model="filters.search"
              placeholder="Поиск по имени, телефону..."
              prepend-icon="mdi-magnify"
              clearable
              @input="debouncedSearch"
            />
          </v-col>
          
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.type"
              :items="typeOptions"
              label="Тип"
              clearable
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Статус"
              clearable
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.specialization"
              :items="specializationOptions"
              label="Специализация"
              clearable
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          
          <v-col cols="12" md="2">
            <v-checkbox
              v-model="filters.is_active"
              label="Только активные"
              density="comfortable"
            />
          </v-col>
        </v-row>
      </div>
    </AppleCard>

    <!-- Список монтажников -->
    <div v-if="loading" class="loading-state">
      <v-progress-circular indeterminate />
      <p class="mt-4">Загрузка монтажников...</p>
    </div>
    
    <div v-else-if="filteredInstallers.length === 0" class="empty-state">
      <v-icon icon="mdi-account-off" size="64" class="mb-4" />
      <h3>Монтажники не найдены</h3>
      <p class="text-medium-emphasis">
        Попробуйте изменить фильтры или добавить нового монтажника
      </p>
    </div>
    
    <div v-else class="installers-grid">
      <InstallerCard
        v-for="installer in filteredInstallers"
        :key="installer.id"
        :installer="installer"
        @click="$emit('installer-click', installer)"
        @edit="$emit('installer-edit', installer)"
        @delete="$emit('installer-delete', installer)"
        @toggle="$emit('installer-toggle', installer)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import AppleButton from "@/components/Apple/AppleButton.vue";
import AppleCard from "@/components/Apple/AppleCard.vue";
import AppleInput from "@/components/Apple/AppleInput.vue";
import type { InstallerFilters, InstallerWithRelations } from "@/types/installations";
import { debounce } from "lodash-es";
import { computed, ref, watch } from "vue";
import InstallerCard from "./InstallerCard.vue";

interface Props {
  installers: InstallerWithRelations[];
  loading?: boolean;
}

interface Emits {
  (e: "installer-click", installer: InstallerWithRelations): void;
  (e: "installer-edit", installer: InstallerWithRelations | null): void;
  (e: "installer-delete", installer: InstallerWithRelations): void;
  (e: "installer-toggle", installer: InstallerWithRelations): void;
  (e: "filters-change", filters: InstallerFilters): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();

// Фильтры
const filters = ref<InstallerFilters>({
  search: "",
  type: undefined,
  status: undefined,
  specialization: undefined,
  is_active: true,
  ordering: "first_name",
});

// Опции для селектов
const typeOptions = [
  { title: "Штатный", value: "staff" },
  { title: "Подрядчик", value: "contractor" },
  { title: "Партнер", value: "partner" },
];

const statusOptions = [
  { title: "Доступен", value: "available" },
  { title: "Занят", value: "busy" },
  { title: "В отпуске", value: "vacation" },
  { title: "На больничном", value: "sick" },
];

// Опции специализации (извлекаем из данных)
const specializationOptions = computed(() => {
  const specializations = new Set<string>();
  props.installers.forEach(installer => {
    installer.specialization.forEach(spec => specializations.add(spec));
  });
  return Array.from(specializations).map(spec => ({
    title: spec,
    value: spec,
  }));
});

// Отфильтрованные монтажники
const filteredInstallers = computed(() => {
  let result = [...props.installers];

  // Фильтр по поиску
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase();
    result = result.filter(installer =>
      installer.first_name.toLowerCase().includes(search) ||
      installer.last_name.toLowerCase().includes(search) ||
      installer.phone.includes(search) ||
      installer.email.toLowerCase().includes(search)
    );
  }

  // Фильтр по типу
  if (filters.value.type) {
    result = result.filter(installer => installer.type === filters.value.type);
  }

  // Фильтр по статусу
  if (filters.value.status) {
    result = result.filter(installer => installer.status === filters.value.status);
  }

  // Фильтр по специализации
  if (filters.value.specialization) {
    result = result.filter(installer =>
      installer.specialization.includes(filters.value.specialization!)
    );
  }

  // Фильтр по активности
  if (filters.value.is_active !== undefined) {
    result = result.filter(installer => installer.is_active === filters.value.is_active);
  }

  // Сортировка
  result.sort((a, b) => {
    switch (filters.value.ordering) {
      case "first_name":
        return a.first_name.localeCompare(b.first_name);
      case "-first_name":
        return b.first_name.localeCompare(a.first_name);
      case "type":
        return a.type.localeCompare(b.type);
      case "status":
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  return result;
});

// Дебаунсированный поиск
const debouncedSearch = debounce(() => {
  emit("filters-change", { ...filters.value });
}, 300);

// Отслеживание изменений фильтров
watch(filters, (newFilters) => {
  if (newFilters.search === filters.value.search) {
    // Для остальных фильтров обновляем сразу
    emit("filters-change", { ...newFilters });
  }
}, { deep: true });
</script>

<style scoped>
.installers-list {
  width: 100%;
}

.filters-card {
  margin-bottom: 16px;
}

.filters-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.filters-content {
  padding: 16px 0;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.installers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

/* Адаптивность */
@media (max-width: 768px) {
  .filters-content .v-row {
    gap: 8px;
  }
  
  .filters-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .installers-grid {
    grid-template-columns: 1fr;
  }
}
</style>
