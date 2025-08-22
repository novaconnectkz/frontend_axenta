<template>
  <div class="equipment-list">
    <!-- Заголовок и фильтры -->
    <AppleCard variant="outlined" class="filters-card mb-4">
      <template #header>
        <div class="filters-header">
          <v-icon icon="mdi-tools" class="mr-2" />
          Оборудование
          <v-chip class="ml-2" size="small">{{ equipment.length }}</v-chip>
          <v-spacer />
          <AppleButton
            prepend-icon="mdi-plus"
            @click="$emit('equipment-edit', null)"
            size="small"
          >
            Добавить оборудование
          </AppleButton>
        </div>
      </template>
      
      <div class="filters-content">
        <v-row>
          <v-col cols="12" md="3">
            <AppleInput
              v-model="filters.search"
              placeholder="Поиск по модели, S/N, IMEI..."
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
          
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.condition"
              :items="conditionOptions"
              label="Состояние"
              clearable
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          
          <v-col cols="12" md="3">
            <v-select
              v-model="viewMode"
              :items="viewModeOptions"
              label="Режим просмотра"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
        </v-row>
      </div>
    </AppleCard>

    <!-- Статистика -->
    <div class="stats-section mb-4">
      <div class="stats-grid">
        <AppleCard
          v-for="stat in stats"
          :key="stat.key"
          :title="stat.value.toString()"
          :subtitle="stat.label"
          :icon="stat.icon"
          :icon-color="stat.color"
          variant="outlined"
          class="stat-card"
        />
      </div>
    </div>

    <!-- Список оборудования -->
    <div v-if="loading" class="loading-state">
      <v-progress-circular indeterminate />
      <p class="mt-4">Загрузка оборудования...</p>
    </div>
    
    <div v-else-if="filteredEquipment.length === 0" class="empty-state">
      <v-icon icon="mdi-package-variant" size="64" class="mb-4" />
      <h3>Оборудование не найдено</h3>
      <p class="text-medium-emphasis">
        Попробуйте изменить фильтры или добавить новое оборудование
      </p>
    </div>
    
    <!-- Табличный вид -->
    <AppleCard v-else-if="viewMode === 'table'" variant="outlined">
      <v-data-table
        :headers="tableHeaders"
        :items="filteredEquipment"
        :loading="loading"
        item-key="id"
        class="equipment-table"
        hover
        @click:row="handleRowClick"
      >
        <!-- Слоты для кастомного отображения колонок -->
        <template #item.type="{ item }">
          <div class="type-cell">
            <v-icon :icon="getTypeIcon(item.type)" size="small" class="mr-2" />
            {{ item.type }}
          </div>
        </template>
        
        <template #item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
            variant="flat"
          >
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>
        
        <template #item.condition="{ item }">
          <v-chip
            :color="getConditionColor(item.condition)"
            size="small"
            variant="outlined"
          >
            {{ getConditionText(item.condition) }}
          </v-chip>
        </template>
        
        <template #item.model="{ item }">
          <div class="model-cell">
            <div class="model-name">{{ item.brand }} {{ item.model }}</div>
            <div class="model-serial">S/N: {{ item.serial_number }}</div>
          </div>
        </template>
        
        <template #item.identifiers="{ item }">
          <div class="identifiers-cell">
            <div v-if="item.imei" class="identifier">
              <span class="identifier-label">IMEI:</span>
              {{ item.imei }}
            </div>
            <div v-if="item.phone_number" class="identifier">
              <span class="identifier-label">Tel:</span>
              {{ item.phone_number }}
            </div>
          </div>
        </template>
        
        <template #item.object_id="{ item }">
          <v-chip
            v-if="item.object_id"
            size="small"
            variant="tonal"
            color="info"
          >
            Установлено
          </v-chip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>
        
        <template #item.warranty_expires_at="{ item }">
          <span v-if="item.warranty_expires_at" :class="getWarrantyClass(item.warranty_expires_at)">
            {{ formatDate(item.warranty_expires_at) }}
          </span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>
        
        <template #item.actions="{ item }">
          <div class="actions-cell">
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click.stop="$emit('equipment-edit', item)"
            />
            
            <v-btn
              v-if="item.status === 'in_stock'"
              icon="mdi-package-up"
              size="small"
              variant="text"
              color="success"
              @click.stop="handleInstall(item)"
            />
            
            <v-menu>
              <template #activator="{ props }">
                <v-btn
                  icon="mdi-dots-vertical"
                  size="small"
                  variant="text"
                  v-bind="props"
                  @click.stop
                />
              </template>
              
              <v-list density="compact">
                <v-list-item
                  v-if="item.qr_code"
                  prepend-icon="mdi-qrcode"
                  title="QR код"
                  @click="showQRCode(item)"
                />
                <v-list-item
                  prepend-icon="mdi-history"
                  title="История"
                  @click="showHistory(item)"
                />
                <v-divider />
                <v-list-item
                  prepend-icon="mdi-delete"
                  title="Удалить"
                  @click="$emit('equipment-delete', item)"
                />
              </v-list>
            </v-menu>
          </div>
        </template>
      </v-data-table>
    </AppleCard>
    
    <!-- Карточный вид -->
    <div v-else class="equipment-grid">
      <EquipmentCard
        v-for="item in filteredEquipment"
        :key="item.id"
        :equipment="item"
        @click="$emit('equipment-click', item)"
        @edit="$emit('equipment-edit', item)"
        @delete="$emit('equipment-delete', item)"
        @install="handleInstall"
      />
    </div>

    <!-- Диалог установки оборудования -->
    <v-dialog v-model="showInstallDialog" max-width="400">
      <AppleCard>
        <template #header>
          <div class="dialog-header">
            <v-icon icon="mdi-package-up" class="mr-2" />
            Установка оборудования
          </div>
        </template>

        <div class="dialog-content">
          <p>Выберите объект для установки оборудования:</p>
          <v-autocomplete
            v-model="selectedObjectId"
            :items="objectOptions"
            label="Объект"
            variant="outlined"
            density="comfortable"
            :loading="loadingObjects"
            @update:search="searchObjects"
          />
        </div>

        <template #actions>
          <div class="dialog-actions">
            <AppleButton
              variant="secondary"
              @click="showInstallDialog = false"
            >
              Отмена
            </AppleButton>
            
            <AppleButton
              :disabled="!selectedObjectId"
              @click="confirmInstall"
            >
              Установить
            </AppleButton>
          </div>
        </template>
      </AppleCard>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import AppleButton from "@/components/Apple/AppleButton.vue";
