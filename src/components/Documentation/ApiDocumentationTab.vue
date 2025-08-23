<template>
  <div class="api-documentation-tab">
    <!-- Заголовок и действия -->
    <div class="tab-header">
      <div class="header-info">
        <h3>API Документация</h3>
        <p>Управление Swagger документацией и API endpoints</p>
      </div>
      <div class="header-actions">
        <v-btn color="primary" variant="elevated" @click="generateSwagger" :loading="generating">
          <v-icon icon="mdi-file-code" class="mr-2" />
          Генерировать Swagger
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
          <v-text-field v-model="searchQuery" label="Поиск endpoints" prepend-inner-icon="mdi-magnify"
            variant="outlined" density="compact" clearable />
        </v-col>
        <v-col cols="12" md="3">
          <v-select v-model="selectedMethod" :items="httpMethods" label="HTTP метод" variant="outlined"
            density="compact" clearable />
        </v-col>
        <v-col cols="12" md="3">
          <v-select v-model="selectedTag" :items="availableTags" label="Тег" variant="outlined" density="compact"
            clearable />
        </v-col>
        <v-col cols="12" md="2">
          <v-switch v-model="showDeprecated" label="Устаревшие" color="warning" density="compact" />
        </v-col>
      </v-row>
    </div>

    <!-- Список endpoints -->
    <div class="endpoints-section">
      <v-card elevation="2">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-api" class="mr-2" />
          API Endpoints ({{ filteredEndpoints.length }})
        </v-card-title>

        <v-data-table :headers="endpointHeaders" :items="filteredEndpoints" :search="searchQuery"
          class="endpoints-table" item-value="id">
          <template #item.method="{ item }">
            <v-chip :color="getMethodColor(item.method)" size="small" variant="elevated">
              {{ item.method }}
            </v-chip>
          </template>

          <template #item.path="{ item }">
            <code class="endpoint-path">{{ item.path }}</code>
          </template>

          <template #item.tags="{ item }">
            <div class="tags-container">
              <v-chip v-for="tag in item.tags" :key="tag" size="x-small" variant="outlined" class="mr-1">
                {{ tag }}
              </v-chip>
            </div>
          </template>

          <template #item.authenticated="{ item }">
            <v-icon :icon="item.authenticated ? 'mdi-lock' : 'mdi-lock-open'"
              :color="item.authenticated ? 'success' : 'warning'" />
          </template>

          <template #item.deprecated="{ item }">
            <v-chip v-if="item.deprecated" color="warning" size="small" variant="outlined">
              Устарел
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <v-btn icon="mdi-eye" size="small" variant="text" @click="viewEndpoint(item)" />
            <v-btn icon="mdi-code-tags" size="small" variant="text" @click="viewSwagger(item)" />
          </template>
        </v-data-table>
      </v-card>
    </div>

    <!-- Диалог просмотра endpoint -->
    <v-dialog v-model="endpointDialog" max-width="800px">
      <v-card v-if="selectedEndpoint">
        <v-card-title class="d-flex align-center">
          <v-chip :color="getMethodColor(selectedEndpoint.method)" class="mr-3">
            {{ selectedEndpoint.method }}
          </v-chip>
          <code>{{ selectedEndpoint.path }}</code>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="endpointDialog = false" />
        </v-card-title>

        <v-card-text>
          <div class="endpoint-details">
            <div class="detail-section">
              <h4>Описание</h4>
              <p>{{ selectedEndpoint.description }}</p>
            </div>

            <div class="detail-section" v-if="selectedEndpoint.parameters.length">
              <h4>Параметры</h4>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Тип</th>
                    <th>Расположение</th>
                    <th>Обязательный</th>
                    <th>Описание</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="param in selectedEndpoint.parameters" :key="param.name">
                    <td><code>{{ param.name }}</code></td>
                    <td>{{ param.type }}</td>
                    <td>{{ param.in }}</td>
                    <td>
                      <v-icon :icon="param.required ? 'mdi-check' : 'mdi-close'"
                        :color="param.required ? 'success' : 'error'" size="small" />
                    </td>
                    <td>{{ param.description }}</td>
                  </tr>
                </tbody>
              </v-table>
            </div>

            <div class="detail-section">
              <h4>Ответы</h4>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th>Код</th>
                    <th>Описание</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="response in selectedEndpoint.responses" :key="response.code">
                    <td>
                      <v-chip :color="getResponseColor(response.code)" size="small">
                        {{ response.code }}
                      </v-chip>
                    </td>
                    <td>{{ response.description }}</td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Диалог Swagger -->
    <v-dialog v-model="swaggerDialog" max-width="1000px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-file-code" class="mr-2" />
          Swagger Документация
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="swaggerDialog = false" />
        </v-card-title>

        <v-card-text>
          <v-textarea :model-value="swaggerContent" label="Swagger JSON" variant="outlined" rows="20" readonly
            class="swagger-content" />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="downloadSwagger">
            <v-icon icon="mdi-download" class="mr-2" />
            Скачать
          </v-btn>
          <v-btn color="secondary" @click="copySwagger">
            <v-icon icon="mdi-content-copy" class="mr-2" />
            Копировать
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { ApiDocumentation, ApiEndpoint } from '@/types/documentation';
import { computed, ref } from 'vue';

