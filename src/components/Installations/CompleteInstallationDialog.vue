<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600"
    persistent
  >
    <AppleCard v-if="installation">
      <template #header>
        <div class="dialog-header">
          <v-icon icon="mdi-check-circle" color="success" class="mr-2" />
          Завершение монтажа
        </div>
      </template>

      <div class="dialog-content">
        <!-- Информация о монтаже -->
        <div class="installation-info">
          <h4 class="info-title">{{ installation.type }}</h4>
          <div class="info-details">
            <div class="info-item">
              <v-icon icon="mdi-office-building" size="small" class="mr-2" />
              {{ installation.object.name }}
            </div>
            <div class="info-item">
              <v-icon icon="mdi-account-hard-hat" size="small" class="mr-2" />
              {{ installation.installer.first_name }} {{ installation.installer.last_name }}
            </div>
            <div class="info-item">
              <v-icon icon="mdi-calendar-clock" size="small" class="mr-2" />
              {{ formatDateTime(installation.scheduled_at) }}
            </div>
          </div>
        </div>

        <v-divider class="my-4" />

        <!-- Форма завершения -->
        <v-form ref="form" @submit.prevent="handleSubmit">
          <v-row>
            <v-col cols="12">
              <v-textarea
                v-model="formData.result"
                label="Результат выполнения"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
                rows="3"
                placeholder="Опишите результат выполненных работ"
                required
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.actual_duration"
                label="Фактическое время выполнения"
                type="number"
                min="1"
                :rules="[rules.required, rules.duration]"
                variant="outlined"
                density="comfortable"
                suffix="мин"
                :placeholder="`Плановое: ${installation.estimated_duration} мин`"
                required
              />
            </v-col>
            
            <v-col v-if="installation.is_billable" cols="12" md="6">
              <v-text-field
                v-model.number="formData.materials_cost"
                label="Стоимость материалов"
                type="number"
                min="0"
                variant="outlined"
                density="comfortable"
                prefix="₽"
                placeholder="0"
              />
            </v-col>
            
            <v-col v-if="installation.is_billable" cols="12" md="6">
              <v-text-field
                v-model.number="formData.labor_cost"
                label="Стоимость работ"
                type="number"
                min="0"
                variant="outlined"
                density="comfortable"
                prefix="₽"
                :placeholder="`Плановая: ${installation.labor_cost || 0} ₽`"
              />
            </v-col>
            
            <v-col cols="12">
              <v-textarea
                v-model="formData.notes"
                label="Дополнительные заметки"
                variant="outlined"
                density="comfortable"
                rows="2"
                placeholder="Дополнительная информация о выполненных работах"
              />
            </v-col>
            
            <!-- Установленное оборудование -->
            <v-col cols="12">
              <v-select
                v-model="formData.equipment_installed"
                :items="equipmentOptions"
                label="Установленное оборудование"
                multiple
                chips
                variant="outlined"
                density="comfortable"
                clearable
              >
                <template #chip="{ props, item }">
                  <v-chip v-bind="props" color="success">
                    <template #prepend>
                      <v-icon icon="mdi-check" size="small" />
                    </template>
                    {{ item.title }}
                  </v-chip>
                </template>
                
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-icon icon="mdi-tools" />
                    </template>
                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.raw.subtitle }}</v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>
            
            <!-- Загрузка фотографий -->
            <v-col cols="12">
              <v-file-input
                v-model="formData.photos"
                label="Фотографии работ"
                multiple
                accept="image/*"
                variant="outlined"
                density="comfortable"
                prepend-icon="mdi-camera"
                show-size
              >
                <template #selection="{ fileNames }">
                  <template v-for="fileName in fileNames" :key="fileName">
                    <v-chip
                      size="small"
                      color="primary"
                      class="me-2"
                    >
                      {{ fileName }}
                    </v-chip>
                  </template>
                </template>
              </v-file-input>
              <div class="file-hint">
                Рекомендуется загрузить фотографии до и после выполнения работ
              </div>
            </v-col>
          </v-row>
        </v-form>

        <!-- Предварительный расчет стоимости -->
        <v-card
          v-if="installation.is_billable && (formData.labor_cost || formData.materials_cost)"
          variant="outlined"
          class="cost-summary mt-4"
        >
          <v-card-title class="cost-title">
            <v-icon icon="mdi-calculator" class="mr-2" />
            Итоговая стоимость
          </v-card-title>
          <v-card-text>
            <div class="cost-breakdown">
              <div v-if="formData.labor_cost" class="cost-item">
                <span>Работы:</span>
                <span>{{ formatCurrency(formData.labor_cost) }}</span>
              </div>
              <div v-if="formData.materials_cost" class="cost-item">
                <span>Материалы:</span>
                <span>{{ formatCurrency(formData.materials_cost) }}</span>
              </div>
              <v-divider class="my-2" />
              <div class="cost-item total">
                <span>Итого:</span>
                <span>{{ formatCurrency(totalCost) }}</span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <template #actions>
        <div class="dialog-actions">
          <AppleButton
            variant="secondary"
            @click="handleCancel"
          >
            Отмена
          </AppleButton>
          
          <AppleButton
            color="success"
            :loading="saving"
            @click="handleSubmit"
          >
            Завершить монтаж
          </AppleButton>
        </div>
      </template>
    </AppleCard>
  </v-dialog>
