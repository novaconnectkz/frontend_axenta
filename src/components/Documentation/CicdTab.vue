<template>
  <div class="cicd-tab">
    <!-- Заголовок и действия -->
    <div class="tab-header">
      <div class="header-info">
        <h3>CI/CD Pipelines</h3>
        <p>Управление процессами непрерывной интеграции и развертывания</p>
      </div>
      <div class="header-actions">
        <v-btn color="primary" variant="elevated" @click="runAllPipelines" :loading="runningAll">
          <v-icon icon="mdi-play-circle" class="mr-2" />
          Запустить все
        </v-btn>
        <v-btn color="secondary" variant="outlined" @click="$emit('refresh')">
          <v-icon icon="mdi-refresh" class="mr-2" />
          Обновить
        </v-btn>
      </div>
    </div>

    <!-- Список пайплайнов -->
    <div class="pipelines-section">
      <v-row>
        <v-col v-for="pipeline in pipelines" :key="pipeline.id" cols="12" lg="6">
          <v-card class="pipeline-card" elevation="2" :class="getPipelineCardClass(pipeline.status)">
            <v-card-title class="d-flex align-center">
              <v-icon :icon="getPipelineIcon(pipeline.status)" :color="getPipelineColor(pipeline.status)"
                class="mr-2" />
              {{ pipeline.name }}
              <v-spacer />
              <v-chip :color="getPipelineColor(pipeline.status)" size="small" variant="elevated">
                <v-icon :icon="getPipelineStatusIcon(pipeline.status)" size="small" class="mr-1" />
                {{ getPipelineStatusText(pipeline.status) }}
              </v-chip>
            </v-card-title>

            <v-card-text>
              <div class="pipeline-info">
                <div class="info-row">
                  <span class="info-label">Репозиторий:</span>
                  <code class="info-value">{{ pipeline.repository }}</code>
                </div>
                <div class="info-row">
                  <span class="info-label">Ветка:</span>
                  <code class="info-value">{{ pipeline.branch }}</code>
                </div>
                <div class="info-row">
                  <span class="info-label">Триггер:</span>
                  <v-chip size="small" variant="outlined" :color="getTriggerColor(pipeline.trigger)">
                    {{ getTriggerText(pipeline.trigger) }}
                  </v-chip>
                </div>
                <div class="info-row">
                  <span class="info-label">Окружение:</span>
                  <span class="info-value">{{ pipeline.environment }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Последний запуск:</span>
                  <span class="info-value">{{ formatDate(pipeline.lastRun) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Длительность:</span>
                  <span class="info-value">{{ formatDuration(pipeline.duration) }}</span>
                </div>
              </div>

              <!-- Этапы пайплайна -->
              <div class="stages-section">
                <h5>Этапы выполнения</h5>
                <div class="stages-list">
                  <div v-for="(stage, index) in pipeline.stages" :key="stage.name" class="stage-item"
                    :class="getStageClass(stage.status)">
                    <div class="stage-header">
                      <div class="stage-info">
                        <v-icon :icon="getStageIcon(stage.status)" :color="getStageColor(stage.status)" size="small"
                          class="mr-2" />
                        <span class="stage-name">{{ stage.name }}</span>
                      </div>
                      <div class="stage-meta">
                        <span v-if="stage.duration" class="stage-duration">
                          {{ formatDuration(stage.duration) }}
                        </span>
                        <v-chip :color="getStageColor(stage.status)" size="x-small" variant="elevated">
                          {{ getStageStatusText(stage.status) }}
                        </v-chip>
                      </div>
                    </div>

                    <!-- Прогресс бар для текущего этапа -->
                    <v-progress-linear v-if="stage.status === 'running'" indeterminate color="primary" height="3"
                      class="stage-progress" />

                    <!-- Соединительная линия -->
                    <div v-if="index < pipeline.stages.length - 1" class="stage-connector"
                      :class="{ 'connector-active': stage.status === 'success' }" />
                  </div>
                </div>
              </div>
            </v-card-text>

            <v-card-actions>
              <v-btn size="small" color="primary" variant="outlined" @click="runPipeline(pipeline)"
                :disabled="pipeline.status === 'running'" :loading="runningPipelines.includes(pipeline.id)">
                <v-icon icon="mdi-play" class="mr-1" />
                Запустить
              </v-btn>
              <v-btn size="small" variant="text" @click="viewPipelineLogs(pipeline)">
                <v-icon icon="mdi-text-box" class="mr-1" />
                Логи
              </v-btn>
              <v-btn size="small" variant="text" @click="viewPipelineConfig(pipeline)">
                <v-icon icon="mdi-cog" class="mr-1" />
                Настройки
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Диалог логов пайплайна -->
    <v-dialog v-model="logsDialog" max-width="1000px">
      <v-card v-if="selectedPipeline">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-text-box" class="mr-2" />
          Логи пайплайна: {{ selectedPipeline.name }}
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="logsDialog = false" />
        </v-card-title>

        <v-card-text>
          <v-tabs v-model="selectedStageTab" class="stage-tabs">
            <v-tab v-for="stage in selectedPipeline.stages" :key="stage.name" :value="stage.name">
              <v-icon :icon="getStageIcon(stage.status)" :color="getStageColor(stage.status)" size="small"
                class="mr-2" />
              {{ stage.name }}
            </v-tab>
          </v-tabs>

          <div class="stage-logs">
            <div v-for="stage in selectedPipeline.stages" :key="stage.name" v-show="selectedStageTab === stage.name"
              class="logs-container">
              <div v-for="(log, index) in stage.logs" :key="index" class="log-entry">
                {{ log }}
              </div>
              <div v-if="!stage.logs.length" class="no-logs">
                Логи отсутствуют
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Диалог настроек пайплайна -->
    <v-dialog v-model="configDialog" max-width="800px">
      <v-card v-if="selectedPipeline">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-cog" class="mr-2" />
          Настройки пайплайна: {{ selectedPipeline.name }}
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="configDialog = false" />
        </v-card-title>

        <v-card-text>
          <v-form ref="configForm" v-model="configFormValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="pipelineConfig.name" label="Название пайплайна" variant="outlined"
                  :rules="[v => !!v || 'Название обязательно']" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="pipelineConfig.repository" label="Репозиторий" variant="outlined"
                  :rules="[v => !!v || 'Репозиторий обязателен']" required />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="pipelineConfig.branch" label="Ветка" variant="outlined"
                  :rules="[v => !!v || 'Ветка обязательна']" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="pipelineConfig.trigger" :items="triggerOptions" label="Триггер" variant="outlined"
                  :rules="[v => !!v || 'Триггер обязателен']" required />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-text-field v-model="pipelineConfig.environment" label="Окружение" variant="outlined"
                  :rules="[v => !!v || 'Окружение обязательно']" required />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <h6>Этапы пайплайна</h6>
                <div class="stages-config">
                  <div v-for="(stage, index) in pipelineConfig.stages" :key="index" class="stage-config-item">
                    <v-text-field v-model="stage.name" :label="`Этап ${index + 1}`" variant="outlined" density="compact"
                      class="stage-name-field" />
                    <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="removeStage(index)" />
                  </div>
                  <v-btn color="primary" variant="outlined" @click="addStage" class="add-stage-btn">
                    <v-icon icon="mdi-plus" class="mr-2" />
                    Добавить этап
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="error" variant="outlined" @click="configDialog = false">
            Отмена
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="savePipelineConfig" :disabled="!configFormValid"
            :loading="savingConfig">
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import type { CicdPipeline } from '@/types/documentation';
import { reactive, ref } from 'vue';

// Props
interface Props {
  pipelines: CicdPipeline[];
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'run-pipeline': [pipelineId: string];
  refresh: [];
}>();

// Реактивные данные
const runningAll = ref(false);
const runningPipelines = ref<string[]>([]);
const logsDialog = ref(false);
const configDialog = ref(false);
const selectedPipeline = ref<CicdPipeline | null>(null);
const selectedStageTab = ref('');
const configFormValid = ref(false);
const savingConfig = ref(false);

// Конфигурация пайплайна
const pipelineConfig = reactive({
  name: '',
  repository: '',
  branch: '',
  trigger: 'push' as CicdPipeline['trigger'],
  environment: '',
  stages: [] as { name: string }[]
});

// Константы
const triggerOptions = [
  { title: 'Push', value: 'push' },
  { title: 'Pull Request', value: 'pull_request' },
  { title: 'По расписанию', value: 'schedule' },
  { title: 'Вручную', value: 'manual' }
];

// Методы
const getPipelineIcon = (status: string) => {
  const icons: Record<string, string> = {
    idle: 'mdi-pause-circle',
    running: 'mdi-loading',
    success: 'mdi-check-circle',
    failed: 'mdi-close-circle'
  };
  return icons[status] || 'mdi-help-circle';
};

const getPipelineColor = (status: string) => {
  const colors: Record<string, string> = {
    idle: 'default',
    running: 'warning',
    success: 'success',
    failed: 'error'
  };
  return colors[status] || 'default';
};

const getPipelineCardClass = (status: string) => {
  return {
    'pipeline-idle': status === 'idle',
    'pipeline-running': status === 'running',
    'pipeline-success': status === 'success',
    'pipeline-failed': status === 'failed'
  };
};

const getPipelineStatusIcon = (status: string) => {
  const icons: Record<string, string> = {
    idle: 'mdi-pause',
    running: 'mdi-loading',
    success: 'mdi-check',
    failed: 'mdi-close'
  };
  return icons[status] || 'mdi-help';
};

const getPipelineStatusText = (status: string) => {
  const texts: Record<string, string> = {
    idle: 'Ожидание',
    running: 'Выполняется',
    success: 'Успешно',
    failed: 'Ошибка'
  };
  return texts[status] || status;
};

const getTriggerColor = (trigger: string) => {
  const colors: Record<string, string> = {
    push: 'primary',
    pull_request: 'info',
    schedule: 'warning',
    manual: 'secondary'
  };
  return colors[trigger] || 'default';
};

const getTriggerText = (trigger: string) => {
  const texts: Record<string, string> = {
    push: 'Push',
    pull_request: 'Pull Request',
    schedule: 'Расписание',
    manual: 'Вручную'
  };
  return texts[trigger] || trigger;
};

const getStageIcon = (status: string) => {
  const icons: Record<string, string> = {
    pending: 'mdi-clock',
    running: 'mdi-loading',
    success: 'mdi-check',
    failed: 'mdi-close',
    skipped: 'mdi-skip-next'
  };
  return icons[status] || 'mdi-help';
};

const getStageColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'default',
    running: 'primary',
    success: 'success',
    failed: 'error',
    skipped: 'warning'
  };
  return colors[status] || 'default';
};

const getStageClass = (status: string) => {
  return {
    'stage-pending': status === 'pending',
    'stage-running': status === 'running',
    'stage-success': status === 'success',
    'stage-failed': status === 'failed',
    'stage-skipped': status === 'skipped'
  };
};

const getStageStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: 'Ожидание',
    running: 'Выполняется',
    success: 'Успешно',
    failed: 'Ошибка',
    skipped: 'Пропущен'
  };
  return texts[status] || status;
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

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}м ${remainingSeconds}с`;
};

const runPipeline = async (pipeline: CicdPipeline) => {
  runningPipelines.value.push(pipeline.id);
  try {
    emit('run-pipeline', pipeline.id);
  } finally {
    runningPipelines.value = runningPipelines.value.filter(id => id !== pipeline.id);
  }
};

const runAllPipelines = async () => {
  runningAll.value = true;
  try {
    for (const pipeline of props.pipelines) {
      if (pipeline.status !== 'running') {
        emit('run-pipeline', pipeline.id);
      }
    }
  } finally {
    runningAll.value = false;
  }
};

const viewPipelineLogs = (pipeline: CicdPipeline) => {
  selectedPipeline.value = pipeline;
  selectedStageTab.value = pipeline.stages[0]?.name || '';
  logsDialog.value = true;
};

const viewPipelineConfig = (pipeline: CicdPipeline) => {
  selectedPipeline.value = pipeline;
  pipelineConfig.name = pipeline.name;
  pipelineConfig.repository = pipeline.repository;
  pipelineConfig.branch = pipeline.branch;
  pipelineConfig.trigger = pipeline.trigger;
  pipelineConfig.environment = pipeline.environment;
  pipelineConfig.stages = pipeline.stages.map(stage => ({ name: stage.name }));
  configDialog.value = true;
};

const addStage = () => {
  pipelineConfig.stages.push({ name: '' });
};

const removeStage = (index: number) => {
  pipelineConfig.stages.splice(index, 1);
};

const savePipelineConfig = async () => {
  savingConfig.value = true;
  try {
    // Здесь будет сохранение конфигурации
    console.log('Сохранение конфигурации пайплайна:', pipelineConfig);
    configDialog.value = false;
  } finally {
    savingConfig.value = false;
  }
};
</script>

<style scoped>
.cicd-tab {
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

.pipeline-card {
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.pipeline-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.pipeline-idle {
  border-left: 4px solid var(--v-theme-surface-variant);
}

.pipeline-running {
  border-left: 4px solid var(--v-theme-warning);
}

.pipeline-success {
  border-left: 4px solid var(--v-theme-success);
}

.pipeline-failed {
  border-left: 4px solid var(--v-theme-error);
}

.pipeline-info {
  margin-bottom: 20px;
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

.stages-section h5 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--v-theme-primary);
  margin-bottom: 16px;
}

.stages-list {
  position: relative;
}

.stage-item {
  position: relative;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: var(--v-theme-surface-variant);
  transition: all 0.2s ease;
}

.stage-pending {
  background: var(--v-theme-surface-variant);
}

.stage-running {
  background: linear-gradient(135deg, var(--v-theme-primary-lighten-4) 0%, var(--v-theme-primary-lighten-5) 100%);
  border: 1px solid var(--v-theme-primary);
}

.stage-success {
  background: linear-gradient(135deg, var(--v-theme-success-lighten-4) 0%, var(--v-theme-success-lighten-5) 100%);
  border: 1px solid var(--v-theme-success);
}

.stage-failed {
  background: linear-gradient(135deg, var(--v-theme-error-lighten-4) 0%, var(--v-theme-error-lighten-5) 100%);
  border: 1px solid var(--v-theme-error);
}

.stage-skipped {
  background: linear-gradient(135deg, var(--v-theme-warning-lighten-4) 0%, var(--v-theme-warning-lighten-5) 100%);
  border: 1px solid var(--v-theme-warning);
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stage-info {
  display: flex;
  align-items: center;
}

.stage-name {
  font-weight: 500;
}

.stage-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stage-duration {
  font-size: 0.85rem;
  color: var(--v-theme-on-surface-variant);
}

.stage-progress {
  margin-top: 8px;
}

.stage-connector {
  position: absolute;
  left: 50%;
  bottom: -12px;
  width: 2px;
  height: 16px;
  background: var(--v-theme-outline-variant);
  transform: translateX(-50%);
}

.connector-active {
  background: var(--v-theme-success);
}

.stage-tabs {
  margin-bottom: 16px;
}

.logs-container {
  max-height: 400px;
  overflow-y: auto;
  background: var(--v-theme-surface-variant);
  border-radius: 8px;
  padding: 16px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.log-entry {
  margin-bottom: 4px;
  padding: 2px 0;
  color: var(--v-theme-on-surface);
}

.no-logs {
  text-align: center;
  color: var(--v-theme-on-surface-variant);
  font-style: italic;
  padding: 20px;
}

.stages-config {
  border: 1px solid var(--v-theme-outline-variant);
  border-radius: 8px;
  padding: 16px;
  background: var(--v-theme-surface-variant);
}

.stage-config-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.stage-name-field {
  flex: 1;
}

.add-stage-btn {
  width: 100%;
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

  .stage-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .stage-meta {
    align-self: flex-end;
  }
}
</style>