// Props
interface Props {
  documentation: ApiDocumentation[];
  endpoints: ApiEndpoint[];
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'generate-swagger': [docId: string];
  refresh: [];
}>();

// Реактивные данные
const generating = ref(false);
const searchQuery = ref('');
const selectedMethod = ref<string | null>(null);
const selectedTag = ref<string | null>(null);
const showDeprecated = ref(false);
const endpointDialog = ref(false);
const swaggerDialog = ref(false);
const selectedEndpoint = ref<ApiEndpoint | null>(null);
const swaggerContent = ref('');

// Константы
const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

const endpointHeaders = [
  { title: 'Метод', key: 'method', width: '100px' },
  { title: 'Путь', key: 'path', width: '300px' },
  { title: 'Описание', key: 'summary' },
  { title: 'Теги', key: 'tags', width: '200px' },
  { title: 'Авторизация', key: 'authenticated', width: '120px' },
  { title: 'Статус', key: 'deprecated', width: '100px' },
  { title: 'Действия', key: 'actions', width: '120px', sortable: false }
];

// Вычисляемые свойства
const availableTags = computed(() => {
  const tags = new Set<string>();
  props.endpoints.forEach(endpoint => {
    endpoint.tags.forEach(tag => tags.add(tag));
  });
  return Array.from(tags).sort();
});

const filteredEndpoints = computed(() => {
  let filtered = props.endpoints;

  if (selectedMethod.value) {
    filtered = filtered.filter(endpoint => endpoint.method === selectedMethod.value);
  }

  if (selectedTag.value) {
    filtered = filtered.filter(endpoint => endpoint.tags.includes(selectedTag.value!));
  }

  if (!showDeprecated.value) {
    filtered = filtered.filter(endpoint => !endpoint.deprecated);
  }

  return filtered;
});

// Методы
const getMethodColor = (method: string) => {
  const colors: Record<string, string> = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    DELETE: 'error',
    PATCH: 'info'
  };
  return colors[method] || 'default';
};

const getResponseColor = (code: number) => {
  if (code >= 200 && code < 300) return 'success';
  if (code >= 300 && code < 400) return 'info';
  if (code >= 400 && code < 500) return 'warning';
  if (code >= 500) return 'error';
  return 'default';
};

const generateSwagger = async () => {
  generating.value = true;
  try {
    if (props.documentation.length > 0) {
      emit('generate-swagger', props.documentation[0].id);
    }
  } finally {
    generating.value = false;
  }
};

const viewEndpoint = (endpoint: ApiEndpoint) => {
  selectedEndpoint.value = endpoint;
  endpointDialog.value = true;
};

const viewSwagger = (endpoint: ApiEndpoint) => {
  const swagger = {
    openapi: '3.0.0',
    info: {
      title: 'Axenta CRM API',
      version: '1.0.0'
    },
    paths: {
      [endpoint.path]: {
        [endpoint.method.toLowerCase()]: {
          summary: endpoint.summary,
          description: endpoint.description,
          tags: endpoint.tags,
          parameters: endpoint.parameters,
          responses: endpoint.responses.reduce((acc, response) => {
            acc[response.code] = {
              description: response.description
            };
            return acc;
          }, {} as Record<string, any>)
        }
      }
    }
  };

  swaggerContent.value = JSON.stringify(swagger, null, 2);
  swaggerDialog.value = true;
};

const downloadSwagger = () => {
  const blob = new Blob([swaggerContent.value], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'swagger.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const copySwagger = async () => {
  try {
    await navigator.clipboard.writeText(swaggerContent.value);
    // Здесь можно показать уведомление об успешном копировании
  } catch (error) {
    console.error('Ошибка копирования:', error);
  }
};
</script>

<style scoped>
.api-documentation-tab {
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

.endpoints-section {
  flex: 1;
}

.endpoint-path {
  background: var(--v-theme-surface-variant);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.endpoints-table {
  background: var(--v-theme-surface);
}

.endpoint-details {
  max-height: 500px;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--v-theme-primary);
  margin-bottom: 12px;
}

.swagger-content {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
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
