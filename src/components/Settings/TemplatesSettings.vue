<template>
  <div class="templates-settings">
    <!-- Заголовок и фильтры -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h3 class="text-h6 font-weight-bold mb-1">Шаблоны системы</h3>
        <p class="text-body-2 text-medium-emphasis">
          Управление шаблонами для объектов, пользователей и уведомлений
        </p>
      </div>
      
      <!-- Фильтры -->
      <div class="d-flex gap-3 align-center">
        <v-select
          v-model="selectedType"
          :items="templateTypes"
          label="Тип шаблона"
          variant="outlined"
          density="compact"
          style="min-width: 200px"
          @update:model-value="loadTemplates"
        />
        
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="createTemplate"
        >
          Создать шаблон
        </v-btn>
      </div>
    </div>

    <!-- Статистика -->
    <div class="mb-6">
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-card class="stats-card text-center pa-4" elevation="2">
            <v-icon size="32" color="primary" class="mb-2">mdi-file-document-multiple</v-icon>
            <div class="text-h6 font-weight-bold">{{ stats.total }}</div>
            <div class="text-caption text-medium-emphasis">Всего шаблонов</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="stats-card text-center pa-4" elevation="2">
            <v-icon size="32" color="success" class="mb-2">mdi-shield-check</v-icon>
            <div class="text-h6 font-weight-bold">{{ stats.system }}</div>
            <div class="text-caption text-medium-emphasis">Системных</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="stats-card text-center pa-4" elevation="2">
            <v-icon size="32" color="info" class="mb-2">mdi-account-edit</v-icon>
            <div class="text-h6 font-weight-bold">{{ stats.custom }}</div>
            <div class="text-caption text-medium-emphasis">Пользовательских</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="stats-card text-center pa-4" elevation="2">
            <v-icon size="32" color="warning" class="mb-2">mdi-chart-line</v-icon>
            <div class="text-h6 font-weight-bold">{{ stats.totalUsage }}</div>
            <div class="text-caption text-medium-emphasis">Использований</div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-4 text-body-2">Загрузка шаблонов...</p>
    </div>

    <!-- Список шаблонов -->
    <div v-else>
      <v-row>
        <v-col
          v-for="template in templates"
          :key="template.id"
          cols="12"
          md="6"
          lg="4"
        >
          <v-card
            class="template-card"
            :class="{ 'template-card--system': template.is_system }"
            elevation="2"
          >
            <!-- Заголовок карточки -->
            <v-card-title class="d-flex align-center justify-space-between">
              <div class="d-flex align-center gap-3">
                <v-avatar
                  :color="getTemplateColor(template.type)"
                  size="40"
                >
                  <v-icon :icon="getTemplateIcon(template.type)" color="white" />
                </v-avatar>
                
                <div>
                  <div class="text-subtitle-1 font-weight-bold">
                    {{ template.name }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ getTemplateTypeLabel(template.type) }}
                    {{ template.category ? ` • ${template.category}` : '' }}
                  </div>
                </div>
              </div>

              <!-- Бейджи -->
              <div class="d-flex gap-1">
                <v-chip
                  v-if="template.is_system"
                  size="x-small"
                  color="success"
                  variant="elevated"
                >
                  Системный
                </v-chip>
                <v-chip
                  v-if="!template.is_active"
                  size="x-small"
                  color="grey"
                  variant="outlined"
                >
                  Неактивен
                </v-chip>
              </div>
            </v-card-title>

            <!-- Описание -->
            <v-card-text class="pt-0">
              <p class="text-body-2 mb-3">{{ template.description }}</p>

              <!-- Дополнительная информация -->
              <div class="template-info">
                <div class="d-flex align-center justify-space-between text-caption mb-2">
                  <span class="text-medium-emphasis">
                    <v-icon size="14" class="me-1">mdi-chart-bar</v-icon>
                    Использований: {{ template.usage_count }}
                  </span>
                  <span class="text-medium-emphasis">
                    <v-icon size="14" class="me-1">mdi-calendar</v-icon>
                    {{ formatDate(template.updated_at) }}
                  </span>
                </div>

                <!-- Специфичная информация для каждого типа -->
                <div v-if="template.type === 'object'" class="template-details">
                  <div class="text-caption text-medium-emphasis">
                    <v-icon size="14" class="me-1">mdi-form-select</v-icon>
                    Полей: {{ (template as any).fields?.length || 0 }}
                  </div>
                </div>

                <div v-if="template.type === 'user'" class="template-details">
                  <div class="text-caption text-medium-emphasis">
                    <v-icon size="14" class="me-1">mdi-shield-account</v-icon>
                    Роль: {{ (template as any).role_id }}
                  </div>
                </div>

                <div v-if="template.type === 'notification'" class="template-details">
                  <div class="text-caption text-medium-emphasis">
                    <v-icon size="14" class="me-1">mdi-bell</v-icon>
                    Каналов: {{ (template as any).channels?.length || 0 }}
                  </div>
                </div>
              </div>
            </v-card-text>

            <!-- Действия -->
            <v-card-actions class="pt-0">
              <v-switch
                v-model="template.is_active"
                :label="template.is_active ? 'Активен' : 'Неактивен'"
                color="primary"
                hide-details
                @change="toggleTemplate(template)"
              />

              <v-spacer />

              <v-btn
                variant="text"
                size="small"
                @click="viewTemplate(template)"
              >
                <v-icon start>mdi-eye</v-icon>
                Просмотр
              </v-btn>

              <v-btn
                variant="text"
                size="small"
                @click="editTemplate(template)"
                :disabled="template.is_system"
              >
                <v-icon start>mdi-pencil</v-icon>
                Изменить
              </v-btn>

              <v-btn
                variant="text"
                size="small"
                color="error"
                @click="deleteTemplate(template)"
                :disabled="template.is_system"
              >
                <v-icon start>mdi-delete</v-icon>
                Удалить
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Диалог просмотра шаблона -->
    <v-dialog v-model="viewDialog.show" max-width="800" scrollable>
      <v-card v-if="viewDialog.template">
        <v-card-title class="d-flex align-center gap-3">
          <v-avatar
            :color="getTemplateColor(viewDialog.template.type)"
            size="32"
          >
            <v-icon :icon="getTemplateIcon(viewDialog.template.type)" color="white" size="18" />
          </v-avatar>
          {{ viewDialog.template.name }}
        </v-card-title>

        <v-divider />

        <v-card-text class="py-4">
          <!-- Общая информация -->
          <div class="mb-4">
            <h4 class="text-subtitle-1 font-weight-bold mb-2">Общая информация</h4>
            <v-row>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">Тип</div>
                <div>{{ getTemplateTypeLabel(viewDialog.template.type) }}</div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">Категория</div>
                <div>{{ viewDialog.template.category || 'Не указана' }}</div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">Системный</div>
                <div>{{ viewDialog.template.is_system ? 'Да' : 'Нет' }}</div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">Использований</div>
                <div>{{ viewDialog.template.usage_count }}</div>
              </v-col>
            </v-row>
            
            <div class="mt-3">
              <div class="text-caption text-medium-emphasis">Описание</div>
              <div>{{ viewDialog.template.description }}</div>
            </div>
          </div>

          <!-- Специфичный контент для каждого типа -->
          <div v-if="viewDialog.template.type === 'object'">
            <h4 class="text-subtitle-1 font-weight-bold mb-2">Поля шаблона</h4>
            <v-table density="compact">
              <thead>
                <tr>
                  <th>Поле</th>
                  <th>Тип</th>
                  <th>Обязательное</th>
                  <th>Значение по умолчанию</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="field in (viewDialog.template as any).fields" :key="field.name">
                  <td>
                    <div class="font-weight-medium">{{ field.label }}</div>
                    <div class="text-caption text-medium-emphasis">{{ field.name }}</div>
                  </td>
                  <td>
                    <v-chip size="x-small" variant="outlined">{{ field.type }}</v-chip>
                  </td>
                  <td>
                    <v-icon
                      :icon="field.required ? 'mdi-check' : 'mdi-close'"
                      :color="field.required ? 'success' : 'error'"
                      size="16"
                    />
                  </td>
                  <td>{{ field.default_value || '—' }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>

          <div v-if="viewDialog.template.type === 'user'">
            <h4 class="text-subtitle-1 font-weight-bold mb-2">Настройки пользователя</h4>
            <v-row>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">Роль</div>
                <div>{{ (viewDialog.template as any).role_id }}</div>
              </v-col>
              <v-col cols="12">
                <div class="text-caption text-medium-emphasis mb-2">Разрешения</div>
                <div class="d-flex flex-wrap gap-1">
                  <v-chip
                    v-for="permission in (viewDialog.template as any).permissions"
                    :key="permission"
                    size="small"
                    variant="outlined"
                    color="primary"
                  >
                    {{ permission }}
                  </v-chip>
                </div>
              </v-col>
            </v-row>
          </div>

          <div v-if="viewDialog.template.type === 'notification'">
            <h4 class="text-subtitle-1 font-weight-bold mb-2">Шаблон уведомления</h4>
            <div class="mb-3">
              <div class="text-caption text-medium-emphasis">Тема</div>
              <v-code class="d-block pa-2 mb-2">{{ (viewDialog.template as any).subject_template }}</v-code>
            </div>
            <div class="mb-3">
              <div class="text-caption text-medium-emphasis">Тело сообщения</div>
              <v-code class="d-block pa-2 mb-2" style="white-space: pre-wrap;">{{ (viewDialog.template as any).body_template }}</v-code>
            </div>
            <div class="mb-3">
              <div class="text-caption text-medium-emphasis mb-2">Переменные</div>
              <div class="d-flex flex-wrap gap-1">
                <v-chip
                  v-for="variable in (viewDialog.template as any).variables"
                  :key="variable"
                  size="small"
                  variant="outlined"
                  color="info"
                >
                  {{ formatVariable(variable) }}
                </v-chip>
              </div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis mb-2">Каналы доставки</div>
              <div class="d-flex flex-wrap gap-1">
                <v-chip
                  v-for="channel in (viewDialog.template as any).channels"
                  :key="channel"
                  size="small"
                  variant="elevated"
                  :color="getChannelColor(channel)"
                >
                  <v-icon start size="14" :icon="getChannelIcon(channel)" />
                  {{ getChannelLabel(channel) }}
                </v-chip>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn @click="viewDialog.show = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог подтверждения удаления -->
    <v-dialog v-model="deleteDialog.show" max-width="400">
      <v-card>
        <v-card-title>Подтверждение удаления</v-card-title>
        <v-card-text>
          Вы уверены, что хотите удалить шаблон "{{ deleteDialog.template?.name }}"?
          Это действие нельзя отменить.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog.show = false">Отмена</v-btn>
          <v-btn
            color="error"
            @click="confirmDelete"
            :loading="deleteDialog.deleting"
          >
            Удалить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог создания/редактирования шаблона -->
    <v-dialog v-model="createTemplateDialog.show" max-width="600" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center gap-3">
          <v-icon 
            :icon="createTemplateDialog.isEdit ? 'mdi-pencil' : 'mdi-plus'" 
            :color="createTemplateDialog.isEdit ? 'warning' : 'primary'" 
          />
          {{ createTemplateDialog.isEdit ? 'Редактирование шаблона' : 'Создание шаблона' }}
        </v-card-title>

        <v-divider />

        <v-card-text class="py-4">
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="createTemplateForm.name"
                  label="Название шаблона"
                  variant="outlined"
                  density="compact"
                  :error-messages="createTemplateErrors.name"
                  required
                />
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="createTemplateForm.category"
                  label="Категория"
                  variant="outlined"
                  density="compact"
                  :error-messages="createTemplateErrors.category"
                  placeholder="Например: Транспорт, Оборудование"
                  required
                />
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="createTemplateForm.description"
                  label="Описание"
                  variant="outlined"
                  density="compact"
                  :error-messages="createTemplateErrors.description"
                  rows="3"
                  placeholder="Описание шаблона (необязательно)"
                />
              </v-col>
              
              <v-col cols="6">
                <v-text-field
                  v-model="createTemplateForm.icon"
                  label="Иконка"
                  variant="outlined"
                  density="compact"
                  :error-messages="createTemplateErrors.icon"
                  placeholder="mdi-office-building"
                  prepend-inner-icon="mdi-emoticon-outline"
                />
              </v-col>
              
              <v-col cols="6">
                <v-text-field
                  v-model="createTemplateForm.color"
                  label="Цвет"
                  variant="outlined"
                  density="compact"
                  type="color"
                  :error-messages="createTemplateErrors.color"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeCreateTemplateDialog">Отмена</v-btn>
          <v-btn
            color="primary"
            @click="confirmCreateTemplate"
            :loading="loading"
          >
            {{ createTemplateDialog.isEdit ? 'Сохранить' : 'Создать' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar для уведомлений -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top right"
    >
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { settingsService } from '@/services/settingsService';
import type {
    NotificationTemplate,
    ObjectTemplate,
    TemplateBase,
    UserTemplate
} from '@/types/settings';
import { computed, onMounted, ref } from 'vue';

// Реактивные данные
const loading = ref(false);
const templates = ref<(ObjectTemplate | UserTemplate | NotificationTemplate)[]>([]);
const selectedType = ref('');

const viewDialog = ref({
  show: false,
  template: null as (ObjectTemplate | UserTemplate | NotificationTemplate) | null
});

const deleteDialog = ref({
  show: false,
  template: null as TemplateBase | null,
  deleting: false
});

const createTemplateDialog = ref({
  show: false,
  isEdit: false,
  template: null as TemplateBase | null,
});

const createTemplateForm = ref({
  name: '',
  description: '',
  category: '',
  icon: '',
  color: '',
});

const createTemplateErrors = ref<Record<string, string>>({});

const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000
});

// Типы шаблонов для фильтра
const templateTypes = [
  { value: '', title: 'Все типы' },
  { value: 'object', title: 'Шаблоны объектов' },
  { value: 'user', title: 'Шаблоны пользователей' },
  { value: 'notification', title: 'Шаблоны уведомлений' }
];

// Вычисляемые свойства
const stats = computed(() => {
  const total = templates.value.length;
  const system = templates.value.filter(t => t.is_system).length;
  const custom = templates.value.filter(t => !t.is_system).length;
  const totalUsage = templates.value.reduce((sum, t) => sum + t.usage_count, 0);
  
  return { total, system, custom, totalUsage };
});

// Методы
const showSnackbar = (text: string, color = 'info', timeout = 5000) => {
  snackbar.value = { show: true, text, color, timeout };
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date));
};

