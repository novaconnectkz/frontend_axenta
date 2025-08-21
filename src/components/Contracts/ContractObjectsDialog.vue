<template>
  <v-dialog v-model="dialog" max-width="700px" scrollable>
    <v-card v-if="contract">
      <v-card-title class="dialog-header">
        <v-icon icon="mdi-link" class="mr-3" />
        Привязка объектов к договору
        <div class="contract-info">
          <v-chip size="small" color="primary" variant="tonal">
            {{ contract.number }}
          </v-chip>
        </div>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
      </v-card-title>

      <v-divider />

      <v-card-text class="dialog-content">
        <v-container>
          <!-- Текущие привязанные объекты -->
          <div v-if="currentObjects.length > 0" class="section">
            <h3 class="section-title">
              <v-icon icon="mdi-check-circle" class="mr-2" />
              Привязанные объекты ({{ currentObjects.length }})
            </h3>
            
            <div class="objects-list">
              <v-card
                v-for="object in currentObjects"
                :key="object.id"
                variant="outlined"
                class="object-card"
              >
                <v-card-text class="object-info">
                  <div class="object-header">
                    <div class="object-main">
                      <div class="object-name">{{ object.name }}</div>
                      <div class="object-details">
                        <span v-if="object.imei" class="object-detail">
                          IMEI: {{ object.imei }}
                        </span>
                        <span v-if="object.phone_number" class="object-detail">
                          {{ object.phone_number }}
                        </span>
                        <span v-if="object.location" class="object-detail">
                          {{ object.location }}
                        </span>
                      </div>
                    </div>
                    
                    <div class="object-actions">
                      <v-chip 
                        :color="object.is_active ? 'success' : 'grey'" 
                        size="small"
                        variant="tonal"
                      >
                        {{ object.is_active ? 'Активный' : 'Неактивный' }}
                      </v-chip>
                      
                      <v-tooltip text="Отвязать объект">
                        <template #activator="{ props }">
                          <v-btn
                            v-bind="props"
                            icon="mdi-link-off"
                            size="small"
                            variant="text"
                            color="error"
                            @click="detachObject(object)"
                            :loading="detachingObjects.includes(object.id)"
                          />
                        </template>
                      </v-tooltip>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </div>

          <!-- Доступные для привязки объекты -->
          <div class="section">
            <h3 class="section-title">
              <v-icon icon="mdi-plus-circle" class="mr-2" />
              Доступные объекты
            </h3>
            
            <!-- Поиск и фильтры -->
            <div class="filters-section">
              <v-row>
                <v-col cols="12" md="8">
                  <AppleInput
                    v-model="searchQuery"
                    placeholder="Поиск объектов по названию, IMEI, номеру..."
                    prepend-icon="mdi-magnify"
                    clearable
                    @input="debouncedSearch"
                  />
                </v-col>
                
                <v-col cols="12" md="4">
                  <v-select
                    v-model="statusFilter"
                    :items="statusFilterOptions"
                    label="Статус"
                    variant="outlined"
                    density="comfortable"
                    clearable
                  />
                </v-col>
              </v-row>
            </div>

            <!-- Список доступных объектов -->
            <div v-if="loading" class="loading-section">
              <v-progress-circular indeterminate color="primary" />
              <span class="ml-3">Загрузка объектов...</span>
            </div>

            <div v-else-if="availableObjects.length === 0" class="empty-section">
              <v-icon icon="mdi-inbox" size="48" class="empty-icon" />
              <div class="empty-text">Нет доступных объектов для привязки</div>
            </div>

            <div v-else class="objects-list">
              <v-card
                v-for="object in filteredAvailableObjects"
                :key="object.id"
                variant="outlined"
                class="object-card selectable"
                :class="{ 'selected': selectedObjects.includes(object.id) }"
                @click="toggleObjectSelection(object.id)"
              >
                <v-card-text class="object-info">
                  <div class="object-header">
                    <v-checkbox
                      :model-value="selectedObjects.includes(object.id)"
                      @update:model-value="toggleObjectSelection(object.id)"
                      color="primary"
                      hide-details
                    />
                    
                    <div class="object-main">
                      <div class="object-name">{{ object.name }}</div>
                      <div class="object-details">
                        <span v-if="object.imei" class="object-detail">
                          IMEI: {{ object.imei }}
                        </span>
                        <span v-if="object.phone_number" class="object-detail">
                          {{ object.phone_number }}
                        </span>
                        <span v-if="object.location" class="object-detail">
                          {{ object.location }}
                        </span>
                      </div>
                    </div>
                    
                    <div class="object-status">
                      <v-chip 
                        :color="object.is_active ? 'success' : 'grey'" 
                        size="small"
                        variant="tonal"
                      >
                        {{ object.is_active ? 'Активный' : 'Неактивный' }}
                      </v-chip>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </div>

          <!-- Массовые действия -->
          <div v-if="selectedObjects.length > 0" class="bulk-actions">
            <v-alert type="info" variant="tonal" class="bulk-alert">
              <template #prepend>
                <v-icon icon="mdi-information" />
              </template>
              
              <div class="bulk-info">
                <div class="bulk-text">
                  Выбрано объектов: {{ selectedObjects.length }}
                </div>
                <div class="bulk-buttons">
                  <AppleButton
                    size="small"
                    variant="text"
                    @click="clearSelection"
                  >
                    Очистить выбор
                  </AppleButton>
                  <AppleButton
                    size="small"
                    variant="text"
                    @click="selectAllVisible"
                  >
                    Выбрать все видимые
                  </AppleButton>
                </div>
              </div>
            </v-alert>
          </div>
        </v-container>
      </v-card-text>

      <v-divider />

      <v-card-actions class="dialog-actions">
        <v-spacer />
        <AppleButton variant="text" @click="closeDialog">
          Отмена
        </AppleButton>
        <AppleButton 
          @click="attachSelectedObjects"
          :loading="attaching"
          :disabled="selectedObjects.length === 0"
          color="primary"
          prepend-icon="mdi-link"
        >
          Привязать ({{ selectedObjects.length }})
        </AppleButton>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { debounce } from 'lodash-es';
