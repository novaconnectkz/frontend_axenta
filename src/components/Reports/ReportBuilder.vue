<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="1000"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-3" color="primary">mdi-file-chart-outline</v-icon>
        <span class="text-h5">Конструктор отчетов</span>
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="closeDialog"
        />
      </v-card-title>

      <v-card-text>
        <v-stepper
          v-model="currentStep"
          :items="steps"
          hide-actions
          class="elevation-0"
        >
          <!-- Step 1: Report Type -->
          <template #item.1>
            <div class="pa-4">
              <h3 class="text-h6 mb-4">Выберите тип отчета</h3>
              <v-row>
                <v-col
                  v-for="(config, type) in reportTypeConfigs"
                  :key="type"
                  cols="12"
                  md="6"
                  lg="4"
                >
                  <v-card
                    :class="{ 'report-type-selected': form.type === type }"
                    :color="form.type === type ? config.color : undefined"
                    :variant="form.type === type ? 'tonal' : 'outlined'"
                    hover
                    @click="selectReportType(type)"
                  >
                    <v-card-text class="text-center pa-4">
                      <v-icon
                        :color="form.type === type ? config.color : 'grey'"
                        size="48"
                        class="mb-3"
                      >
                        {{ config.icon }}
                      </v-icon>
                      <div class="text-h6 mb-2">{{ config.label }}</div>
                      <div class="text-body-2 text-medium-emphasis">
                        {{ config.description }}
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </template>

          <!-- Step 2: Parameters -->
          <template #item.2>
            <div class="pa-4">
              <h3 class="text-h6 mb-4">Настройка параметров</h3>
              
              <v-row>
                <!-- Basic Info -->
                <v-col cols="12">
                  <v-text-field
                    v-model="form.name"
                    label="Название отчета"
                    variant="outlined"
                    :rules="[v => !!v || 'Название обязательно']"
                    required
                  />
                </v-col>
                
                <v-col cols="12">
                  <v-textarea
                    v-model="form.description"
                    label="Описание"
                    variant="outlined"
                    rows="2"
                  />
                </v-col>

                <!-- Date Range -->
                <v-col cols="12" md="6">
                  <v-select
                    v-model="form.parameters.period"
                    label="Период"
                    :items="periodItems"
                    variant="outlined"
                    @update:model-value="onPeriodChange"
                  />
                </v-col>

                <v-col cols="12" md="3">
                  <v-text-field
                    v-model="form.parameters.date_from"
                    label="Дата с"
                    type="date"
                    variant="outlined"
                    :disabled="form.parameters.period !== 'custom'"
                  />
                </v-col>

                <v-col cols="12" md="3">
                  <v-text-field
                    v-model="form.parameters.date_to"
                    label="Дата по"
                    type="date"
                    variant="outlined"
                    :disabled="form.parameters.period !== 'custom'"
                  />
                </v-col>

                <!-- Filters -->
                <v-col cols="12" md="6" v-if="availableParameters.includes('location_ids')">
                  <v-select
                    v-model="form.parameters.location_ids"
                    label="Локации"
                    :items="locationItems"
                    variant="outlined"
                    multiple
                    chips
                    closable-chips
                  />
                </v-col>

                <v-col cols="12" md="6" v-if="availableParameters.includes('user_ids')">
                  <v-select
                    v-model="form.parameters.user_ids"
                    label="Пользователи"
                    :items="userItems"
                    variant="outlined"
                    multiple
                    chips
                    closable-chips
                  />
                </v-col>

                <v-col cols="12" md="6" v-if="availableParameters.includes('installer_ids')">
                  <v-select
                    v-model="form.parameters.installer_ids"
                    label="Монтажники"
                    :items="installerItems"
                    variant="outlined"
                    multiple
                    chips
                    closable-chips
                  />
                </v-col>

                <v-col cols="12" md="6" v-if="availableParameters.includes('equipment_categories')">
                  <v-select
                    v-model="form.parameters.equipment_categories"
                    label="Категории оборудования"
                    :items="equipmentCategoryItems"
                    variant="outlined"
                    multiple
                    chips
                    closable-chips
                  />
                </v-col>

                <!-- Options -->
                <v-col cols="12" md="6">
                  <v-select
                    v-model="form.parameters.group_by"
                    label="Группировка"
                    :items="groupByItems"
                    variant="outlined"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="form.parameters.sort_order"
                    label="Сортировка"
                    :items="sortOrderItems"
                    variant="outlined"
                  />
                </v-col>

                <!-- Checkboxes -->
                <v-col cols="12">
                  <div class="d-flex flex-wrap gap-4">
                    <v-checkbox
                      v-if="availableParameters.includes('include_inactive')"
                      v-model="form.parameters.include_inactive"
                      label="Включить неактивные"
                      density="compact"
                    />
                    <v-checkbox
                      v-if="availableParameters.includes('include_charts')"
                      v-model="form.parameters.include_charts"
                      label="Включить графики"
                      density="compact"
                    />
                    <v-checkbox
                      v-if="availableParameters.includes('include_summary')"
                      v-model="form.parameters.include_summary"
                      label="Включить сводку"
                      density="compact"
                    />
                  </div>
                </v-col>
              </v-row>
            </div>
          </template>

          <!-- Step 3: Format -->
          <template #item.3>
            <div class="pa-4">
              <h3 class="text-h6 mb-4">Выберите формат экспорта</h3>
              <v-row>
                <v-col
                  v-for="(config, format) in reportFormatConfigs"
                  :key="format"
                  cols="12"
                  sm="6"
                  md="3"
                >
                  <v-card
                    :class="{ 'format-selected': form.format === format }"
                    :color="form.format === format ? 'primary' : undefined"
                    :variant="form.format === format ? 'tonal' : 'outlined'"
                    hover
                    @click="selectFormat(format)"
                  >
                    <v-card-text class="text-center pa-4">
                      <v-icon
                        :color="form.format === format ? 'primary' : 'grey'"
                        size="36"
                        class="mb-2"
                      >
                        {{ getFormatIcon(format) }}
                      </v-icon>
                      <div class="text-h6 mb-1">{{ config.label }}</div>
                      <div class="text-caption text-medium-emphasis">
                        .{{ config.extension }}
                      </div>
                      <div class="text-caption text-medium-emphasis mt-1">
                        <span v-if="config.supports_charts">📊 Графики</span>
                        <span v-if="config.max_rows"> | {{ config.max_rows.toLocaleString() }} строк</span>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </template>

          <!-- Step 4: Preview -->
          <template #item.4>
            <div class="pa-4">
              <h3 class="text-h6 mb-4">Предварительный просмотр</h3>
              
              <div v-if="previewLoading" class="text-center py-8">
                <v-progress-circular indeterminate color="primary" size="64" />
                <div class="mt-4 text-body-1">Генерация предварительного просмотра...</div>
              </div>

              <div v-else-if="previewData">
                <!-- Summary -->
                <v-card v-if="previewData.summary" class="mb-4" variant="outlined">
                  <v-card-title class="text-h6">Сводка</v-card-title>
                  <v-card-text>
                    <v-row>
                      <v-col cols="6" sm="4" md="3">
                        <div class="text-h4 text-primary">{{ previewData.summary.total_count }}</div>
                        <div class="text-body-2 text-medium-emphasis">Всего записей</div>
                      </v-col>
                      <v-col v-if="previewData.summary.active_count" cols="6" sm="4" md="3">
                        <div class="text-h4 text-success">{{ previewData.summary.active_count }}</div>
                        <div class="text-body-2 text-medium-emphasis">Активные</div>
                      </v-col>
                      <v-col v-if="previewData.summary.total_amount" cols="6" sm="4" md="3">
                        <div class="text-h4 text-info">{{ previewData.summary.total_amount.toLocaleString() }} ₽</div>
                        <div class="text-body-2 text-medium-emphasis">Общая сумма</div>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>

                <!-- Data Preview -->
                <v-card variant="outlined">
                  <v-card-title class="text-h6">Данные (первые 10 записей)</v-card-title>
                  <v-card-text>
                    <v-table density="compact">
                      <thead>
                        <tr>
                          <th v-for="header in previewData.headers" :key="header">
                            {{ header }}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(row, index) in previewData.rows" :key="index">
                          <td v-for="(cell, cellIndex) in row" :key="cellIndex">
                            {{ cell }}
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-card-text>
                </v-card>
              </div>

              <div v-else class="text-center py-8">
                <v-btn
                  color="primary"
                  size="large"
                  prepend-icon="mdi-eye"
                  @click="generatePreview"
                >
                  Создать предварительный просмотр
                </v-btn>
              </div>
            </div>
          </template>
        </v-stepper>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-btn
          v-if="currentStep > 1"
          variant="outlined"
          @click="currentStep--"
        >
          Назад
        </v-btn>
        
        <v-spacer />
        
        <v-btn
          v-if="currentStep < steps.length"
          color="primary"
          :disabled="!canProceed"
          @click="nextStep"
        >
          Далее
        </v-btn>
        
        <v-btn
          v-else
          color="primary"
          :loading="creating"
          @click="createReport"
        >
          Создать отчет
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ReportFormData, ReportData, Report } from '@/types/reports'
import reportsService from '@/services/reportsService'