import AppleCard from "@/components/Apple/AppleCard.vue";
import AppleInput from "@/components/Apple/AppleInput.vue";
import { getObjectsService } from "@/services/objectsService";
import type { EquipmentBase, EquipmentFilters } from "@/types/installations";
import type { ObjectWithRelations } from "@/types/objects";
import { useErrorHandler } from "@/utils/errorHandler";
import { addMonths, format, isBefore } from "date-fns";
import { ru } from "date-fns/locale";
import { debounce } from "lodash-es";
import { computed, ref, watch } from "vue";
import EquipmentCard from "./EquipmentCard.vue";

interface Props {
  equipment: EquipmentBase[];
  loading?: boolean;
}

interface Emits {
  (e: "equipment-click", equipment: EquipmentBase): void;
  (e: "equipment-edit", equipment: EquipmentBase | null): void;
  (e: "equipment-delete", equipment: EquipmentBase): void;
  (e: "equipment-install", equipment: EquipmentBase, objectId: number): void;
  (e: "filters-change", filters: EquipmentFilters): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();

// Состояние компонента
const viewMode = ref<"table" | "cards">("table");
const showInstallDialog = ref(false);
const selectedEquipment = ref<EquipmentBase | null>(null);
const selectedObjectId = ref<number | null>(null);
const loadingObjects = ref(false);
const objects = ref<ObjectWithRelations[]>([]);

// Фильтры
const filters = ref<EquipmentFilters>({
  search: "",
  type: undefined,
  status: undefined,
  condition: undefined,
  ordering: "type",
});

// Опции для селектов
const viewModeOptions = [
  { title: "Таблица", value: "table" },
  { title: "Карточки", value: "cards" },
];

const statusOptions = [
  { title: "На складе", value: "in_stock" },
  { title: "Зарезервировано", value: "reserved" },
  { title: "Установлено", value: "installed" },
  { title: "На обслуживании", value: "maintenance" },
];

const conditionOptions = [
  { title: "Новое", value: "new" },
  { title: "Б/У", value: "used" },
  { title: "Восстановленное", value: "refurbished" },
  { title: "Поврежденное", value: "damaged" },
];

// Типы оборудования (извлекаем из данных)
const typeOptions = computed(() => {
  const types = new Set<string>();
  props.equipment.forEach(item => types.add(item.type));
  return Array.from(types).map(type => ({
    title: type,
    value: type,
  }));
});

// Заголовки таблицы
const tableHeaders = [
  { title: "Тип", key: "type", width: 150 },
  { title: "Модель", key: "model", width: 200 },
  { title: "Статус", key: "status", width: 120 },
  { title: "Состояние", key: "condition", width: 120 },
  { title: "Идентификаторы", key: "identifiers", width: 180 },
  { title: "Установлено", key: "object_id", width: 120 },
  { title: "Гарантия до", key: "warranty_expires_at", width: 120 },
  { title: "Действия", key: "actions", width: 120, sortable: false },
];

// Отфильтрованное оборудование
const filteredEquipment = computed(() => {
  let result = [...props.equipment];

  // Фильтр по поиску
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase();
    result = result.filter(item =>
      item.brand.toLowerCase().includes(search) ||
      item.model.toLowerCase().includes(search) ||
      item.serial_number.toLowerCase().includes(search) ||
      item.imei?.toLowerCase().includes(search) ||
      item.phone_number?.includes(search)
    );
  }

  // Остальные фильтры
  if (filters.value.type) {
    result = result.filter(item => item.type === filters.value.type);
  }

  if (filters.value.status) {
    result = result.filter(item => item.status === filters.value.status);
  }

  if (filters.value.condition) {
    result = result.filter(item => item.condition === filters.value.condition);
  }

  return result;
});

