<template>
  <div class="deployment-tab">
    <!-- Заголовок и действия -->
    <div class="tab-header">
      <div class="header-info">
        <h3>Управление развертыванием</h3>
        <p>Мониторинг окружений, история развертываний и выполнение скриптов</p>
      </div>
      <div class="header-actions">
        <v-btn color="primary" variant="elevated" @click="deployDialog = true">
          <v-icon icon="mdi-rocket-launch" class="mr-2" />
          Развернуть
        </v-btn>
        <v-btn color="secondary" variant="outlined" @click="$emit('refresh')">
          <v-icon icon="mdi-refresh" class="mr-2" />
          Обновить
        </v-btn>
      </div>
    </div>

    <!-- Окружения -->
    <div class="environments-section">
      <h4 class="section-title">
        <v-icon icon="mdi-server" class="mr-2" />
        Окружения
      </h4>

      <v-row>
        <v-col v-for="environment in environments" :key="environment.id" cols="12" md="4">
          <v-card class="environment-card" elevation="2" :class="getEnvironmentCardClass(environment.status)">
            <v-card-title class="d-flex align-center">
              <v-icon :icon="getEnvironmentIcon(environment.type)" :color="getEnvironmentColor(environment.status)"
                class="mr-2" />
              {{ environment.name }}
              <v-spacer />
              <v-chip :color="getEnvironmentColor(environment.status)" size="small" variant="elevated">
                {{ getStatusText(environment.status) }}
              </v-chip>
            </v-card-title>

            <v-card-text>
              <div class="environment-info">
                <div class="info-row">
                  <span class="info-label">URL:</span>
                  <a :href="environment.url" target="_blank" class="info-value link">
                    {{ environment.url }}
                  </a>
                </div>
                <div class="info-row">
                  <span class="info-label">Версия:</span>
                  <code class="info-value">{{ environment.version }}</code>
                </div>
                <div class="info-row">
                  <span class="info-label">Ветка:</span>
                  <code class="info-value">{{ environment.branch }}</code>
                </div>
                <div class="info-row">
                  <span class="info-label">Uptime:</span>
                  <span class="info-value">{{ environment.uptime }}%</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Последнее развертывание:</span>
                  <span class="info-value">{{ formatDate(environment.lastDeployment) }}</span>
                </div>
              </div>

              <!-- Ресурсы -->
              <div class="resources-section">
                <h5>Использование ресурсов</h5>
                <div class="resource-item">
                  <div class="resource-header">
                    <span>CPU</span>
                    <span>{{ environment.resources.cpu.usage }}%</span>
                  </div>
                  <v-progress-linear :model-value="environment.resources.cpu.usage"
                    :color="getResourceColor(environment.resources.cpu.usage)" height="6" />
                </div>
                <div class="resource-item">
                  <div class="resource-header">
                    <span>Memory</span>
                    <span>{{ environment.resources.memory.usage }}GB / {{ environment.resources.memory.limit }}GB</span>
                  </div>
                  <v-progress-linear
                    :model-value="(environment.resources.memory.usage / environment.resources.memory.limit) * 100"
                    :color="getResourceColor((environment.resources.memory.usage / environment.resources.memory.limit) * 100)"
                    height="6" />
                </div>
                <div class="resource-item">
                  <div class="resource-header">
                    <span>Storage</span>
                    <span>{{ environment.resources.storage.usage }}GB / {{ environment.resources.storage.limit
                      }}GB</span>
                  </div>
                  <v-progress-linear
                    :model-value="(environment.resources.storage.usage / environment.resources.storage.limit) * 100"
                    :color="getResourceColor((environment.resources.storage.usage / environment.resources.storage.limit) * 100)"
                    height="6" />
                </div>
              </div>
            </v-card-text>

            <v-card-actions>
              <v-btn size="small" variant="outlined" @click="deployToEnvironment(environment)"
                :disabled="environment.status === 'deploying'">
                <v-icon icon="mdi-rocket-launch" class="mr-1" />
                Развернуть
              </v-btn>
              <v-btn size="small" variant="text" @click="viewEnvironmentLogs(environment)">
                <v-icon icon="mdi-text-box" class="mr-1" />
                Логи
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- История развертываний -->
    <div class="history-section">
      <h4 class="section-title">
        <v-icon icon="mdi-history" class="mr-2" />
        История развертываний
      </h4>

      <v-card elevation="2">
        <v-data-table :headers="historyHeaders" :items="history" class="deployment-history-table" item-value="id">
          <template #item.status="{ item }">
            <v-chip :color="getDeploymentStatusColor(item.status)" size="small" variant="elevated">
              <v-icon :icon="getDeploymentStatusIcon(item.status)" size="small" class="mr-1" />
              {{ getDeploymentStatusText(item.status) }}
            </v-chip>
          </template>

          <template #item.environment="{ item }">
            <v-chip size="small" variant="outlined">
              {{ item.environment }}
            </v-chip>
          </template>

          <template #item.version="{ item }">
            <code>{{ item.version }}</code>
          </template>

          <template #item.branch="{ item }">
            <code>{{ item.branch }}</code>
          </template>

          <template #item.duration="{ item }">
            <span v-if="item.duration">{{ formatDuration(item.duration) }}</span>
            <span v-else class="text-disabled">—</span>
          </template>

          <template #item.startedAt="{ item }">
            {{ formatDate(item.startedAt) }}
          </template>

          <template #item.actions="{ item }">
            <v-btn icon="mdi-text-box" size="small" variant="text" @click="viewDeploymentLogs(item)" />
            <v-btn v-if="item.status === 'failed'" icon="mdi-restart" size="small" variant="text" color="warning"
              @click="retryDeployment(item)" />
          </template>
        </v-data-table>
      </v-card>
    </div>

    <!-- Скрипты развертывания -->
    <div class="scripts-section">
      <h4 class="section-title">
        <v-icon icon="mdi-script-text" class="mr-2" />
        Скрипты развертывания
      </h4>

      <v-row>
        <v-col v-for="script in scripts" :key="script.id" cols="12" md="6">
          <v-card class="script-card" elevation="2">
            <v-card-title class="d-flex align-center">
              <v-icon :icon="getScriptIcon(script.type)" :color="script.status === 'active' ? 'success' : 'error'"
                class="mr-2" />
              {{ script.name }}
              <v-spacer />
              <v-chip :color="script.status === 'active' ? 'success' : 'error'" size="small" variant="elevated">
                {{ script.status === 'active' ? 'Активен' : 'Неактивен' }}
              </v-chip>
            </v-card-title>

            <v-card-text>
              <div class="script-info">
                <div class="info-row">
                  <span class="info-label">Тип:</span>
                  <span class="info-value">{{ script.type.toUpperCase() }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Окружение:</span>
                  <span class="info-value">{{ script.environment }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Автор:</span>
                  <span class="info-value">{{ script.author }}</span>
                </div>
                <div class="info-row" v-if="script.lastExecuted">
                  <span class="info-label">Последнее выполнение:</span>
                  <span class="info-value">{{ formatDate(script.lastExecuted) }}</span>
                </div>
              </div>

              <div class="script-variables" v-if="Object.keys(script.variables).length">
                <h6>Переменные:</h6>
                <div class="variables-list">
                  <v-chip v-for="(value, key) in script.variables" :key="key" size="small" variant="outlined"
                    class="mr-1 mb-1">
                    {{ key }}
                  </v-chip>
                </div>
              </div>
            </v-card-text>

            <v-card-actions>
              <v-btn size="small" color="primary" variant="outlined" @click="executeScript(script)"
                :disabled="script.status !== 'active'">
                <v-icon icon="mdi-play" class="mr-1" />
                Выполнить
              </v-btn>
              <v-btn size="small" variant="text" @click="viewScript(script)">
                <v-icon icon="mdi-eye" class="mr-1" />
                Просмотр
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Диалог развертывания -->
    <v-dialog v-model="deployDialog" max-width="600px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-rocket-launch" class="mr-2" />
          Развертывание
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="deployDialog = false" />
        </v-card-title>

        <v-card-text>
          <v-form ref="deployForm" v-model="deployFormValid">
            <v-select v-model="deployForm.environment" :items="environmentOptions" label="Окружение" variant="outlined"
              :rules="[v => !!v || 'Выберите окружение']" required />

            <v-text-field v-model="deployForm.version" label="Версия" variant="outlined"
              :rules="[v => !!v || 'Укажите версию']" required hint="Например: 1.2.3 или latest" />

            <v-text-field v-model="deployForm.branch" label="Ветка" variant="outlined"
              :rules="[v => !!v || 'Укажите ветку']" required hint="Например: main, develop, feature/new-feature" />

            <v-textarea v-model="deployForm.notes" label="Примечания (необязательно)" variant="outlined" rows="3"
              hint="Описание изменений или особенности развертывания" />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="error" variant="outlined" @click="deployDialog = false">
            Отмена
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="startDeployment" :disabled="!deployFormValid"
            :loading="deploying">
            Развернуть
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог просмотра логов -->
    <v-dialog v-model="logsDialog" max-width="900px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-text-box" class="mr-2" />
          Логи развертывания
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="logsDialog = false" />
        </v-card-title>

        <v-card-text>
          <div class="logs-container">
            <div v-for="log in selectedLogs" :key="log.timestamp" class="log-entry" :class="`log-${log.level}`">
              <span class="log-timestamp">{{ formatTime(log.timestamp) }}</span>
              <span class="log-level">{{ log.level.toUpperCase() }}</span>
              <span class="log-source">[{{ log.source }}]</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { DeploymentEnvironment, DeploymentHistory, DeploymentLog, DeploymentScript } from '@/types/documentation';
import { computed, reactive, ref } from 'vue';

// Props
interface Props {
  environments: DeploymentEnvironment[];
  history: DeploymentHistory[];
  scripts: DeploymentScript[];
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  deploy: [environmentId: string, version: string];
  'execute-script': [scriptId: string];
  refresh: [];
}>();

// Реактивные данные
const deployDialog = ref(false);
const logsDialog = ref(false);
const deployFormValid = ref(false);
const deploying = ref(false);
const selectedLogs = ref<DeploymentLog[]>([]);

// Форма развертывания
const deployForm = reactive({
  environment: '',
  version: '',
  branch: 'main',
  notes: ''
});

// Константы
const historyHeaders = [
  { title: 'Статус', key: 'status', width: '120px' },
  { title: 'Окружение', key: 'environment', width: '120px' },
  { title: 'Версия', key: 'version', width: '120px' },
  { title: 'Ветка', key: 'branch', width: '120px' },
  { title: 'Автор', key: 'author' },
  { title: 'Длительность', key: 'duration', width: '120px' },
  { title: 'Начало', key: 'startedAt', width: '150px' },
  { title: 'Действия', key: 'actions', width: '100px', sortable: false }
];

// Вычисляемые свойства
const environmentOptions = computed(() => {
  return props.environments.map(env => ({
    title: env.name,
    value: env.id
  }));
});

// Методы
const getEnvironmentIcon = (type: string) => {
  const icons: Record<string, string> = {
    production: 'mdi-server',
    staging: 'mdi-server-outline',
    development: 'mdi-laptop'
  };
  return icons[type] || 'mdi-server';
};

const getEnvironmentColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'success',
    inactive: 'error',
    deploying: 'warning',
    error: 'error'
  };
  return colors[status] || 'default';
};