const getTemplateIcon = (type: string) => {
  const icons = {
    object: 'mdi-office-building',
    user: 'mdi-account',
    notification: 'mdi-bell',
    report: 'mdi-chart-line'
  };
  return icons[type as keyof typeof icons] || 'mdi-file-document';
};

const getTemplateColor = (type: string) => {
  const colors = {
    object: 'blue',
    user: 'green',
    notification: 'orange',
    report: 'purple'
  };
  return colors[type as keyof typeof colors] || 'primary';
};

const getTemplateTypeLabel = (type: string) => {
  const labels = {
    object: 'Шаблон объекта',
    user: 'Шаблон пользователя',
    notification: 'Шаблон уведомления',
    report: 'Шаблон отчета'
  } as any;
  return labels[type] || type;
};

const getChannelIcon = (channel: string) => {
  const icons = {
    telegram: 'mdi-telegram',
    email: 'mdi-email',
    sms: 'mdi-message-text',
    push: 'mdi-bell'
  };
  return icons[channel as keyof typeof icons] || 'mdi-bell';
};

const getChannelColor = (channel: string) => {
  const colors = {
    telegram: 'cyan',
    email: 'purple',
    sms: 'teal',
    push: 'orange'
  };
  return colors[channel as keyof typeof colors] || 'primary';
};