</template>

<script setup lang="ts">
import { AppleButton, AppleCard } from "@/components/Apple";
import type { CompleteInstallationForm, InstallationWithRelations } from "@/types/installations";
import { useErrorHandler } from "@/utils/errorHandler";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { computed, ref, watch } from "vue";

interface Props {
  modelValue: boolean;
  installation?: InstallationWithRelations | null;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "complete", data: CompleteInstallationForm): void;
}

const props = withDefaults(defineProps<Props>(), {
  installation: null,
});

const emit = defineEmits<Emits>();

// Состояние формы
const form = ref();
const saving = ref(false);

// Данные формы
const formData = ref<CompleteInstallationForm>({
  result: "",
  actual_duration: 0,
  notes: "",
  materials_cost: 0,
  labor_cost: 0,
  equipment_installed: [],
  photos: [],
});

// Правила валидации
const rules = {
  required: (value: any) => !!value || "Поле обязательно для заполнения",
  duration: (value: number) => {
    if (!value) return "Поле обязательно для заполнения";
    if (value < 1) return "Минимальная длительность 1 минута";
    return true;
  },
};

// Опции оборудования
const equipmentOptions = computed(() => {
  if (!props.installation?.equipment) return [];
  
  return props.installation.equipment.map(item => ({
    title: `${item.brand} ${item.model}`,
    subtitle: `${item.type} - S/N: ${item.serial_number}`,
    value: item.id,
  }));
});

// Общая стоимость
const totalCost = computed(() => {
  return (formData.value.labor_cost || 0) + (formData.value.materials_cost || 0);
});

// Обработчик ошибок
const { handleError } = useErrorHandler();

// Функции форматирования
const formatDateTime = (dateString: string): string => {
  return format(new Date(dateString), "dd.MM.yyyy HH:mm", { locale: ru });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
  }).format(amount);
};

// Инициализация формы
const initializeForm = () => {
  if (!props.installation) return;
  
  formData.value = {
    result: "",
    actual_duration: props.installation.estimated_duration,
    notes: "",
    materials_cost: 0,
    labor_cost: props.installation.labor_cost || 0,
    equipment_installed: [],
    photos: [],
  };
};

// Обработчики
const handleSubmit = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    emit("complete", { ...formData.value });
  } catch (error) {
    handleError(error, "Ошибка завершения монтажа");
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  emit("update:modelValue", false);
};

// Отслеживание изменений
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    initializeForm();
  }
});
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  font-weight: 600;
}

.dialog-content {
  padding: 24px 0;
  max-height: 70vh;
  overflow-y: auto;
}

.installation-info {
  margin-bottom: 16px;
}

.info-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: rgb(var(--v-theme-on-surface));
}

.info-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.file-hint {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 4px;
}

/* Расчет стоимости */
.cost-summary {
  background: rgb(var(--v-theme-surface-variant));
}

.cost-title {
  font-size: 1rem;
  font-weight: 600;
  padding: 12px 16px;
}

.cost-breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cost-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cost-item.total {
  font-weight: 600;
  font-size: 1.1rem;
  color: rgb(var(--v-theme-success));
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Адаптивность */
@media (max-width: 768px) {
  .dialog-content {
    max-height: 60vh;
  }
  
  .info-details {
    gap: 6px;
  }
  
  .dialog-actions {
    flex-direction: column;
  }
}
</style>
