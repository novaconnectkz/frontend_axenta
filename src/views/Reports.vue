<template>
  <v-container fluid class="reports-container">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Отчетность</h1>
        <p class="text-body-1 text-medium-emphasis">
          Создание, планирование и управление отчетами
        </p>
      </div>
      <v-btn
        color="primary"
        size="large"
        prepend-icon="mdi-plus"
        @click="showReportBuilder = true"
      >
        Создать отчет
      </v-btn>
    </div>

    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="stats-card" color="primary" variant="tonal">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-h4 font-weight-bold">{{ stats?.total_reports || 0 }}</div>
                <div class="text-body-2 text-medium-emphasis">Всего отчетов</div>
              </div>
              <v-icon size="40" color="primary">mdi-file-chart</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3">
        <v-card class="stats-card" color="success" variant="tonal">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-h4 font-weight-bold">{{ stats?.reports_today || 0 }}</div>
                <div class="text-body-2 text-medium-emphasis">Сегодня</div>
              </div>
              <v-icon size="40" color="success">mdi-calendar-today</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3">
        <v-card class="stats-card" color="info" variant="tonal">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-h4 font-weight-bold">{{ stats?.scheduled_reports || 0 }}</div>
                <div class="text-body-2 text-medium-emphasis">Запланировано</div>
              </div>
              <v-icon size="40" color="info">mdi-clock-outline</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3">
        <v-card class="stats-card" color="error" variant="tonal">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-h4 font-weight-bold">{{ stats?.failed_reports || 0 }}</div>
                <div class="text-body-2 text-medium-emphasis">Ошибки</div>
              </div>
              <v-icon size="40" color="error">mdi-alert-circle-outline</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content -->
    <v-card>
      <v-tabs v-model="activeTab" class="border-b">
        <v-tab value="reports">
          <v-icon start>mdi-file-chart</v-icon>
          Отчеты
        </v-tab>
        <v-tab value="templates">
          <v-icon start>mdi-file-document-multiple</v-icon>
          Шаблоны
        </v-tab>
        <v-tab value="schedules">
          <v-icon start>mdi-calendar-clock</v-icon>
          Расписание
        </v-tab>
        <v-tab value="executions">
          <v-icon start>mdi-history</v-icon>
          История
        </v-tab>
      </v-tabs>

      <v-tabs-window v-model="activeTab">
        <!-- Reports Tab -->
        <v-tabs-window-item value="reports">
          <ReportsTab
            :reports="reports"
            :loading="reportsLoading"
            @refresh="loadReports"
          />
        </v-tabs-window-item>

        <!-- Templates Tab -->
        <v-tabs-window-item value="templates">
          <TemplatesTab
            :templates="templates"
            :loading="templatesLoading"
            @refresh="loadTemplates"
          />
        </v-tabs-window-item>

        <!-- Schedules Tab -->
        <v-tabs-window-item value="schedules">
          <SchedulesTab
            :schedules="schedules"
            :loading="schedulesLoading"
            @refresh="loadSchedules"
          />
        </v-tabs-window-item>

        <!-- Executions Tab -->
        <v-tabs-window-item value="executions">
          <ExecutionsTab
            :executions="executions"
            :loading="executionsLoading"
            @refresh="loadExecutions"
          />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card>

    <!-- Report Builder Dialog -->
    <ReportBuilder
      v-model="showReportBuilder"
      @created="onReportCreated"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { Report, ReportTemplate, ReportSchedule, ReportExecution, ReportStats } from '@/types/reports'
import reportsService from '@/services/reportsService'
import ReportBuilder from '@/components/Reports/ReportBuilder.vue'
import ReportsTab from '@/components/Reports/ReportsTab.vue'
import TemplatesTab from '@/components/Reports/TemplatesTab.vue'
import SchedulesTab from '@/components/Reports/SchedulesTab.vue'
import ExecutionsTab from '@/components/Reports/ExecutionsTab.vue'

// Data
const activeTab = ref('reports')
const stats = ref<ReportStats | null>(null)
const showReportBuilder = ref(false)

// Reports
const reports = ref<Report[]>([])
const reportsLoading = ref(false)

// Templates
const templates = ref<ReportTemplate[]>([])
const templatesLoading = ref(false)

// Schedules
const schedules = ref<ReportSchedule[]>([])
const schedulesLoading = ref(false)

// Executions
const executions = ref<ReportExecution[]>([])
const executionsLoading = ref(false)

// Methods
const loadStats = async () => {
  try {
    stats.value = await reportsService.getReportStats()
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error)
  }
}

const loadReports = async () => {
  reportsLoading.value = true
  try {
    const response = await reportsService.getReports()
    reports.value = response.reports
  } catch (error) {
    console.error('Ошибка загрузки отчетов:', error)
  } finally {
    reportsLoading.value = false
  }
}

const loadTemplates = async () => {
  templatesLoading.value = true
  try {
    const response = await reportsService.getReportTemplates()
    templates.value = response.templates
  } catch (error) {
    console.error('Ошибка загрузки шаблонов:', error)
  } finally {
    templatesLoading.value = false
  }
}

const loadSchedules = async () => {
  schedulesLoading.value = true
  try {
    const response = await reportsService.getReportSchedules()
    schedules.value = response.schedules
  } catch (error) {
    console.error('Ошибка загрузки расписаний:', error)
  } finally {
    schedulesLoading.value = false
  }
}

const loadExecutions = async () => {
  executionsLoading.value = true
  try {
    const response = await reportsService.getReportExecutions()
    executions.value = response.executions
  } catch (error) {
    console.error('Ошибка загрузки истории выполнения:', error)
  } finally {
    executionsLoading.value = false
  }
}

const onReportCreated = (report: Report) => {
  reports.value.unshift(report)
  loadStats()
}

// Watchers
watch(activeTab, (newTab) => {
  switch (newTab) {
    case 'reports':
      loadReports()
      break
    case 'templates':
      loadTemplates()
      break
    case 'schedules':
      loadSchedules()
      break
    case 'executions':
      loadExecutions()
      break
  }
})

// Lifecycle
onMounted(() => {
  loadStats()
  loadReports()
})
</script>

<style scoped>
.reports-container {
  max-width: 1400px;
  margin: 0 auto;
}

.stats-card {
  height: 100%;
}

.border-b {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>