import type { ContractWithRelations } from '@/types/contracts';
import type { ObjectBase } from '@/types/objects';
import contractsService from '@/services/contractsService';
import { AppleButton, AppleInput } from '@/components/Apple';

// Props
interface Props {
  modelValue: boolean;
  contract?: ContractWithRelations | null;
}

const props = withDefaults(defineProps<Props>(), {
  contract: null,
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  success: [message: string];
  error: [message: string];
}>();

// Reactive data
const loading = ref(false);
const attaching = ref(false);
const searchQuery = ref('');
const statusFilter = ref<string | null>(null);
const selectedObjects = ref<number[]>([]);
const detachingObjects = ref<number[]>([]);
const availableObjects = ref<ObjectBase[]>([]);

// Computed
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const currentObjects = computed(() => {
  return props.contract?.objects || [];
});

const filteredAvailableObjects = computed(() => {
  let filtered = availableObjects.value;

  // Фильтр по поисковому запросу
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(obj =>
      obj.name.toLowerCase().includes(query) ||
      obj.imei?.toLowerCase().includes(query) ||
      obj.phone_number?.toLowerCase().includes(query) ||
      obj.location?.toLowerCase().includes(query)
    );
  }

  // Фильтр по статусу
  if (statusFilter.value !== null) {
    const isActive = statusFilter.value === 'active';
    filtered = filtered.filter(obj => obj.is_active === isActive);
  }

  return filtered;
});

// Options
const statusFilterOptions = [
  { value: 'active', title: 'Активные' },
  { value: 'inactive', title: 'Неактивные' },
];

// Methods
const loadAvailableObjects = async () => {
  if (!props.contract) return;

  loading.value = true;
  try {
    // В демо режиме создаем заглушки доступных объектов
    const mockObjects: ObjectBase[] = [
      {
        id: 10,
        created_at: "2024-01-25T10:00:00Z",
        updated_at: "2024-01-25T10:00:00Z",
        name: "Автомобиль A-010",
        description: "Доступный для привязки автомобиль",
        type: "vehicle",
        status: "active",
        is_active: true,
        company_id: 1,
        imei: "123456789012350",
        phone_number: "+79161234575",
        location: "Москва",
        last_seen: "2024-01-25T16:30:00Z",
        battery_level: 88,
        template_id: 1,
      },
      {
        id: 11,
        created_at: "2024-01-26T10:00:00Z",
        updated_at: "2024-01-26T10:00:00Z",
        name: "Грузовик B-011",
        description: "Грузовой автомобиль без договора",
        type: "vehicle",
        status: "active",
        is_active: true,
        company_id: 1,
        imei: "123456789012351",
        phone_number: "+79161234576",
        location: "Подольск",
        last_seen: "2024-01-26T14:15:00Z",
        battery_level: 76,
        template_id: 1,
      },
      {
        id: 12,
        created_at: "2024-01-27T10:00:00Z",
        updated_at: "2024-01-27T10:00:00Z",
        name: "Спецтехника C-012",
        description: "Специальная техника",
        type: "equipment",
        status: "inactive",
        is_active: false,
        company_id: 1,
        imei: "123456789012352",
        phone_number: "+79161234577",
        location: "Склад",
        last_seen: "2024-01-25T10:00:00Z",
        battery_level: 45,
        template_id: 2,
      },
      {
        id: 13,
        created_at: "2024-01-28T10:00:00Z",
        updated_at: "2024-01-28T10:00:00Z",
        name: "Мотоцикл D-013",
        description: "Курьерский мотоцикл",
        type: "vehicle",
        status: "active",
        is_active: true,
        company_id: 1,
        imei: "123456789012353",
        phone_number: "+79161234578",
        location: "Центр",
        last_seen: "2024-01-28T18:45:00Z",
        battery_level: 92,
        template_id: 1,
      },
    ];

    // Исключаем уже привязанные объекты
    const currentObjectIds = currentObjects.value.map(obj => obj.id);
    availableObjects.value = mockObjects.filter(obj => !currentObjectIds.includes(obj.id));

  } catch (error) {
    console.error('Error loading available objects:', error);
    emit('error', 'Ошибка загрузки доступных объектов');
  } finally {
    loading.value = false;
  }
};

