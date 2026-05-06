<template>
  <v-dialog v-model="show" max-width="800" @click:outside="$emit('close')">
    <AppleCard>
      <template #header>
        <div class="dialog-header">
          <v-icon :icon="isEdit ? 'mdi-pencil' : 'mdi-plus'" class="mr-2" />
          {{ isEdit ? 'Редактирование объекта' : 'Создание объекта' }}
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')" />
        </div>
      </template>

      <v-form ref="objectFormRef" @submit.prevent="$emit('save')">
        <div class="form-content">
          <!-- Шаблон объекта -->
          <v-row v-if="!isEdit">
            <v-col cols="12">
              <v-select v-model="selectedTemplate" :items="templateOptions" label="Шаблон объекта (опционально)"
                variant="outlined" density="comfortable" clearable prepend-icon="mdi-file-document-outline"
                @update:model-value="(v: any) => $emit('applyTemplate', v)">
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-icon :icon="item.raw.icon || 'mdi-file-document-outline'" />
                    </template>
                    <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.raw.description }}</v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>
          </v-row>

          <!-- Основная информация -->
          <v-row>
            <v-col cols="12">
              <h3 class="form-section-title">Основная информация</h3>
            </v-col>

            <v-col cols="12" md="6">
              <AppleInput v-model="form.name" label="Название объекта *" placeholder="Введите название" required
                :error-message="errors.name" />
            </v-col>

            <v-col cols="12" md="6">
              <v-select v-model="form.type" :items="typeOptions" label="Тип объекта *" variant="outlined"
                density="comfortable" required :error-messages="errors.type" />
            </v-col>

            <v-col cols="12" md="6">
              <v-select v-model="form.company_id" :items="companyOptions"
                label="Название учетной записи (компании) *" variant="outlined" density="comfortable" required
                :loading="loadingCompanies" :error-messages="errors.company_id" prepend-icon="mdi-domain"
                item-title="name" item-value="id" placeholder="Выберите компанию" />
            </v-col>

            <v-col cols="12" md="6">
              <AppleInput v-model="form.creatorName" label="Создатель (ФИО)" placeholder="Введите ФИО создателя" />
            </v-col>

            <v-col cols="12" md="6">
              <AppleInput v-model="form.deviceTypeName" label="Модель устройства"
                placeholder="Введите модель устройства" />
            </v-col>

            <v-col cols="12" md="6">
              <AppleInput v-model="form.uniqueId" label="Уникальный ID"
                placeholder="Введите уникальный идентификатор" />
            </v-col>

            <v-col cols="12" md="6">
              <v-switch v-model="form.is_active" label="Активный объект" color="success" hide-details />
            </v-col>

            <v-col cols="12">
              <AppleInput v-model="form.description" label="Описание" placeholder="Введите описание объекта" />
            </v-col>

            <v-col cols="12" md="6">
              <AppleInput v-model="form.imei" label="IMEI" placeholder="Введите IMEI устройства"
                :error-message="errors.imei" />
            </v-col>

            <v-col cols="12" md="6">
              <AppleInput v-model="form.phone_number" label="Основной номер телефона"
                placeholder="+7 (XXX) XXX-XX-XX" />
            </v-col>

            <!-- Дополнительные номера телефонов -->
            <v-col cols="12">
              <div class="phone-numbers-section">
                <div class="d-flex align-center mb-2">
                  <label class="text-subtitle-2">Дополнительные номера телефонов</label>
                  <v-spacer />
                  <v-btn icon="mdi-plus" size="small" variant="outlined" @click="$emit('addPhoneNumber')" />
                </div>
                <div v-for="(phone, index) in form.phoneNumbers" :key="index" class="d-flex align-center mb-2">
                  <AppleInput v-model="form.phoneNumbers[index]" placeholder="+7 (XXX) XXX-XX-XX"
                    density="compact" />
                  <v-btn icon="mdi-delete" size="small" variant="text" color="error" class="ml-2"
                    @click="$emit('removePhoneNumber', index)" />
                </div>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <AppleInput v-model="form.serial_number" label="Серийный номер" placeholder="Введите серийный номер" />
            </v-col>

            <v-col cols="12" md="6">
              <v-select v-model="form.contract_id" :items="contractOptions" label="Договор" variant="outlined"
                density="comfortable" :error-messages="errors.contract_id" :loading="false" />
            </v-col>

            <v-col cols="12" md="6">
              <v-select v-model="form.location_id" :items="locationOptions" label="Локация" variant="outlined"
                density="comfortable" :loading="false" />
            </v-col>

            <v-col cols="12" md="6">
              <v-select v-model="form.template_id" :items="templateOptions" label="Шаблон объекта" clearable
                variant="outlined" density="comfortable" :loading="false" />
            </v-col>

            <v-col cols="12">
              <AppleInput v-model="form.address" label="Адрес" placeholder="Введите адрес объекта" />
            </v-col>

            <v-col cols="12" md="6">
              <AppleInput v-model="form.latitude" label="Широта" type="number" placeholder="55.7558" />
            </v-col>

            <v-col cols="12" md="6">
              <AppleInput v-model="form.longitude" label="Долгота" type="number" placeholder="37.6176" />
            </v-col>

            <v-col cols="12">
              <v-textarea v-model="form.notes" label="Заметки" placeholder="Дополнительная информация"
                variant="outlined" rows="3" />
            </v-col>
          </v-row>
        </div>
      </v-form>

      <template #footer>
        <div class="dialog-actions">
          <AppleButton variant="secondary" @click="$emit('close')">
            Отмена
          </AppleButton>
          <AppleButton @click="$emit('save')" :loading="saving">
            {{ isEdit ? 'Сохранить' : 'Создать' }}
          </AppleButton>
        </div>
      </template>
    </AppleCard>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import AppleInput from '@/components/Apple/AppleInput.vue';

defineProps<{
  isEdit: boolean;
  form: any;
  errors: Record<string, string | undefined>;
  saving: boolean;
  typeOptions: { title: string; value: string }[];
  companyOptions: any[];
  contractOptions: any[];
  locationOptions: any[];
  templateOptions: any[];
  loadingCompanies: boolean;
}>();

const show = defineModel<boolean>('show', { required: true });
const selectedTemplate = defineModel<number | null>('selectedTemplate', { default: null });

defineEmits<{
  close: [];
  save: [];
  applyTemplate: [templateId: number | null];
  addPhoneNumber: [];
  removePhoneNumber: [index: number];
}>();

const objectFormRef = ref();
void objectFormRef;
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.form-content {
  padding: 20px 0;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.phone-numbers-section {
  border: 1px solid rgba(60, 60, 67, 0.08);
  border-radius: 8px;
  padding: 16px;
  background: rgba(60, 60, 67, 0.02);
}

[data-theme="dark"] .phone-numbers-section {
  border-color: rgba(84, 84, 136, 0.16);
  background: rgba(84, 84, 136, 0.04);
}

.form-section-title {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 12px 0;
}
</style>