// Статистика
const stats = computed(() => {
  const total = props.equipment.length;
  const inStock = props.equipment.filter(item => item.status === "in_stock").length;
  const installed = props.equipment.filter(item => item.status === "installed").length;
  const maintenance = props.equipment.filter(item => item.status === "maintenance").length;

  return [
    {
      key: "total",
      label: "Всего единиц",
      value: total,
      icon: "mdi-package-variant",
      color: "primary"
    },
    {
      key: "in_stock",
      label: "На складе",
      value: inStock,
      icon: "mdi-package",
      color: "success"
    },
    {
      key: "installed",
      label: "Установлено",
      value: installed,
      icon: "mdi-package-up",
      color: "info"
    },
    {
      key: "maintenance",
      label: "На обслуживании",
      value: maintenance,
      icon: "mdi-wrench",
      color: "warning"
    }
  ];
});

// Опции объектов для установки
const objectOptions = computed(() =>
  objects.value.map(object => ({
    title: object.name,
    subtitle: `${object.type}${object.imei ? ` - IMEI: ${object.imei}` : ''}`,
    value: object.id,
  }))
);

// Обработчик ошибок
const { handleError } = useErrorHandler();

// Функции форматирования и получения данных
const formatDate = (dateString: string): string => {
  return format(new Date(dateString), "dd.MM.yyyy", { locale: ru });
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case "in_stock":
      return "success";
    case "reserved":
      return "warning";
    case "installed":
      return "info";
    case "maintenance":
      return "error";
    default:
      return "default";
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case "in_stock":
      return "На складе";
    case "reserved":
      return "Зарезервировано";
    case "installed":
      return "Установлено";
    case "maintenance":
      return "На обслуживании";
    default:
      return status;
  }
};

