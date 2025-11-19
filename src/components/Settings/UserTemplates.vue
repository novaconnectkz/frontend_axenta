<template>
  <div class="user-templates">
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h2 class="text-h5 font-weight-bold mb-2">Шаблоны для создания УЗ</h2>
        <p class="text-body-2 text-medium-emphasis">
          Управление шаблонами для создания учетных записей
        </p>
      </div>
      <div class="d-flex gap-3 align-center">
        <v-select
          v-model="selectedSystem"
          :items="systemOptions"
          label="Система"
          variant="outlined"
          density="compact"
          style="min-width: 150px"
          @update:model-value="loadTemplates"
        />
        <v-btn
          variant="outlined"
          prepend-icon="mdi-upload"
          @click="fileInput?.click()"
        >
          Импортировать из файла
        </v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="createTemplate"
        >
          Создать шаблон
        </v-btn>
      </div>
      
      <!-- Скрытый input для загрузки файла -->
      <input
        ref="fileInput"
        type="file"
        accept=".json,.txt,application/json,text/plain"
        style="display: none"
        @change="handleFileUpload"
      />
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-4 text-body-2">Загрузка шаблонов...</p>
    </div>

    <!-- Список шаблонов -->
    <div v-else>
      <v-row v-if="templates.length > 0">
        <v-col
          v-for="template in templates"
          :key="template.id"
          cols="12"
          md="6"
          lg="4"
        >
          <v-card class="template-card" elevation="2">
            <v-card-title class="d-flex align-center justify-space-between">
              <div class="d-flex align-center gap-3">
                <v-avatar color="success" size="40">
                  <v-icon icon="mdi-account-plus" color="white" />
                </v-avatar>
                <div>
                  <div class="text-subtitle-1 font-weight-bold">{{ template.name }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ template.category || 'Без категории' }}
                  </div>
                </div>
              </div>
            </v-card-title>

            <v-card-text>
              <p class="text-body-2 mb-3">{{ template.description }}</p>
              <div class="d-flex align-center gap-3 mb-2">
                <div class="text-caption text-medium-emphasis">
                  <v-icon size="14" class="me-1">mdi-shield-account</v-icon>
                  Роль: {{ (template as any).role_id || 'Не указана' }}
                </div>
                <v-chip
                  v-if="template.system"
                  size="x-small"
                  variant="outlined"
                  color="success"
                >
                  {{ getSystemLabel(template.system) }}
                </v-chip>
              </div>
            </v-card-text>

            <v-card-actions>
              <v-spacer />
              <v-btn
                variant="text"
                size="small"
                @click="editTemplate(template)"
              >
                <v-icon start>mdi-pencil</v-icon>
                Изменить
              </v-btn>
              <v-btn
                variant="text"
                size="small"
                color="error"
                @click="deleteTemplate(template)"
              >
                <v-icon start>mdi-delete</v-icon>
                Удалить
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <v-card v-else class="text-center py-8" elevation="0">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-account-outline</v-icon>
        <p class="text-h6 text-medium-emphasis mb-2">Нет шаблонов</p>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Создайте первый шаблон для учетных записей
        </p>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="createTemplate">
          Создать шаблон
        </v-btn>
      </v-card>
    </div>
    
    <!-- Диалог импорта шаблона -->
    <v-dialog v-model="importDialog.show" max-width="600">
      <v-card>
        <v-card-title class="d-flex align-center gap-3">
          <v-icon color="primary">mdi-file-import</v-icon>
          Импорт шаблона
        </v-card-title>
        
        <v-divider />
        
        <v-card-text class="py-4">
          <div v-if="importDialog.errors.length > 0" class="mb-4">
            <v-alert type="error" variant="tonal" class="mb-2">
              <div class="font-weight-bold mb-2">Ошибки импорта:</div>
              <ul class="mb-0 pl-4">
                <li v-for="(error, index) in importDialog.errors" :key="index">
                  {{ error }}
                </li>
              </ul>
            </v-alert>
          </div>
          
          <div v-if="importDialog.warnings.length > 0" class="mb-4">
            <v-alert type="warning" variant="tonal">
              <div class="font-weight-bold mb-2">Предупреждения:</div>
              <ul class="mb-0 pl-4">
                <li v-for="(warning, index) in importDialog.warnings" :key="index">
                  {{ warning }}
                </li>
              </ul>
            </v-alert>
          </div>
          
          <div v-if="importDialog.template && importDialog.errors.length === 0">
            <v-alert type="success" variant="tonal" class="mb-4">
              Шаблон успешно загружен из файла
            </v-alert>
            
            <div class="template-preview">
              <div class="text-subtitle-2 font-weight-bold mb-2">Предпросмотр:</div>
              <v-card variant="outlined" class="pa-3">
                <div class="text-body-2">
                  <div><strong>Название:</strong> {{ importDialog.template.name }}</div>
                  <div v-if="importDialog.template.description">
                    <strong>Описание:</strong> {{ importDialog.template.description }}
                  </div>
                  <div><strong>Система:</strong> {{ getSystemLabel(importDialog.template.system) }}</div>
                  <div v-if="importDialog.template.category">
                    <strong>Категория:</strong> {{ importDialog.template.category }}
                  </div>
                </div>
              </v-card>
            </div>
          </div>
        </v-card-text>
        
        <v-divider />
        
        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeImportDialog">Отмена</v-btn>
          <v-btn
            v-if="importDialog.template && importDialog.errors.length === 0"
            color="primary"
            @click="confirmImport"
            :loading="importDialog.importing"
          >
            Импортировать
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { settingsService } from '@/services/settingsService';
import type { UserTemplate, TemplateSystem } from '@/types/settings';
import { useTemplateSystems } from '@/composables/useTemplateSystems';
import { importTemplateFromFile, isFileFormatSupported } from '@/utils/templateParser';
import type { ImportedTemplate } from '@/utils/templateParser';
import { onMounted, ref, watch } from 'vue';