const getEnvironmentCardClass = (status: string) => {
  return {
    'environment-active': status === 'active',
    'environment-deploying': status === 'deploying',
    'environment-error': status === 'error'
  };
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    active: 'Активно',
    inactive: 'Неактивно',
    deploying: 'Развертывание',
    error: 'Ошибка'
  };
  return texts[status] || status;
};

const getResourceColor = (usage: number) => {
  if (usage < 50) return 'success';
  if (usage < 80) return 'warning';
  return 'error';
};

const getDeploymentStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'info',
    running: 'warning',
    success: 'success',
    failed: 'error',
    cancelled: 'default'
  };
  return colors[status] || 'default';
};

const getDeploymentStatusIcon = (status: string) => {
  const icons: Record<string, string> = {
    pending: 'mdi-clock',
    running: 'mdi-loading',
    success: 'mdi-check',
    failed: 'mdi-close',
    cancelled: 'mdi-cancel'
  };
  return icons[status] || 'mdi-help';
};

const getDeploymentStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: 'Ожидание',
    running: 'Выполняется',
    success: 'Успешно',
    failed: 'Ошибка',
    cancelled: 'Отменено'
  };
  return texts[status] || status;
};

const getScriptIcon = (type: string) => {
  const icons: Record<string, string> = {
    bash: 'mdi-bash',
    docker: 'mdi-docker',
    kubernetes: 'mdi-kubernetes',
    ansible: 'mdi-ansible'
  };
  return icons[type] || 'mdi-script-text';
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

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}м ${remainingSeconds}с`;
};

const deployToEnvironment = (environment: DeploymentEnvironment) => {
  deployForm.environment = environment.id;
  deployForm.version = environment.version;
  deployForm.branch = environment.branch;
  deployDialog.value = true;
};

const startDeployment = async () => {
  deploying.value = true;
  try {
    emit('deploy', deployForm.environment, deployForm.version);
    deployDialog.value = false;
    // Сброс формы
    deployForm.environment = '';
    deployForm.version = '';
    deployForm.branch = 'main';
    deployForm.notes = '';
  } finally {
    deploying.value = false;
  }
};

const viewEnvironmentLogs = (environment: DeploymentEnvironment) => {
  // Найти последнее развертывание для этого окружения
  const lastDeployment = props.history
    .filter(h => h.environment === environment.id)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];

  if (lastDeployment) {
    selectedLogs.value = lastDeployment.logs;
    logsDialog.value = true;
  }
};

const viewDeploymentLogs = (deployment: DeploymentHistory) => {
  selectedLogs.value = deployment.logs;
  logsDialog.value = true;
};

const retryDeployment = (deployment: DeploymentHistory) => {
  emit('deploy', deployment.environment, deployment.version);
};

const executeScript = (script: DeploymentScript) => {
  if (confirm(`Выполнить скрипт "${script.name}"?`)) {
    emit('execute-script', script.id);
  }
};

const viewScript = (script: DeploymentScript) => {
  // Здесь можно открыть диалог с содержимым скрипта
  alert(`Скрипт: ${script.name}\n\nСодержимое:\n${script.content}`);
};
</script>

<style scoped>
.deployment-tab {
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

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--v-theme-primary);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.environments-section,
.history-section,
.scripts-section {
  margin-bottom: 32px;
}

.environment-card {
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.environment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.environment-active {
  border-left: 4px solid var(--v-theme-success);
}

.environment-deploying {
  border-left: 4px solid var(--v-theme-warning);
}

.environment-error {
  border-left: 4px solid var(--v-theme-error);
}

.environment-info {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.info-label {
  font-weight: 500;
  color: var(--v-theme-on-surface-variant);
}

.info-value {
  font-weight: 400;
}

.info-value.link {
  color: var(--v-theme-primary);
  text-decoration: none;
}

.info-value.link:hover {
  text-decoration: underline;
}

.resources-section h5 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--v-theme-primary);
  margin-bottom: 12px;
}

.resource-item {
  margin-bottom: 12px;
}

.resource-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 0.9rem;
}

.script-card {
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.script-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.script-info {
  margin-bottom: 16px;
}

.script-variables h6 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--v-theme-primary);
  margin-bottom: 8px;
}

.variables-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.deployment-history-table {
  background: var(--v-theme-surface);
}

.logs-container {
  max-height: 500px;
  overflow-y: auto;
  background: var(--v-theme-surface-variant);
  border-radius: 8px;
  padding: 16px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.log-entry {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  padding: 2px 0;
}

.log-timestamp {
  color: var(--v-theme-on-surface-variant);
  flex-shrink: 0;
}

.log-level {
  font-weight: 600;
  flex-shrink: 0;
  width: 60px;
}

.log-source {
  color: var(--v-theme-primary);
  flex-shrink: 0;
}

.log-message {
  flex: 1;
}

.log-info .log-level {
  color: var(--v-theme-info);
}

.log-warning .log-level {
  color: var(--v-theme-warning);
}

.log-error .log-level {
  color: var(--v-theme-error);
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

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