const getConditionColor = (condition: string): string => {
  switch (condition) {
    case "new":
      return "success";
    case "used":
      return "info";
    case "refurbished":
      return "warning";
    case "damaged":
      return "error";
    default:
      return "default";
  }
};

const getConditionText = (condition: string): string => {
  switch (condition) {
    case "new":
      return "Новое";
    case "used":
      return "Б/У";
    case "refurbished":
      return "Восстановленное";
    case "damaged":
      return "Поврежденное";
    default:
      return condition;
  }
};

const getTypeIcon = (_type: string): string => {
  // Можно добавить специфичные иконки для разных типов оборудования
  return "mdi-tools";
};

const getWarrantyClass = (warrantyDate: string): string => {
  const warranty = new Date(warrantyDate);
  const now = new Date();
  const threeMonthsFromNow = addMonths(now, 3);

  if (isBefore(warranty, now)) {
    return "warranty-expired";
  } else if (isBefore(warranty, threeMonthsFromNow)) {
    return "warranty-expiring";
  }
  return "";
};

// Дебаунсированный поиск
const debouncedSearch = debounce(() => {
  emit("filters-change", { ...filters.value });
}, 300);

// Поиск объектов
const searchObjects = debounce(async (search: string) => {
  if (!search || search.length < 2) return;
  
  loadingObjects.value = true;
  try {
    const response = await getObjectsService().getObjects(1, 20, { search });
    objects.value = response.data.items;
  } catch (error) {
    handleError(error, "Ошибка поиска объектов");
  } finally {
    loadingObjects.value = false;
  }
}, 300);

// Обработчики событий
const handleRowClick = (_event: Event, { item }: { item: EquipmentBase }) => {
  emit("equipment-click", item);
};

const handleInstall = (equipment: EquipmentBase) => {
  selectedEquipment.value = equipment;
  showInstallDialog.value = true;
};

const confirmInstall = () => {
  if (selectedEquipment.value && selectedObjectId.value) {
    emit("equipment-install", selectedEquipment.value, selectedObjectId.value);
    showInstallDialog.value = false;
    selectedEquipment.value = null;
    selectedObjectId.value = null;
  }
};

const showQRCode = (equipment: EquipmentBase) => {
  // TODO: Реализовать показ QR кода
  console.log("Show QR code for equipment:", equipment.id);
};

const showHistory = (equipment: EquipmentBase) => {
  // TODO: Реализовать показ истории
  console.log("Show history for equipment:", equipment.id);
};

// Отслеживание изменений фильтров
watch(filters, (newFilters) => {
  if (newFilters.search === filters.value.search) {
    emit("filters-change", { ...newFilters });
  }
}, { deep: true });
</script>

<style scoped>
.equipment-list {
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

.stats-section {
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  min-height: 100px;
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

/* Табличный вид */
.equipment-table :deep(.v-data-table__tr) {
  cursor: pointer;
}

.equipment-table :deep(.v-data-table__tr:hover) {
  background-color: rgb(var(--v-theme-surface-variant));
}

.type-cell {
  display: flex;
  align-items: center;
}

.model-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.model-name {
  font-weight: 500;
}

.model-serial {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.identifiers-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.875rem;
}

.identifier-label {
  font-weight: 500;
  margin-right: 4px;
}

.actions-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Карточный вид */
.equipment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

/* Гарантия */
.warranty-expired {
  color: rgb(var(--v-theme-error));
  font-weight: 500;
}

.warranty-expiring {
  color: rgb(var(--v-theme-warning));
  font-weight: 500;
}

/* Диалог */
.dialog-header {
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  font-weight: 600;
}

.dialog-content {
  padding: 24px 0;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
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
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .equipment-grid {
    grid-template-columns: 1fr;
  }
  
  .dialog-actions {
    flex-direction: column;
  }
}
</style>
