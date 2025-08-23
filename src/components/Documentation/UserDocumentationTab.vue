<template>
  <div class="user-documentation-tab">
    <!-- Заголовок и действия -->
    <div class="tab-header">
      <div class="header-info">
        <h3>Пользовательская документация</h3>
        <p>Создание и управление руководствами пользователя на русском языке</p>
      </div>
      <div class="header-actions">
        <v-btn color="primary" variant="elevated" @click="createDocument">
          <v-icon icon="mdi-plus" class="mr-2" />
          Создать документ
        </v-btn>
        <v-btn color="secondary" variant="outlined" @click="$emit('refresh')">
          <v-icon icon="mdi-refresh" class="mr-2" />
          Обновить
        </v-btn>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="filters-section">
      <v-row>
        <v-col cols="12" md="4">
          <v-text-field v-model="searchQuery" label="Поиск документов" prepend-inner-icon="mdi-magnify"
            variant="outlined" density="compact" clearable />
        </v-col>
        <v-col cols="12" md="3">
          <v-select v-model="selectedCategory" :items="categoryOptions" label="Категория" variant="outlined"
            density="compact" clearable />
        </v-col>
        <v-col cols="12" md="3">
          <v-select v-model="selectedStatus" :items="statusOptions" label="Статус" variant="outlined" density="compact"
            clearable />
        </v-col>
        <v-col cols="12" md="2">
          <v-select v-model="selectedLanguage" :items="languageOptions" label="Язык" variant="outlined"
            density="compact" clearable />
        </v-col>
      </v-row>
    </div>

    <!-- Список документов -->
    <div class="documents-section">
      <v-row>
        <v-col v-for="document in filteredDocuments" :key="document.id" cols="12" md="6" lg="4">
          <v-card class="document-card" elevation="2" :class="{ 'draft-card': document.status === 'draft' }">
            <v-card-title class="d-flex align-center">
              <v-icon :icon="getCategoryIcon(document.category)" :color="getCategoryColor(document.category)"
                class="mr-2" />
              <span class="document-title">{{ document.title }}</span>
            </v-card-title>

            <v-card-subtitle>
              <div class="document-meta">
                <v-chip :color="getStatusColor(document.status)" size="small" variant="elevated" class="mr-2">
                  {{ getStatusText(document.status) }}
                </v-chip>
                <v-chip size="small" variant="outlined" class="mr-2">
                  {{ getCategoryText(document.category) }}
                </v-chip>
                <v-chip size="small" variant="outlined">
                  {{ document.language.toUpperCase() }}
                </v-chip>
              </div>
            </v-card-subtitle>

            <v-card-text>
              <div class="document-preview">
                {{ getContentPreview(document.content) }}
              </div>

              <div class="document-info">
                <div class="info-item">
                  <v-icon icon="mdi-account" size="small" class="mr-1" />
                  {{ document.author }}
                </div>
                <div class="info-item">
                  <v-icon icon="mdi-clock" size="small" class="mr-1" />
                  {{ formatDate(document.lastUpdated) }}
                </div>
                <div class="info-item">
                  <v-icon icon="mdi-tag" size="small" class="mr-1" />
                  v{{ document.version }}
                </div>
              </div>

              <div class="document-tags" v-if="document.tags.length">
                <v-chip v-for="tag in document.tags" :key="tag" size="x-small" variant="outlined" class="mr-1 mb-1">
                  {{ tag }}
                </v-chip>
              </div>
            </v-card-text>

            <v-card-actions>
              <v-btn icon="mdi-eye" size="small" variant="text" @click="viewDocument(document)" />
              <v-btn icon="mdi-pencil" size="small" variant="text" @click="editDocument(document)" />
              <v-btn icon="mdi-download" size="small" variant="text" @click="exportDocument(document)" />
              <v-spacer />
              <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="deleteDocument(document)" />
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Диалог создания/редактирования документа -->
    <v-dialog v-model="documentDialog" max-width="1000px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-book-edit" class="mr-2" />
          {{ editingDocument ? 'Редактировать документ' : 'Создать документ' }}
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="closeDocumentDialog" />
        </v-card-title>

        <v-card-text>
          <v-form ref="documentForm" v-model="formValid">
            <v-row>
              <v-col cols="12" md="8">
                <v-text-field v-model="documentForm.title" label="Название документа" variant="outlined"
                  :rules="[v => !!v || 'Название обязательно']" required />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="documentForm.version" label="Версия" variant="outlined"
                  :rules="[v => !!v || 'Версия обязательна']" required />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="4">
                <v-select v-model="documentForm.category" :items="categoryOptions" label="Категория" variant="outlined"
                  :rules="[v => !!v || 'Категория обязательна']" required />
              </v-col>
              <v-col cols="12" md="4">
                <v-select v-model="documentForm.language" :items="languageOptions" label="Язык" variant="outlined"
                  :rules="[v => !!v || 'Язык обязателен']" required />
              </v-col>
              <v-col cols="12" md="4">
                <v-select v-model="documentForm.status" :items="statusOptions" label="Статус" variant="outlined"
                  :rules="[v => !!v || 'Статус обязателен']" required />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-combobox v-model="documentForm.tags" label="Теги" variant="outlined" multiple chips closable-chips
                  hint="Нажмите Enter для добавления тега" />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea v-model="documentForm.content" label="Содержимое (Markdown)" variant="outlined" rows="15"
                  :rules="[v => !!v || 'Содержимое обязательно']" required hint="Поддерживается разметка Markdown" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-btn color="secondary" variant="outlined" @click="previewDocument">
            <v-icon icon="mdi-eye" class="mr-2" />
            Предварительный просмотр
          </v-btn>
          <v-spacer />
          <v-btn color="error" variant="outlined" @click="closeDocumentDialog">
            Отмена
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="saveDocument" :disabled="!formValid" :loading="saving">
            {{ editingDocument ? 'Сохранить' : 'Создать' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог просмотра документа -->
    <v-dialog v-model="viewDialog" max-width="900px">
      <v-card v-if="viewingDocument">
        <v-card-title class="d-flex align-center">
          <v-icon :icon="getCategoryIcon(viewingDocument.category)" :color="getCategoryColor(viewingDocument.category)"
            class="mr-2" />
          {{ viewingDocument.title }}
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="viewDialog = false" />
        </v-card-title>

        <v-card-text>
          <div class="document-content" v-html="renderMarkdown(viewingDocument.content)"></div>
        </v-card-text>

        <v-card-actions>
          <v-btn color="primary" @click="editDocument(viewingDocument)">
            <v-icon icon="mdi-pencil" class="mr-2" />
            Редактировать
          </v-btn>
          <v-btn color="secondary" @click="exportDocument(viewingDocument)">
            <v-icon icon="mdi-download" class="mr-2" />
            Экспорт
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { UserDocumentation } from '@/types/documentation';
import { computed, reactive, ref } from 'vue';

// Props
interface Props {
  documents: UserDocumentation[];
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  create: [doc: Partial<UserDocumentation>];
  update: [id: string, updates: Partial<UserDocumentation>];
  delete: [id: string];
  refresh: [];
}>();

// Реактивные данные
const searchQuery = ref('');
const selectedCategory = ref<string | null>(null);
const selectedStatus = ref<string | null>(null);
const selectedLanguage = ref<string | null>(null);
const documentDialog = ref(false);
const viewDialog = ref(false);
const formValid = ref(false);
const saving = ref(false);
const editingDocument = ref<UserDocumentation | null>(null);
const viewingDocument = ref<UserDocumentation | null>(null);

// Форма документа
const documentForm = reactive({
  title: '',
  category: 'user-guide' as UserDocumentation['category'],
  language: 'ru' as UserDocumentation['language'],
  status: 'draft' as UserDocumentation['status'],
  version: '1.0.0',
  content: '',
  tags: [] as string[]
});

// Константы
const categoryOptions = [
  { title: 'Начало работы', value: 'getting-started' },
  { title: 'Руководство пользователя', value: 'user-guide' },
  { title: 'Руководство администратора', value: 'admin-guide' },
  { title: 'API справочник', value: 'api-reference' },
  { title: 'Устранение неполадок', value: 'troubleshooting' }
];

const statusOptions = [
  { title: 'Черновик', value: 'draft' },
  { title: 'Опубликован', value: 'published' },
  { title: 'Архивирован', value: 'archived' }
];

const languageOptions = [
  { title: 'Русский', value: 'ru' },
  { title: 'English', value: 'en' }
];

// Вычисляемые свойства
const filteredDocuments = computed(() => {
  let filtered = props.documents;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(doc =>
      doc.title.toLowerCase().includes(query) ||
      doc.content.toLowerCase().includes(query) ||
      doc.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  if (selectedCategory.value) {
    filtered = filtered.filter(doc => doc.category === selectedCategory.value);
  }

  if (selectedStatus.value) {
    filtered = filtered.filter(doc => doc.status === selectedStatus.value);
  }

  if (selectedLanguage.value) {
    filtered = filtered.filter(doc => doc.language === selectedLanguage.value);
  }

  return filtered.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
});

// Методы
const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    'getting-started': 'mdi-rocket-launch',
    'user-guide': 'mdi-account-circle',
    'admin-guide': 'mdi-shield-account',
    'api-reference': 'mdi-api',
    'troubleshooting': 'mdi-wrench'
  };
  return icons[category] || 'mdi-book';
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'getting-started': 'success',
    'user-guide': 'primary',
    'admin-guide': 'warning',
    'api-reference': 'info',
    'troubleshooting': 'error'
  };
  return colors[category] || 'default';
};