// Props & Emits
interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'created', report: Report): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Data
const currentStep = ref(1)
const creating = ref(false)
const previewLoading = ref(false)
const previewData = ref<ReportData | null>(null)

const steps = [
  { title: 'Тип отчета', value: 1 },
  { title: 'Параметры', value: 2 },
  { title: 'Формат', value: 3 },
  { title: 'Просмотр', value: 4 }
]

const form = ref<ReportFormData>({
  name: '',
  description: '',
  type: 'objects',
  format: 'excel',
  parameters: {
    period: 'this_month',
    include_charts: true,
    include_summary: true,
    sort_order: 'desc'
  }
})

// Computed
const reportTypeConfigs = computed(() => reportsService.getReportTypeConfigs())
const reportFormatConfigs = computed(() => reportsService.getReportFormatConfigs())

const availableParameters = computed(() => {
  if (!form.value.type) return []
  return reportTypeConfigs.value[form.value.type]?.available_parameters || []
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return !!form.value.type
    case 2:
      return !!form.value.name.trim()
    case 3:
      return !!form.value.format
    default:
      return true
  }
})

// Static data for demo
const periodItems = [
  { title: 'Сегодня', value: 'today' },
  { title: 'Вчера', value: 'yesterday' },
  { title: 'Эта неделя', value: 'this_week' },
  { title: 'Прошлая неделя', value: 'last_week' },
  { title: 'Этот месяц', value: 'this_month' },
  { title: 'Прошлый месяц', value: 'last_month' },
  { title: 'Этот квартал', value: 'this_quarter' },
  { title: 'Прошлый квартал', value: 'last_quarter' },
  { title: 'Этот год', value: 'this_year' },
  { title: 'Прошлый год', value: 'last_year' },
  { title: 'Произвольный период', value: 'custom' }
]