const loading = ref(false);
const templates = ref<UserTemplate[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

// Используем композабл для получения доступных систем из интеграций
const {
  systemOptions,
  getSystemLabel,
  getDefaultSystem,
  loadAvailableSystems,
} = useTemplateSystems();

const selectedSystem = ref<TemplateSystem | ''>('');

// Диалог импорта
const importDialog = ref<{
  show: boolean;
  template: UserTemplate | null;
  errors: string[];
  warnings: string[];
  importing: boolean;
}>({
  show: false,
  template: null,
  errors: [],
  warnings: [],
  importing: false,
});

// Устанавливаем систему по умолчанию после загрузки доступных систем
watch(systemOptions, (options) => {
  if (options.length > 1 && !selectedSystem.value) {
    selectedSystem.value = getDefaultSystem();
  }
}, { immediate: true });

const loadTemplates = async () => {
  loading.value = true;
  try {
    const response = await settingsService.getTemplates('user', selectedSystem.value || undefined);
    templates.value = response.templates as UserTemplate[];
  } catch (error) {
    console.error('Ошибка загрузки шаблонов:', error);
  } finally {
    loading.value = false;
  }
};

const createTemplate = () => {
  // TODO: Реализовать создание шаблона
  console.log('Создание шаблона УЗ');
};

const editTemplate = (template: UserTemplate) => {
  // TODO: Реализовать редактирование шаблона
  console.log('Редактирование шаблона:', template);
};

const deleteTemplate = (template: UserTemplate) => {
  // TODO: Реализовать удаление шаблона
  console.log('Удаление шаблона:', template);
};

// Обработка загрузки файла
const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (!file) return;
  
  if (!selectedSystem.value) {
    importDialog.value = {
      show: true,
      template: null,
      errors: ['Пожалуйста, выберите систему перед импортом шаблона'],
      warnings: [],
      importing: false,
    };
    return;
  }
  
  if (!isFileFormatSupported(file, selectedSystem.value as TemplateSystem)) {
    importDialog.value = {
      show: true,
      template: null,
      errors: [`Неподдерживаемый формат файла. Для системы ${getSystemLabel(selectedSystem.value as TemplateSystem)} ожидается JSON файл (.json или .txt).`],
      warnings: [],
      importing: false,
    };
    return;
  }
  
  try {
    const result: ImportedTemplate = await importTemplateFromFile(
      file,
      'user',
      selectedSystem.value as TemplateSystem
    );
    
    importDialog.value = {
      show: true,
      template: result.template as UserTemplate,
      errors: result.errors,
      warnings: result.warnings,
      importing: false,
    };
  } catch (error) {
    importDialog.value = {
      show: true,
      template: null,
      errors: [error instanceof Error ? error.message : 'Ошибка импорта шаблона'],
      warnings: [],
      importing: false,
    };
  }
  
  if (input) {
    input.value = '';
  }
};

const confirmImport = async () => {
  if (!importDialog.value.template) return;
  
  importDialog.value.importing = true;
  try {
    // Сохраняем шаблон на сервере
    const response = await settingsService.createTemplate(importDialog.value.template);
    
    if (response.status === 'success') {
      closeImportDialog();
      await loadTemplates();
    } else {
      importDialog.value.errors.push(response.error || 'Ошибка сохранения шаблона');
    }
  } catch (error) {
    console.error('Ошибка импорта шаблона:', error);
    importDialog.value.errors.push(error instanceof Error ? error.message : 'Ошибка сохранения шаблона');
  } finally {
    importDialog.value.importing = false;
  }
};

const closeImportDialog = () => {
  importDialog.value = {
    show: false,
    template: null,
    errors: [],
    warnings: [],
    importing: false,
  };
};

onMounted(async () => {
  await loadAvailableSystems();
  await loadTemplates();
});
</script>

<style scoped>
.template-card {
  transition: all 0.3s ease;
  border-radius: 12px;
  height: 100%;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}
</style>