const getChannelLabel = (channel: string) => {
  const labels = {
    telegram: 'Telegram',
    email: 'Email',
    sms: 'SMS',
    push: 'Push'
  } as any;
  return labels[channel] || channel;
};

const formatVariable = (variable: string) => {
  return `{{${variable}}}`;
};

const loadTemplates = async () => {
  loading.value = true;
  try {
    const response = await settingsService.getTemplates(selectedType.value || undefined);
    templates.value = response.templates;
  } catch (error) {
    console.error('Ошибка загрузки шаблонов:', error);
    showSnackbar('Ошибка загрузки шаблонов', 'error');
  } finally {
    loading.value = false;
  }
};

const toggleTemplate = async (template: TemplateBase) => {
  try {
    // В реальном приложении здесь был бы API вызов
    showSnackbar(
      `Шаблон ${template.is_active ? 'активирован' : 'деактивирован'}`,
      'success'
    );
  } catch (error) {
    console.error('Ошибка переключения шаблона:', error);
    // Откатываем изменение
    template.is_active = !template.is_active;
    showSnackbar('Ошибка изменения статуса шаблона', 'error');
  }
};

const viewTemplate = (template: ObjectTemplate | UserTemplate | NotificationTemplate) => {
  viewDialog.value.template = template;
  viewDialog.value.show = true;
};

