<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="600px">
    <v-card class="location-dialog">
      <v-card-title class="dialog-title">
        <v-icon :icon="location ? 'mdi-pencil' : 'mdi-plus'" class="title-icon" />
        {{ location ? 'Редактировать локацию' : 'Добавить локацию' }}
      </v-card-title>

      <v-card-text class="dialog-content">
        <v-form ref="formRef" v-model="formValid" @submit.prevent="handleSubmit">
          <!-- Основная информация -->
          <div class="form-section">
            <h3 class="section-title">Основная информация</h3>
            
            <div class="form-row">
              <v-text-field
                v-model="form.city"
                label="Город"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-city"
                required
              />
            </div>

            <div class="form-row">
              <v-text-field
                v-model="form.region"
                label="Регион/Область"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-map"
                required
              />
              
              <v-select
                v-model="form.country"
                :items="countryOptions"
                label="Страна"
                :rules="[rules.required]"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-flag"
                required
              />
            </div>
          </div>

          <!-- Географические координаты -->
          <div class="form-section">
            <h3 class="section-title">Географические координаты</h3>
            <p class="section-description">
              Укажите точные координаты для более точного планирования маршрутов монтажников
            </p>
            
            <div class="form-row">
              <v-text-field
                v-model="form.latitude"
                label="Широта"
                :rules="[rules.latitude]"
                variant="outlined"
                density="compact"
                type="number"
                step="0.000001"
                prepend-inner-icon="mdi-latitude"
                placeholder="55.751244"
              />
              
              <v-text-field
                v-model="form.longitude"
                label="Долгота"
                :rules="[rules.longitude]"
                variant="outlined"
                density="compact"
                type="number"
                step="0.000001"
                prepend-inner-icon="mdi-longitude"
                placeholder="37.618423"
              />
            </div>

            <div class="coordinates-help">
              <v-icon icon="mdi-information" size="small" />
              <span>Для получения координат можно использовать Google Maps или Яндекс.Карты</span>
            </div>
          </div>

          <!-- Часовой пояс -->
          <div class="form-section">
            <h3 class="section-title">Часовой пояс</h3>
            
            <v-select
              v-model="form.timezone"
              :items="timezoneOptions"
              label="Часовой пояс"
              :rules="[rules.required]"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-clock"
              required
            />
          </div>

          <!-- Дополнительные параметры -->
          <div class="form-section">
            <h3 class="section-title">Дополнительные параметры</h3>
            
            <v-checkbox
              v-model="form.is_active"
              label="Активная локация"
              color="primary"
              density="compact"
            >
              <template #label>
                <div class="checkbox-label">
                  <span>Активная локация</span>
                  <small>Доступна для планирования монтажей</small>
                </div>
              </template>
            </v-checkbox>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="dialog-actions">
        <v-spacer />
        <AppleButton variant="secondary" @click="handleCancel">
          Отмена
        </AppleButton>
        <AppleButton @click="handleSubmit" :loading="saving" :disabled="!formValid">
          {{ location ? 'Сохранить' : 'Добавить' }}
        </AppleButton>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AppleButton from '@/components/Apple/AppleButton.vue';
import type { LocationBase, LocationForm } from '@/types/installations';

// Props
interface Props {
  modelValue: boolean;
  location?: LocationBase | null;
}

const props = withDefaults(defineProps<Props>(), {
  location: null
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'save': [data: LocationForm];
}>();

// Состояние
const formRef = ref();
const formValid = ref(false);
const saving = ref(false);

// Форма
const form = ref<LocationForm & { is_active: boolean }>({
  city: '',
  region: '',
  country: 'Россия',
  latitude: undefined,
  longitude: undefined,
  timezone: 'Europe/Moscow',
  is_active: true
});

// Опции для выбора
const countryOptions = [
  'Россия',
  'Беларусь',
  'Казахстан',
  'Украина',
  'Узбекистан',
  'Кыргызстан',
  'Таджикистан',
  'Туркменистан',
  'Азербайджан',
  'Армения',
  'Грузия',
  'Молдова',
  'Другая'
];

const timezoneOptions = [
  { title: 'Калининградское время (UTC+2)', value: 'Europe/Kaliningrad' },
  { title: 'Московское время (UTC+3)', value: 'Europe/Moscow' },
  { title: 'Самарское время (UTC+4)', value: 'Europe/Samara' },
  { title: 'Екатеринбургское время (UTC+5)', value: 'Asia/Yekaterinburg' },
  { title: 'Омское время (UTC+6)', value: 'Asia/Omsk' },
  { title: 'Красноярское время (UTC+7)', value: 'Asia/Krasnoyarsk' },
  { title: 'Иркутское время (UTC+8)', value: 'Asia/Irkutsk' },
  { title: 'Якутское время (UTC+9)', value: 'Asia/Yakutsk' },
  { title: 'Владивостокское время (UTC+10)', value: 'Asia/Vladivostok' },
  { title: 'Магаданское время (UTC+11)', value: 'Asia/Magadan' },
  { title: 'Камчатское время (UTC+12)', value: 'Asia/Kamchatka' }
];

// Правила валидации
const rules = {
  required: (value: string) => !!value || 'Поле обязательно для заполнения',
  latitude: (value: number | undefined) => {
    if (value === undefined || value === null || value === '') return true;
    const num = Number(value);
    return (!isNaN(num) && num >= -90 && num <= 90) || 'Широта должна быть от -90 до 90';
  },
  longitude: (value: number | undefined) => {
    if (value === undefined || value === null || value === '') return true;
    const num = Number(value);
    return (!isNaN(num) && num >= -180 && num <= 180) || 'Долгота должна быть от -180 до 180';
  }
};

// Инициализация формы при изменении пропса location
watch(() => props.location, (newLocation) => {
  if (newLocation) {
    form.value = {
      city: newLocation.city,
      region: newLocation.region,
      country: newLocation.country,
      latitude: newLocation.latitude,
      longitude: newLocation.longitude,
      timezone: newLocation.timezone,
      is_active: newLocation.is_active
    };
  } else {
    // Сброс формы для создания новой локации
    form.value = {
      city: '',
      region: '',
      country: 'Россия',
      latitude: undefined,
      longitude: undefined,
      timezone: 'Europe/Moscow',
      is_active: true
    };
  }
}, { immediate: true });

// Обработчики
const handleSubmit = async () => {
  if (!formValid.value) return;

  saving.value = true;
  try {
    const formData: LocationForm = {
      city: form.value.city,
      region: form.value.region,
      country: form.value.country,
      latitude: form.value.latitude || undefined,
      longitude: form.value.longitude || undefined,
      timezone: form.value.timezone
    };

    emit('save', formData);
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  emit('update:modelValue', false);
};
</script>

<style scoped>
.location-dialog {
  border-radius: 16px;
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 24px 0;
  font-size: 20px;
  font-weight: 600;
}

.title-icon {
  color: rgb(var(--v-theme-primary));
}

.dialog-content {
  padding: 24px;
}

.form-section {
  margin-bottom: 32px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: rgb(var(--v-theme-on-surface));
}

.section-description {
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-row:has(> :only-child) {
  grid-template-columns: 1fr;
}

.coordinates-help {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 12px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 8px;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.checkbox-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.checkbox-label small {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 12px;
}

.dialog-actions {
  padding: 0 24px 24px;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
