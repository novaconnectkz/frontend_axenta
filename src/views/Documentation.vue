<template>
  <div class="documentation-page">
    <!-- Заголовок страницы -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <v-icon icon="mdi-book-open-variant" class="mr-3" />
          Документация и развертывание
        </h1>
        <p class="page-subtitle">
          Управление API документацией, пользовательскими руководствами и процессами развертывания
        </p>
      </div>

      <!-- Статистика -->
      <div class="stats-cards">
        <v-card class="stat-card" elevation="2">
          <v-card-text>
            <div class="stat-value">{{ stats.apiEndpoints.documented }}/{{ stats.apiEndpoints.total }}</div>
            <div class="stat-label">API Endpoints</div>
          </v-card-text>
        </v-card>

        <v-card class="stat-card" elevation="2">
          <v-card-text>
            <div class="stat-value">{{ stats.userDocs.published }}</div>
            <div class="stat-label">Документы</div>
          </v-card-text>
        </v-card>

        <v-card class="stat-card" elevation="2">
          <v-card-text>
            <div class="stat-value">{{ stats.deployments.successful }}/{{ stats.deployments.total }}</div>
            <div class="stat-label">Развертывания</div>
          </v-card-text>
        </v-card>

        <v-card class="stat-card" elevation="2">
          <v-card-text>
            <div class="stat-value">{{ stats.environments.healthy }}/{{ stats.environments.total }}</div>
            <div class="stat-label">Окружения</div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Основной контент -->
    <v-card class="main-content" elevation="2">
      <v-tabs v-model="activeTab" class="tabs-header">
        <v-tab value="api-docs">
          <v-icon icon="mdi-api" class="mr-2" />
          API Документация
        </v-tab>
        <v-tab value="user-docs">
          <v-icon icon="mdi-book-open-page-variant" class="mr-2" />
          Пользовательские документы
        </v-tab>
        <v-tab value="deployment">
          <v-icon icon="mdi-rocket-launch" class="mr-2" />
          Развертывание
        </v-tab>
        <v-tab value="cicd">
          <v-icon icon="mdi-source-branch" class="mr-2" />
          CI/CD Pipelines
        </v-tab>
        <v-tab value="health">
          <v-icon icon="mdi-heart-pulse" class="mr-2" />
          Мониторинг
        </v-tab>
      </v-tabs>

      <v-card-text class="tab-content">
        <!-- API Документация -->
        <div v-if="activeTab === 'api-docs'" class="tab-panel">
          <ApiDocumentationTab :documentation="apiDocumentation" :endpoints="apiEndpoints"
            @generate-swagger="handleGenerateSwagger" @refresh="loadApiDocumentation" />
        </div>

        <!-- Пользовательские документы -->
        <div v-if="activeTab === 'user-docs'" class="tab-panel">
          <UserDocumentationTab :documents="userDocuments" @create="handleCreateUserDoc" @update="handleUpdateUserDoc"
            @delete="handleDeleteUserDoc" @refresh="loadUserDocumentation" />
        </div>

        <!-- Развертывание -->
        <div v-if="activeTab === 'deployment'" class="tab-panel">
          <DeploymentTab :environments="deploymentEnvironments" :history="deploymentHistory"
            :scripts="deploymentScripts" @deploy="handleDeploy" @execute-script="handleExecuteScript"
            @refresh="loadDeploymentData" />
        </div>

        <!-- CI/CD Pipelines -->
        <div v-if="activeTab === 'cicd'" class="tab-panel">
          <CicdTab :pipelines="cicdPipelines" @run-pipeline="handleRunPipeline" @refresh="loadCicdData" />
        </div>

        <!-- Мониторинг -->
        <div v-if="activeTab === 'health'" class="tab-panel">
          <SystemHealthTab :health="systemHealth" @refresh="loadSystemHealth" />
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { documentationService } from '@/services/documentationService';
import type {
  ApiDocumentation,
  ApiEndpoint,
  CicdPipeline,
  DeploymentEnvironment,
  DeploymentHistory,
  DeploymentScript,
  DocumentationStats,
  SystemHealth,
  UserDocumentation
} from '@/types/documentation';
import { onMounted, ref } from 'vue';

// Импорт компонентов вкладок
import ApiDocumentationTab from '@/components/Documentation/ApiDocumentationTab.vue';
import CicdTab from '@/components/Documentation/CicdTab.vue';
import DeploymentTab from '@/components/Documentation/DeploymentTab.vue';
import SystemHealthTab from '@/components/Documentation/SystemHealthTab.vue';
import UserDocumentationTab from '@/components/Documentation/UserDocumentationTab.vue';

// Реактивные данные
const activeTab = ref('api-docs');
const loading = ref(false);

// Данные
const stats = ref<DocumentationStats>({
  apiEndpoints: { total: 0, documented: 0, deprecated: 0 },
  userDocs: { total: 0, published: 0, drafts: 0 },
  deployments: { total: 0, successful: 0, failed: 0, avgDuration: 0 },
  environments: { total: 0, active: 0, healthy: 0 }
});

const apiDocumentation = ref<ApiDocumentation[]>([]);
const apiEndpoints = ref<ApiEndpoint[]>([]);
const userDocuments = ref<UserDocumentation[]>([]);
const deploymentEnvironments = ref<DeploymentEnvironment[]>([]);
const deploymentHistory = ref<DeploymentHistory[]>([]);
const deploymentScripts = ref<DeploymentScript[]>([]);
const cicdPipelines = ref<CicdPipeline[]>([]);
const systemHealth = ref<SystemHealth | null>(null);