const editTemplate = (template: TemplateBase) => {
  createTemplateDialog.value = {
    show: true,
    isEdit: true,
    template,
  };
  createTemplateForm.value = {
    name: template.name,
    description: template.description,
    category: template.category,
    icon: (template as any).icon || 'mdi-office-building',
    color: (template as any).color || '#1976D2',
  };
  createTemplateErrors.value = {};
};

const createTemplate = () => {
  createTemplateDialog.value = {
    show: true,
    isEdit: false,
    template: null,
  };
  createTemplateForm.value = {
    name: '',
    description: '',
    category: '',
    icon: 'mdi-office-building',
    color: '#1976D2',
  };
  createTemplateErrors.value = {};
};

const deleteTemplate = (template: TemplateBase) => {
  if (template.is_system) {
    showSnackbar('Системные шаблоны нельзя удалять', 'error');
    return;
  }
  
  deleteDialog.value.template = template;
  deleteDialog.value.show = true;
};

const confirmDelete = async () => {
  if (!deleteDialog.value.template) return;
  
  deleteDialog.value.deleting = true;
  
  try {
    await settingsService.deleteTemplate(deleteDialog.value.template.id);
    
    // Удаляем из списка
    const index = templates.value.findIndex(t => t.id === deleteDialog.value.template!.id);
    if (index !== -1) {
      templates.value.splice(index, 1);
    }
    
    deleteDialog.value.show = false;
    showSnackbar('Шаблон успешно удален', 'success');
  } catch (error) {
    console.error('Ошибка удаления шаблона:', error);
    showSnackbar('Ошибка удаления шаблона', 'error');
  } finally {
    deleteDialog.value.deleting = false;
  }
};

