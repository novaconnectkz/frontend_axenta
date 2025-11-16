<template>
  <div>
    <v-card class="mb-6">
      <v-card-title>
        <span>Нумераторы счетов</span>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          @click="openDialog()"
          prepend-icon="mdi-plus"
        >
          Создать нумератор
        </v-btn>
      </v-card-title>

      <v-card-text>
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
            v-for="num in numerators"
            :key="num.id"
            class="mb-2 pa-4 border rounded"
          >
            <template #prepend>
              <v-icon :color="num.is_active ? 'success' : 'grey'" size="32" class="mr-4">
                mdi-format-list-numbered
              </v-icon>
            </template>
            <v-list-item-title class="text-h6">
              {{ num.name }}
              <v-chip v-if="num.is_default" size="small" color="primary" class="ml-2">
                По умолчанию
              </v-chip>
            </v-list-item-title>
            <v-list-item-subtitle>
              <div class="mt-2">
                <strong>Шаблон:</strong>
                <code class="text-primary">{{ num.template }}</code>
              </div>
              <div v-if="num.description" class="mt-1">
                {{ num.description }}
              </div>
              <div class="mt-1">
                <v-chip size="x-small" color="info" class="mr-1">
                  Счетчик: {{ num.counter_value }}
                </v-chip>
                <v-chip v-if="num.prefix" size="x-small" color="secondary">
                  Префикс: {{ num.prefix }}
                </v-chip>
              </div>
            </v-list-item-subtitle>
            <template #append>
              <v-btn icon="mdi-pencil" variant="text" @click="openDialog(num)"></v-btn>
              <v-btn icon="mdi-delete" variant="text" color="error" @click="remove(num)"></v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center text-subtitle-1 py-2 px-4">
          <v-icon :icon="isEditing ? 'mdi-pencil' : 'mdi-plus'" size="small" class="mr-2"></v-icon>
          {{ isEditing ? 'Редактирование нумератора' : 'Создание нумератора' }}
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" size="small" variant="text" @click="close"></v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-form ref="formRef" v-model="formValid" validate-on="input">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  v-model="form.name"
                  label="Название нумератора"
                  :rules="[v => !!v || 'Название обязательно']"
                  prepend-icon="mdi-text"
                  variant="outlined"
                  density="compact"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.prefix"
                  label="Префикс"
                  :rules="[v => !!v || 'Префикс обязателен']"
                  prepend-icon="mdi-format-text"
                  hint="Можно использовать переменные"
                  variant="outlined"
                  density="compact"
                  required
                >
                  <template #append-inner>
                    <v-icon size="small" @click="showPrefixPlaceholders = !showPrefixPlaceholders">
                      {{ showPrefixPlaceholders ? 'mdi-chevron-up' : 'mdi-help-circle-outline' }}
                    </v-icon>
                  </template>
                </v-text-field>
                <v-expand-transition>
                  <v-card v-if="showPrefixPlaceholders" variant="outlined" class="mt-2">
                    <v-card-title class="text-subtitle-2 py-2 px-3">Доступные плейсхолдеры</v-card-title>
                    <v-card-text class="pa-3">
                      <div class="d-flex flex-column ga-2">
                        <v-chip
                          v-for="placeholder in INVOICE_NUMBER_PLACEHOLDERS"
                          :key="placeholder.value"
                          size="small"
                          @click="insertPlaceholder('prefix', placeholder.value)"
                          class="cursor-pointer align-self-start"
                        >
                          <v-icon size="small" class="mr-1">mdi-content-copy</v-icon>
                          {{ placeholder.value }} - {{ placeholder.label }}
                        </v-chip>
                      </div>
                      <div class="mt-2 text-caption text-grey">
                        Нажмите на плейсхолдер, чтобы вставить его в префикс
                      </div>
                    </v-card-text>
                  </v-card>
                </v-expand-transition>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="form.template"
                  label="Шаблон номера"
                  :rules="[v => !!v || 'Шаблон обязателен']"
                  prepend-icon="mdi-code-braces"
                  hint="Можно использовать переменные"
                  variant="outlined"
                  density="compact"
                  required
                >
                  <template #append-inner>
                    <v-icon size="small" @click="showTemplatePlaceholders = !showTemplatePlaceholders">
                      {{ showTemplatePlaceholders ? 'mdi-chevron-up' : 'mdi-help-circle-outline' }}
                    </v-icon>
                  </template>
                </v-text-field>
                <v-expand-transition>
                  <v-card v-if="showTemplatePlaceholders" variant="outlined" class="mt-2">
                    <v-card-title class="text-subtitle-2 py-2 px-3">Доступные плейсхолдеры</v-card-title>
                    <v-card-text class="pa-3">
                      <div class="d-flex flex-column ga-2">
                        <v-chip
                          v-for="placeholder in INVOICE_NUMBER_PLACEHOLDERS"
                          :key="placeholder.value"
                          size="small"
                          @click="insertPlaceholder('template', placeholder.value)"
                          class="cursor-pointer align-self-start"
                        >
                          <v-icon size="small" class="mr-1">mdi-content-copy</v-icon>
                          {{ placeholder.value }} - {{ placeholder.label }}
                        </v-chip>
                      </div>
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
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" class="py-1"><v-divider /></v-col>
              <v-col cols="12" md="6">
                <v-switch v-model="form.is_default" label="Нумератор по умолчанию" color="primary" />
              </v-col>
              <v-col cols="12" md="6">
                <v-switch v-model="form.is_active" label="Активен" color="success" />
              </v-col>
              <v-col cols="12" md="6">
                <v-switch v-model="form.auto_reset" label="Автоматически сбрасывать счетчик" color="primary" />
              </v-col>
              <v-col cols="12" md="6" v-if="form.auto_reset">
                <v-select
                  v-model="form.reset_period"
                  :items="resetOptions"
                  label="Период сброса"
                  prepend-icon="mdi-calendar-refresh"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="form.notes"
                  label="Примечания"
                  rows="2"
                  prepend-icon="mdi-note-text"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-3">
          <v-spacer />
          <v-btn variant="text" size="small" @click="close">Отмена</v-btn>
          <v-btn color="primary" size="small" :loading="saving" :disabled="!formValid" @click="save">
            {{ isEditing ? 'Сохранить' : 'Создать' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
 </template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { InvoiceNumerator, InvoiceNumeratorForm } from '@/types/invoices';
import { INVOICE_NUMBER_PLACEHOLDERS } from '@/types/invoices';
import invoiceNumeratorsService from '@/services/invoiceNumeratorsService';

const loading = ref(false);
const saving = ref(false);
const formValid = ref(false);
const numerators = ref<InvoiceNumerator[]>([]);
const dialog = ref(false);
const isEditing = ref(false);
const editing: any = ref<InvoiceNumerator | null>(null);
const formRef = ref();

const resetOptions = [
  { value: "never", title: "Никогда" },
  { value: "yearly", title: "Ежегодно" },
  { value: "monthly", title: "Ежемесячно" },
];
const showPrefixPlaceholders = ref(false);
const showTemplatePlaceholders = ref(false);

const form = ref<InvoiceNumeratorForm>({
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

const resolveCompanyId = (): number | null => {
  const companyStr = localStorage.getItem('axenta_company');
  if (companyStr) {
    try {
      const companyData = JSON.parse(companyStr);
      return companyData.id || companyData.ID || null;
    } catch {}
  }
  // Fallback: одиночный тенант/дефолтная компания
  return 1;
}

const load = async () => {
  const companyId = resolveCompanyId();
  loading.value = true;
  try {
    numerators.value = await invoiceNumeratorsService.getInvoiceNumerators(companyId);
  } catch (e) {
    console.error('Load invoice numerators error', e);
  } finally {
    loading.value = false;
  }
}

const openDialog = (num?: InvoiceNumerator) => {
  if (num) {
    editing.value = num;
    isEditing.value = true;
    form.value = {
      name: num.name,
      prefix: num.prefix,
      template: num.template,
      description: num.description || '',
      is_default: num.is_default,
      is_active: num.is_active,
      auto_reset: num.auto_reset,
      reset_period: num.reset_period || 'never',
      notes: num.notes || '',
    };
  } else {
    editing.value = null;
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
  dialog.value = true;
}

const close = () => {
  dialog.value = false;
  if (formRef.value) formRef.value.resetValidation();
}

const save = async () => {
  if (!formRef.value) return;
  // Явная валидация перед сохранением, чтобы не зависеть от blur
  const res = await formRef.value.validate?.();
  if (res && res.valid === false) return;
  if (!formValid.value) return;
  const companyId = resolveCompanyId();
  if (!companyId) {
    alert('Не удалось определить компанию');
    return;
  }
  saving.value = true;
  try {
    const payload: InvoiceNumeratorForm & { company_id: number } = {
      ...form.value,
      company_id: Number(companyId),
    };
    if (isEditing.value && editing.value) {
      await invoiceNumeratorsService.updateInvoiceNumerator(editing.value.id, payload);
    } else {
      await invoiceNumeratorsService.createInvoiceNumerator(payload);
    }
    await load();
    close();
  } catch (e: any) {
    console.error('Save invoice numerator error', e);
    alert(e?.response?.data?.error || e.message || 'Ошибка сохранения нумератора');
  } finally {
    saving.value = false;
  }
}

const remove = async (num: InvoiceNumerator) => {
  if (!confirm(`Удалить нумератор "${num.name}"?`)) return;
  try {
    await invoiceNumeratorsService.deleteInvoiceNumerator(num.id);
    await load();
  } catch (e: any) {
    console.error('Delete invoice numerator error', e);
    alert(e?.response?.data?.error || e.message || 'Ошибка удаления нумератора');
  }
}

onMounted(load);

const insertPlaceholder = (field: 'prefix' | 'template', placeholder: string) => {
  if (field === 'prefix') {
    if (!form.value.prefix?.includes(placeholder)) {
      form.value.prefix = (form.value.prefix || '') + placeholder;
    }
  } else {
    if (!form.value.template?.includes(placeholder)) {
      form.value.template = (form.value.template || '') + placeholder;
    }
  }
};
</script>

<style scoped>
.border {
  border: 1px solid rgba(0,0,0,0.08);
}
</style>