// Методы загрузки данных
const loadStats = async () => {
  try {
    stats.value = await documentationService.getDocumentationStats();
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
  }
};

const loadApiDocumentation = async () => {
  try {
    apiDocumentation.value = await documentationService.getApiDocumentation();
    apiEndpoints.value = await documentationService.getApiEndpoints();
  } catch (error) {
    console.error('Ошибка загрузки API документации:', error);
  }
};

const loadUserDocumentation = async () => {
  try {
    userDocuments.value = await documentationService.getUserDocumentation();
  } catch (error) {
    console.error('Ошибка загрузки пользовательской документации:', error);
  }
};

const loadDeploymentData = async () => {
  try {
    deploymentEnvironments.value = await documentationService.getDeploymentEnvironments();
    deploymentHistory.value = await documentationService.getDeploymentHistory();
    deploymentScripts.value = await documentationService.getDeploymentScripts();
  } catch (error) {
    console.error('Ошибка загрузки данных развертывания:', error);
  }
};

const loadCicdData = async () => {
  try {
    cicdPipelines.value = await documentationService.getCicdPipelines();
  } catch (error) {
    console.error('Ошибка загрузки CI/CD данных:', error);
  }
};

const loadSystemHealth = async () => {
  try {
    systemHealth.value = await documentationService.getSystemHealth();
  } catch (error) {
    console.error('Ошибка загрузки данных мониторинга:', error);
  }
};

const loadAllData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      loadStats(),
      loadApiDocumentation(),
      loadUserDocumentation(),
      loadDeploymentData(),
      loadCicdData(),
      loadSystemHealth()
    ]);
  } finally {
    loading.value = false;
  }
};

// Обработчики событий
const handleGenerateSwagger = async (docId: string) => {
  try {
    const swagger = await documentationService.generateSwaggerDoc(docId);
    console.log('Swagger документация сгенерирована:', swagger);
    // Здесь можно открыть модальное окно с Swagger UI
  } catch (error) {
    console.error('Ошибка генерации Swagger:', error);
  }
};

const handleCreateUserDoc = async (doc: Partial<UserDocumentation>) => {
  try {
    const newDoc = await documentationService.createUserDoc(doc);
    userDocuments.value.push(newDoc);
    await loadStats();
  } catch (error) {
    console.error('Ошибка создания документа:', error);
  }
};

const handleUpdateUserDoc = async (id: string, updates: Partial<UserDocumentation>) => {
  try {
    const updatedDoc = await documentationService.updateUserDoc(id, updates);
    const index = userDocuments.value.findIndex(doc => doc.id === id);
    if (index !== -1) {
      userDocuments.value[index] = updatedDoc;
    }
  } catch (error) {
    console.error('Ошибка обновления документа:', error);
  }
};

const handleDeleteUserDoc = async (id: string) => {
  try {
    userDocuments.value = userDocuments.value.filter(doc => doc.id !== id);
    await loadStats();
  } catch (error) {
    console.error('Ошибка удаления документа:', error);
  }
};

const handleDeploy = async (environmentId: string, version: string) => {
  try {
    const deployment = await documentationService.deployToEnvironment(environmentId, version);
    deploymentHistory.value.unshift(deployment);
    await loadDeploymentData();
    await loadStats();
  } catch (error) {
    console.error('Ошибка развертывания:', error);
  }
};

const handleExecuteScript = async (scriptId: string) => {
  try {
    const result = await documentationService.executeScript(scriptId);
    console.log('Скрипт выполнен:', result);
  } catch (error) {
    console.error('Ошибка выполнения скрипта:', error);
  }
};

const handleRunPipeline = async (pipelineId: string) => {
  try {
    const pipeline = await documentationService.runPipeline(pipelineId);
    const index = cicdPipelines.value.findIndex(p => p.id === pipelineId);
    if (index !== -1) {
      cicdPipelines.value[index] = pipeline;
    }
  } catch (error) {
    console.error('Ошибка запуска pipeline:', error);
  }
};

// Инициализация
onMounted(() => {
  loadAllData();
});
</script>

<style scoped>
.documentation-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  margin-bottom: 24px;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: var(--v-theme-primary);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.page-subtitle {
  font-size: 1.1rem;
  color: var(--v-theme-on-surface-variant);
  margin: 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
  background: linear-gradient(135deg, var(--v-theme-surface) 0%, var(--v-theme-surface-variant) 100%);
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--v-theme-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--v-theme-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.main-content {
  background: var(--v-theme-surface);
  border-radius: 12px;
  overflow: hidden;
}

.tabs-header {
  background: var(--v-theme-surface-variant);
  border-bottom: 1px solid var(--v-theme-outline-variant);
}

.tab-content {
  padding: 24px;
  min-height: 600px;
}

.tab-panel {
  height: 100%;
}

/* Темная тема */
.v-theme--dark .stat-card {
  background: linear-gradient(135deg, var(--v-theme-surface-bright) 0%, var(--v-theme-surface-variant) 100%);
}

/* Адаптивность */
@media (max-width: 768px) {
  .documentation-page {
    padding: 16px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .tab-content {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }

  .page-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
