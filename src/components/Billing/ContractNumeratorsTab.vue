<template>
  <div>
    <!-- Заголовок и кнопка добавления -->
    <v-card class="mb-6">
      <v-card-title>
        <span>Нумераторы договоров</span>
        <v-spacer></v-spacer>
        <v-btn 
          color="primary" 
          @click="openNumeratorDialog()"
          prepend-icon="mdi-plus"
        >
          Создать нумератор
        </v-btn>
      </v-card-title>

      <v-card-text>
        <!-- Список нумераторов -->
        <div v-if="loading" class="text-center py-12">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p class="mt-4 text-grey">Загрузка нумераторов...</p>
        </div>

        <div v-else-if="numerators.length === 0" class="text-center py-12">
          <v-icon size="64" color="grey-lighten-1">mdi-format-list-numbered</v-icon>
          <p class="mt-4 text-grey">Нет нумераторов. Создайте первый нумератор.</p>
        </div>

        <v-list v-else>
          <v-list-item
            v-for="numerator in numerators"
            :key="numerator.id"
            class="mb-2 pa-4 border rounded"
          >
            <template #prepend>
              <v-icon 
                :color="numerator.is_active ? 'success' : 'grey'"
                size="32"
                class="mr-4"
              >
                mdi-format-list-numbered
              </v-icon>
            </template>

            <v-list-item-title class="text-h6">
              {{ numerator.name }}
              <v-chip
                v-if="numerator.is_default"
                size="small"
                color="primary"
                class="ml-2"
              >
                По умолчанию
              </v-chip>
            </v-list-item-title>
            <v-list-item-subtitle>
              <div class="mt-2">
                <strong>Шаблон:</strong> <code class="text-primary">{{ numerator.template }}</code>
              </div>
              <div v-if="numerator.description" class="mt-1">
                {{ numerator.description }}
              </div>
              <div class="mt-1">
                <v-chip size="x-small" color="info" class="mr-1">
                  Счетчик: {{ numerator.counter_value }}
                </v-chip>
                <v-chip v-if="numerator.prefix" size="x-small" color="secondary">
                  Префикс: {{ numerator.prefix }}
                </v-chip>
              </div>
            </v-list-item-subtitle>

            <template #append>
              <v-btn
                icon="mdi-pencil"
                variant="text"
                @click="openNumeratorDialog(numerator)"
              ></v-btn>
              <v-btn
                icon="mdi-delete"
                variant="text"
                color="error"
                @click="deleteNumerator(numerator)"
              ></v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <!-- Диалог создания/редактирования нумератора -->
    <v-dialog v-model="numeratorDialog" max-width="900px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon :icon="isEditing ? 'mdi-pencil' : 'mdi-plus'" class="mr-2"></v-icon>
          {{ isEditing ? 'Редактирование нумератора' : 'Создание нумератора' }}
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="closeDialog"></v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pt-6">
          <v-form ref="formRef" v-model="formValid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="form.name"
                  label="Название нумератора"
                  :rules="[v => !!v || 'Название обязательно']"
                  prepend-icon="mdi-text"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.prefix"
                  label="Префикс"
                  :rules="[v => !!v || 'Префикс обязателен']"
                  prepend-icon="mdi-format-text"
                  hint="Например: AX"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="form.template"
                  label="Шаблон номера"
                  :rules="[v => !!v || 'Шаблон обязателен']"
                  prepend-icon="mdi-code-braces"
                  hint="Например: {PREFIX}-{DAY}{MONTH}{YEAR}/{CLIENT_ID}"
                  required
                >
                  <template #append-inner>
                    <v-icon @click="showPlaceholders = !showPlaceholders">
                      {{ showPlaceholders ? 'mdi-chevron-up' : 'mdi-help-circle-outline' }}
                    </v-icon>
                  </template>
                </v-text-field>

                <!-- Список доступных плейсхолдеров -->
                <v-expand-transition>
                  <v-card v-if="showPlaceholders" variant="outlined" class="mt-2">
                    <v-card-title class="text-subtitle-1">Доступные плейсхолдеры</v-card-title>
                    <v-card-text>
                      <v-chip-group>
                        <v-chip
                          v-for="placeholder in CONTRACT_NUMBER_PLACEHOLDERS"
                          :key="placeholder.value"
                          size="small"
                          @click="insertPlaceholder(placeholder.value)"
                          class="cursor-pointer"
                        >
                          <v-icon size="small" class="mr-1">mdi-content-copy</v-icon>
                          {{ placeholder.value }} - {{ placeholder.label }}
                        </v-chip>
                      </v-chip-group>
                      <div class="mt-2 text-caption text-grey">
                        Нажмите на плейсхолдер, чтобы вставить его в шаблон
                      </div>
                    </v-card-text>
                  </v-card>
                </v-expand-transition>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="form.description"
                  label="Описание"
                  rows="2"
                  prepend-icon="mdi-text"
                ></v-textarea>
              </v-col>

              <v-col cols="12">
                <v-divider class="my-2"></v-divider>
              </v-col>

              <v-col cols="12" md="6">
                <v-switch
                  v-model="form.is_default"
                  label="Нумератор по умолчанию"
                  color="primary"
                  hint="Будет использоваться при создании новых договоров"
                ></v-switch>
              </v-col>

              <v-col cols="12" md="6">
                <v-switch
                  v-model="form.is_active"
                  label="Активен"
                  color="success"
                ></v-switch>
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="form.auto_reset"
                  label="Автоматически сбрасывать счетчик"
                  color="primary"
                ></v-switch>
              </v-col>

              <v-col v-if="form.auto_reset" cols="12" md="6">
                <v-select
                  v-model="form.reset_period"
                  :items="RESET_PERIOD_OPTIONS"
                  label="Период сброса"
                  prepend-icon="mdi-calendar-refresh"
                ></v-select>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="form.notes"
                  label="Примечания"
                  rows="2"
                  prepend-icon="mdi-note-text"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDialog">
            Отмена
          </v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="!formValid"
            @click="saveNumerator"
          >
            {{ isEditing ? 'Сохранить' : 'Создать' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { ContractNumerator, ContractNumeratorForm } from '@/types/contracts';
import { CONTRACT_NUMBER_PLACEHOLDERS, RESET_PERIOD_OPTIONS } from '@/types/contracts';
import contractsService from '@/services/contractsService';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();

// Data
const loading = ref(false);
const saving = ref(false);
const formValid = ref(false);
const numerators = ref<ContractNumerator[]>([]);
const numeratorDialog = ref(false);
const isEditing = ref(false);
const editingNumerator = ref<ContractNumerator | null>(null);
const showPlaceholders = ref(false);
const formRef = ref();

const form = ref<ContractNumeratorForm>({
  name: '',
  prefix: '',
  template: '',
  description: '',
  is_default: false,
  is_active: true,
  auto_reset: false,
  reset_period: 'never',
  notes: '',
});

// Methods
const loadNumerators = async () => {
  if (!userStore.company?.id) return;
  
  loading.value = true;
  try {
    numerators.value = await contractsService.getContractNumerators(userStore.company.id);
  } catch (error) {
    console.error('Error loading numerators:', error);
  } finally {
    loading.value = false;
  }
};

const openNumeratorDialog = (numerator?: ContractNumerator) => {
  if (numerator) {
    editingNumerator.value = numerator;
    isEditing.value = true;
    form.value = {
      name: numerator.name,
      prefix: numerator.prefix,
      template: numerator.template,
      description: numerator.description || '',
      is_default: numerator.is_default,
      is_active: numerator.is_active,
      auto_reset: numerator.auto_reset,
      reset_period: numerator.reset_period || 'never',
      notes: numerator.notes || '',
    };
  } else {
    editingNumerator.value = null;
    isEditing.value = false;
    form.value = {
      name: '',
      prefix: '',
      template: '',
      description: '',
      is_default: false,
      is_active: true,
      auto_reset: false,
      reset_period: 'never',
      notes: '',
    };
  }
  numeratorDialog.value = true;
};

const closeDialog = () => {
  numeratorDialog.value = false;
  if (formRef.value) {
    formRef.value.resetValidation();
  }
};

const saveNumerator = async () => {
  if (!formRef.value || !formValid.value) return;

  saving.value = true;
  try {
    if (isEditing.value && editingNumerator.value) {
      await contractsService.updateContractNumerator(editingNumerator.value.id, form.value);
    } else {
      await contractsService.createContractNumerator(form.value);
    }
    await loadNumerators();
    closeDialog();
  } catch (error: any) {
    console.error('Error saving numerator:', error);
    alert(error.message || 'Ошибка сохранения нумератора');
  } finally {
    saving.value = false;
  }
};

const deleteNumerator = async (numerator: ContractNumerator) => {
  if (!confirm(`Удалить нумератор "${numerator.name}"?`)) return;

  try {
    await contractsService.deleteContractNumerator(numerator.id);
    await loadNumerators();
  } catch (error: any) {
    console.error('Error deleting numerator:', error);
    alert(error.message || 'Ошибка удаления нумератора');
  }
};

const insertPlaceholder = (placeholder: string) => {
  if (!form.value.template.includes(placeholder)) {
    form.value.template += placeholder;
  }
};

// Lifecycle
onMounted(() => {
  loadNumerators();
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>