const toggleObjectSelection = (objectId: number) => {
  const index = selectedObjects.value.indexOf(objectId);
  if (index > -1) {
    selectedObjects.value.splice(index, 1);
  } else {
    selectedObjects.value.push(objectId);
  }
};

const clearSelection = () => {
  selectedObjects.value = [];
};

const selectAllVisible = () => {
  const visibleIds = filteredAvailableObjects.value.map(obj => obj.id);
  selectedObjects.value = [...new Set([...selectedObjects.value, ...visibleIds])];
};

const attachSelectedObjects = async () => {
  if (!props.contract || selectedObjects.value.length === 0) return;

  attaching.value = true;
  try {
    await contractsService.attachObjectsToContract(props.contract.id, {
      object_ids: selectedObjects.value,
    });

    const objectCount = selectedObjects.value.length;
    emit('success', `Успешно привязано объектов: ${objectCount}`);
    
    selectedObjects.value = [];
    await loadAvailableObjects();
    closeDialog();
  } catch (error: any) {
    console.error('Error attaching objects:', error);
    emit('error', error.message || 'Ошибка привязки объектов');
  } finally {
    attaching.value = false;
  }
};

const detachObject = async (object: ObjectBase) => {
  if (!props.contract) return;

  if (!confirm(`Вы уверены, что хотите отвязать объект "${object.name}"?`)) {
    return;
  }

  detachingObjects.value.push(object.id);
  try {
    await contractsService.detachObjectFromContract(props.contract.id, object.id);
    emit('success', `Объект "${object.name}" отвязан от договора`);
    await loadAvailableObjects();
  } catch (error: any) {
    console.error('Error detaching object:', error);
    emit('error', error.message || 'Ошибка отвязки объекта');
  } finally {
    const index = detachingObjects.value.indexOf(object.id);
    if (index > -1) {
      detachingObjects.value.splice(index, 1);
    }
  }
};

const closeDialog = () => {
  dialog.value = false;
  selectedObjects.value = [];
  searchQuery.value = '';
  statusFilter.value = null;
};

const debouncedSearch = debounce(() => {
  // Поиск выполняется автоматически через computed свойство
}, 300);

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    loadAvailableObjects();
  }
});

// Lifecycle
onMounted(() => {
  if (props.modelValue) {
    loadAvailableObjects();
  }
});
</script>

<style scoped>
.dialog-header {
  padding: 20px 24px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.contract-info {
  margin-left: auto;
  margin-right: 16px;
}

.dialog-content {
  padding: 0;
  max-height: 70vh;
  overflow-y: auto;
}

.dialog-actions {
  padding: 16px 24px 20px;
}

.section {
  margin-bottom: 32px;
  padding: 0 24px;
}

.section:last-child {
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  color: rgb(var(--v-theme-primary));
}

.filters-section {
  margin-bottom: 16px;
}

.loading-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.empty-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
}

.objects-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.object-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: all 0.2s ease;
}

.object-card.selectable {
  cursor: pointer;
}

.object-card.selectable:hover {
  border-color: rgb(var(--v-theme-primary));
  transform: translateY(-1px);
}

.object-card.selected {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.object-info {
  padding: 16px;
}

.object-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.object-main {
  flex: 1;
  min-width: 0;
}

.object-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.object-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.object-detail {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.object-actions,
.object-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bulk-actions {
  position: sticky;
  bottom: 0;
  background: rgb(var(--v-theme-surface));
  padding: 16px 24px;
  margin: 0 -24px -16px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.bulk-alert {
  margin: 0;
}

.bulk-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.bulk-text {
  font-weight: 600;
}

.bulk-buttons {
  display: flex;
  gap: 8px;
}

/* Responsive */
@media (max-width: 768px) {
  .dialog-header {
    padding: 16px 20px 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .section {
    padding: 0 20px;
    margin-bottom: 24px;
  }

  .object-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .object-details {
    flex-direction: column;
    gap: 4px;
  }

  .bulk-info {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .bulk-buttons {
    align-self: stretch;
    justify-content: space-between;
  }

  .dialog-actions {
    padding: 12px 20px 16px;
    flex-direction: column;
    gap: 8px;
  }
}
</style>