const getCategoryText = (category: string) => {
  const option = categoryOptions.find(opt => opt.value === category);
  return option?.title || category;
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: 'warning',
    published: 'success',
    archived: 'error'
  };
  return colors[status] || 'default';
};

const getStatusText = (status: string) => {
  const option = statusOptions.find(opt => opt.value === status);
  return option?.title || status;
};

const getContentPreview = (content: string) => {
  return content.replace(/[#*`]/g, '').substring(0, 150) + (content.length > 150 ? '...' : '');
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const renderMarkdown = (content: string) => {
  // Простая обработка Markdown для демо
  return content
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/`(.*)`/gim, '<code>$1</code>')
    .replace(/\n/gim, '<br>');
};

const createDocument = () => {
  editingDocument.value = null;
  resetForm();
  documentDialog.value = true;
};

const editDocument = (document: UserDocumentation) => {
  editingDocument.value = document;
  documentForm.title = document.title;
  documentForm.category = document.category;
  documentForm.language = document.language;
  documentForm.status = document.status;
  documentForm.version = document.version;
  documentForm.content = document.content;
  documentForm.tags = [...document.tags];
  documentDialog.value = true;
  viewDialog.value = false;
};

const viewDocument = (document: UserDocumentation) => {
  viewingDocument.value = document;
  viewDialog.value = true;
};

const deleteDocument = (document: UserDocumentation) => {
  if (confirm(`Удалить документ "${document.title}"?`)) {
    emit('delete', document.id);
  }
};

const saveDocument = async () => {
  saving.value = true;
  try {
    if (editingDocument.value) {
      emit('update', editingDocument.value.id, {
        title: documentForm.title,
        category: documentForm.category,
        language: documentForm.language,
        status: documentForm.status,
        version: documentForm.version,
        content: documentForm.content,
        tags: documentForm.tags
      });
    } else {
      emit('create', {
        title: documentForm.title,
        category: documentForm.category,
        language: documentForm.language,
        status: documentForm.status,
        version: documentForm.version,
        content: documentForm.content,
        tags: documentForm.tags
      });
    }
    closeDocumentDialog();
  } finally {
    saving.value = false;
  }
};

const closeDocumentDialog = () => {
  documentDialog.value = false;
  editingDocument.value = null;
  resetForm();
};

const resetForm = () => {
  documentForm.title = '';
  documentForm.category = 'user-guide';
  documentForm.language = 'ru';
  documentForm.status = 'draft';
  documentForm.version = '1.0.0';
  documentForm.content = '';
  documentForm.tags = [];
};

const previewDocument = () => {
  viewingDocument.value = {
    id: 'preview',
    title: documentForm.title,
    category: documentForm.category,
    language: documentForm.language,
    status: documentForm.status,
    version: documentForm.version,
    content: documentForm.content,
    tags: documentForm.tags,
    author: 'Предварительный просмотр',
    lastUpdated: new Date().toISOString(),
    attachments: []
  };
  viewDialog.value = true;
};

const exportDocument = (document: UserDocumentation) => {
  const content = `# ${document.title}\n\n${document.content}`;
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
.user-documentation-tab {
  height: 100%;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
}

.header-info h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--v-theme-primary);
  margin-bottom: 4px;
}

.header-info p {
  color: var(--v-theme-on-surface-variant);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.filters-section {
  margin-bottom: 24px;
}

.documents-section {
  flex: 1;
}

.document-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.document-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.draft-card {
  border-left: 4px solid var(--v-theme-warning);
}

.document-title {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.document-preview {
  color: var(--v-theme-on-surface-variant);
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 12px;
  min-height: 60px;
}

.document-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: var(--v-theme-on-surface-variant);
}

.document-tags {
  margin-top: auto;
}

.document-content {
  max-height: 500px;
  overflow-y: auto;
  line-height: 1.6;
}

.document-content h1,
.document-content h2,
.document-content h3 {
  color: var(--v-theme-primary);
  margin: 16px 0 8px 0;
}

.document-content h1 {
  font-size: 1.5rem;
}

.document-content h2 {
  font-size: 1.3rem;
}

.document-content h3 {
  font-size: 1.1rem;
}

.document-content code {
  background: var(--v-theme-surface-variant);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

/* Адаптивность */
@media (max-width: 768px) {
  .tab-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: stretch;
  }

  .header-actions .v-btn {
    flex: 1;
  }
}
</style>