const closeCreateTemplateDialog = () => {
  createTemplateDialog.value.show = false;
  createTemplateDialog.value.isEdit = false;
  createTemplateDialog.value.template = null;
  createTemplateForm.value = {
    name: '',
    description: '',
    category: '',
    icon: '',
    color: '',
  };
  createTemplateErrors.value = {};
};

const confirmCreateTemplate = async () => {
  try {
    createTemplateErrors.value = {};
    
    // Валидация
    if (!createTemplateForm.value.name.trim()) {
      createTemplateErrors.value.name = 'Название шаблона обязательно';
      return;
    }
    if (!createTemplateForm.value.category.trim()) {
      createTemplateErrors.value.category = 'Категория шаблона обязательна';
      return;
    }
    
    const templateData = {
      ...createTemplateForm.value,
      type: 'object', // По умолчанию создаем шаблон объекта
      is_active: true,
      is_system: false,
      usage_count: 0,
    };
    
    if (createTemplateDialog.value.isEdit && createTemplateDialog.value.template) {
      // Редактирование существующего шаблона
      const response = await settingsService.updateTemplate(createTemplateDialog.value.template.id, templateData);
      if (response.status === 'success') {
        showSnackbar('Шаблон успешно обновлен', 'success');
        await loadTemplates();
      } else {
        showSnackbar(response.error || 'Ошибка обновления шаблона', 'error');
      }
    } else {
      // Создание нового шаблона
      const response = await settingsService.createTemplate(templateData);
      if (response.status === 'success') {
        showSnackbar('Шаблон успешно создан', 'success');
        await loadTemplates();
      } else {
        showSnackbar(response.error || 'Ошибка создания шаблона', 'error');
      }
    }
    
    closeCreateTemplateDialog();
  } catch (error) {
    console.error('Ошибка сохранения шаблона:', error);
    showSnackbar('Ошибка сохранения шаблона', 'error');
  }
};

// Lifecycle
onMounted(() => {
  loadTemplates();
});
</script>

<style scoped>
.templates-settings {
  max-width: none;
}

.stats-card {
  transition: all 0.3s ease;
  border-radius: 12px;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.template-card {
  transition: all 0.3s ease;
  border-radius: 12px;
  height: 100%;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.template-card--system {
  border: 2px solid rgba(var(--v-theme-success), 0.3);
}

.template-card .v-card-title {
  padding-bottom: 8px;
}

.template-card .v-card-text {
  padding-top: 8px;
}

.template-info {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 8px;
  padding: 8px;
  margin-top: 8px;
}

.template-details {
  margin-top: 4px;
}

/* Темная тема */
[data-theme="dark"] .stats-card:hover,
[data-theme="dark"] .template-card:hover {
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .template-card--system {
  border-color: rgba(var(--v-theme-success), 0.5);
}

/* Responsive */
@media (max-width: 960px) {
  .template-card,
  .stats-card {
    margin-bottom: 16px;
  }
}
</style>
