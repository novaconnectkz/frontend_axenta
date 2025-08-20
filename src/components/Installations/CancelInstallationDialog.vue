<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500"
    persistent
  >
    <AppleCard v-if="installation">
      <template #header>
        <div class="dialog-header">
          <v-icon icon="mdi-close-circle" color="error" class="mr-2" />
          Отмена монтажа
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

        <!-- Предупреждение -->
        <v-alert
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          <div class="alert-content">
            <strong>Внимание!</strong>
            <p class="mt-2 mb-0">
              Отмена монтажа приведет к изменению его статуса на "Отменен". 
              При необходимости вы можете создать новый монтаж или перенести существующий.
            </p>
          </div>
        </v-alert>

        <!-- Форма отмены -->
        <v-form ref="form" @submit.prevent="handleSubmit">
          <v-row>
            <v-col cols="12">
              <v-select
                v-model="formData.reason"
                :items="reasonOptions"
                label="Причина отмены"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
                required
              />
            </v-col>
            
            <v-col cols="12">
              <v-textarea
                v-model="formData.notes"
                label="Дополнительные заметки"
                variant="outlined"
                density="comfortable"
                rows="3"
                placeholder="Укажите дополнительную информацию о причине отмены"
              />
            </v-col>
            
            <!-- Опция переноса -->
            <v-col cols="12">
              <v-checkbox
                v-model="showRescheduleOption"
                label="Перенести на другую дату"
                density="comfortable"
              />
            </v-col>
            
            <v-col v-if="showRescheduleOption" cols="12">
              <v-text-field
                v-model="formData.reschedule_date"
                label="Новая дата и время"
                type="datetime-local"
                variant="outlined"
                density="comfortable"
                :min="minRescheduleDate"
              />
            </v-col>
          </v-row>
        </v-form>

        <!-- Информация о последствиях -->
        <v-card variant="outlined" class="consequences-info mt-4">
          <v-card-title class="consequences-title">
            <v-icon icon="mdi-information" class="mr-2" />
            Последствия отмены
          </v-card-title>
          <v-card-text>
            <ul class="consequences-list">
              <li>Монтажник будет уведомлен об отмене</li>
              <li v-if="installation.is_billable">
                Биллинговые записи будут обновлены
              </li>
              <li v-if="installation.equipment && installation.equipment.length > 0">
                Зарезервированное оборудование будет освобождено
              </li>
              <li v-if="showRescheduleOption && formData.reschedule_date">
                Будет создан новый монтаж на выбранную дату
              </li>
            </ul>
          </v-card-text>
        </v-card>
      </div>

      <template #actions>
        <div class="dialog-actions">
          <AppleButton
            variant="secondary"
            @click="handleClose"
          >
            Закрыть
          </AppleButton>
          
          <AppleButton
            color="error"
            :loading="saving"
            @click="handleSubmit"
          >
            {{ showRescheduleOption && formData.reschedule_date ? 'Перенести' : 'Отменить монтаж' }}
          </AppleButton>
        </div>
      </template>
    </AppleCard>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { format, addDays } from "date-fns";
import { ru } from "date-fns/locale";
import AppleButton from "@/components/Apple/AppleButton.vue";
import AppleCard from "@/components/Apple/AppleCard.vue";
import { useErrorHandler } from "@/utils/errorHandler";
import type { InstallationWithRelations, CancelInstallationForm } from "@/types/installations";

interface Props {
  modelValue: boolean;
  installation?: InstallationWithRelations | null;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "cancel", data: CancelInstallationForm): void;
}

const props = withDefaults(defineProps<Props>(), {
  installation: null,
});

const emit = defineEmits<Emits>();

// Состояние формы
const form = ref();
const saving = ref(false);
const showRescheduleOption = ref(false);

// Данные формы
const formData = ref<CancelInstallationForm>({
  reason: "",
  notes: "",
  reschedule_date: "",
});

// Правила валидации
const rules = {
  required: (value: any) => !!value || "Поле обязательно для заполнения",
};

// Опции причин отмены
const reasonOptions = [
  { title: "Клиент отменил заказ", value: "client_cancelled" },
  { title: "Монтажник недоступен", value: "installer_unavailable" },
  { title: "Технические проблемы", value: "technical_issues" },
  { title: "Погодные условия", value: "weather_conditions" },
  { title: "Отсутствие оборудования", value: "equipment_unavailable" },
  { title: "Перенос по просьбе клиента", value: "client_reschedule" },
  { title: "Другая причина", value: "other" },
];

// Минимальная дата для переноса (завтра)
const minRescheduleDate = computed(() => {
  const tomorrow = addDays(new Date(), 1);
  return tomorrow.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
});

// Обработчик ошибок
const { handleError } = useErrorHandler();

// Функции форматирования
const formatDateTime = (dateString: string): string => {
  return format(new Date(dateString), "dd.MM.yyyy HH:mm", { locale: ru });
};

// Инициализация формы
const initializeForm = () => {
  formData.value = {
    reason: "",
    notes: "",
    reschedule_date: "",
  };
  showRescheduleOption.value = false;
};

// Обработчики
const handleSubmit = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  // Если выбран перенос, но не указана дата
  if (showRescheduleOption.value && !formData.value.reschedule_date) {
    return;
  }

  saving.value = true;
  try {
    const cancelData: CancelInstallationForm = {
      reason: formData.value.reason,
      notes: formData.value.notes,
    };

    if (showRescheduleOption.value && formData.value.reschedule_date) {
      cancelData.reschedule_date = formData.value.reschedule_date;
    }

    emit("cancel", cancelData);
  } catch (error) {
    handleError(error, "Ошибка отмены монтажа");
  } finally {
    saving.value = false;
  }
};

const handleClose = () => {
  emit("update:modelValue", false);
};

// Отслеживание изменений
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    initializeForm();
  }
});

// Очистка даты переноса при отключении опции
watch(showRescheduleOption, (newValue) => {
  if (!newValue) {
    formData.value.reschedule_date = "";
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

/* Предупреждение */
.alert-content p {
  font-size: 0.875rem;
  line-height: 1.4;
}

/* Информация о последствиях */
.consequences-info {
  background: rgb(var(--v-theme-surface-variant));
}

.consequences-title {
  font-size: 1rem;
  font-weight: 600;
  padding: 12px 16px;
}

.consequences-list {
  margin: 0;
  padding-left: 20px;
}

.consequences-list li {
  font-size: 0.875rem;
  line-height: 1.4;
  margin-bottom: 8px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.consequences-list li:last-child {
  margin-bottom: 0;
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
  
  .consequences-list {
    padding-left: 16px;
  }
}
</style>