const groupByItems = [
  { title: 'По дате', value: 'date' },
  { title: 'По неделям', value: 'week' },
  { title: 'По месяцам', value: 'month' },
  { title: 'По локации', value: 'location' },
  { title: 'По пользователю', value: 'user' },
  { title: 'По статусу', value: 'status' },
  { title: 'По категории', value: 'category' }
]

const sortOrderItems = [
  { title: 'По возрастанию', value: 'asc' },
  { title: 'По убыванию', value: 'desc' }
]

const locationItems = [
  { title: 'Москва', value: 'moscow' },
  { title: 'СПб', value: 'spb' },
  { title: 'Екатеринбург', value: 'ekb' }
]

const userItems = [
  { title: 'Иванов И.И.', value: 'user1' },
  { title: 'Петров П.П.', value: 'user2' },
  { title: 'Сидоров С.С.', value: 'user3' }
]

const installerItems = [
  { title: 'Монтажник 1', value: 'inst1' },
  { title: 'Монтажник 2', value: 'inst2' },
  { title: 'Монтажник 3', value: 'inst3' }
]

const equipmentCategoryItems = [
  { title: 'GPS трекеры', value: 'trackers' },
  { title: 'Датчики', value: 'sensors' },
  { title: 'Контроллеры', value: 'controllers' }
]

// Methods
const selectReportType = (type: string) => {
  form.value.type = type
  form.value.format = reportTypeConfigs.value[type]?.default_format || 'excel'
}

const selectFormat = (format: string) => {
  form.value.format = format
}

const nextStep = () => {
  if (canProceed.value && currentStep.value < steps.length) {
    currentStep.value++
  }
}

const onPeriodChange = (period: string) => {
  if (period !== 'custom') {
    const today = new Date()
    const formatDate = (date: Date) => date.toISOString().split('T')[0]
    
    switch (period) {
      case 'today':
        form.value.parameters.date_from = formatDate(today)
        form.value.parameters.date_to = formatDate(today)
        break
      case 'this_month':
        form.value.parameters.date_from = formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
        form.value.parameters.date_to = formatDate(today)
        break
      // Add more period calculations as needed
    }
  }
}

const generatePreview = async () => {
  previewLoading.value = true
  try {
    previewData.value = await reportsService.generateReportPreview(form.value)
  } catch (error) {
    console.error('Ошибка генерации предварительного просмотра:', error)
  } finally {
    previewLoading.value = false
  }
}

const createReport = async () => {
  creating.value = true
  try {
    const report = await reportsService.createReport(form.value)
    emit('created', report)
    closeDialog()
  } catch (error) {
    console.error('Ошибка создания отчета:', error)
  } finally {
    creating.value = false
  }
}

const closeDialog = () => {
  emit('update:modelValue', false)
  // Reset form
  setTimeout(() => {
    currentStep.value = 1
    previewData.value = null
    form.value = {
      name: '',
      description: '',
      type: 'objects',
      format: 'excel',
      parameters: {
        period: 'this_month',
        include_charts: true,
        include_summary: true,
        sort_order: 'desc'
      }
    }
  }, 300)
}

const getFormatIcon = (format: string) => {
  switch (format) {
    case 'csv': return 'mdi-file-delimited'
    case 'excel': return 'mdi-file-excel'
    case 'pdf': return 'mdi-file-pdf-box'
    case 'json': return 'mdi-code-json'
    default: return 'mdi-file'
  }
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    currentStep.value = 1
    previewData.value = null
  }
})
</script>

<style scoped>
.report-type-selected {
  transform: scale(1.02);
}

.format-selected {
  transform: scale(1.02);
}
</style>
