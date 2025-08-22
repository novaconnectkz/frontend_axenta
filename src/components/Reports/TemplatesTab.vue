<template>
  <div class="pa-4">
    <div class="d-flex justify-space-between align-center mb-4">
      <v-text-field
        v-model="search"
        label="Поиск шаблонов"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        style="max-width: 300px;"
      />
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="showCreateDialog = true"
      >
        Создать шаблон
      </v-btn>
    </div>

    <!-- Templates Grid -->
    <v-row>
      <v-col
        v-for="template in filteredTemplates"
        :key="template.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card class="template-card" hover>
          <v-card-text>
            <div class="d-flex align-center mb-3">
              <v-icon
                :color="getReportTypeConfig(template.type).color"
                size="24"
                class="mr-3"
              >
                {{ getReportTypeConfig(template.type).icon }}
              </v-icon>
              <div class="flex-grow-1">
                <div class="text-h6">{{ template.name }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ getReportTypeConfig(template.type).label }}
                </div>
              </div>
              <v-chip
                v-if="template.is_system"
                size="x-small"
                color="primary"
                variant="tonal"
              >
                Системный
              </v-chip>
            </div>
            
            <p class="text-body-2 text-medium-emphasis mb-3">
              {{ template.description }}
            </p>
            
            <div class="d-flex align-center justify-space-between">
              <div class="text-caption text-medium-emphasis">
                Использований: {{ template.usage_count }}
              </div>
              <div>
                <v-btn
                  icon="mdi-play"
                  size="small"
                  variant="text"
                  color="primary"
                  @click="runTemplate(template)"
                />
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  :disabled="template.is_system"
                  @click="editTemplate(template)"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  :disabled="template.is_system"
                  @click="deleteTemplate(template)"
                />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <div v-if="filteredTemplates.length === 0 && !loading" class="text-center py-8">
      <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-file-document-multiple-outline</v-icon>
      <h3 class="text-h6 text-medium-emphasis mb-2">Шаблоны не найдены</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Создайте первый шаблон отчета для быстрого создания отчетов с предустановленными параметрами.
      </p>
      <v-btn color="primary" @click="showCreateDialog = true">
        Создать шаблон
      </v-btn>
    </div>

    <!-- Create Template Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="800">
      <v-card>
        <v-card-title>
          <span class="text-h5">Создать шаблон отчета</span>
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Шаблоны позволяют быстро создавать отчеты с предустановленными параметрами.
          </p>
          
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="templateForm.name"
                label="Название шаблона"
                variant="outlined"
                required
              />
            </v-col>
            
            <v-col cols="12">
              <v-textarea
                v-model="templateForm.description"
                label="Описание"
                variant="outlined"
                rows="3"
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="templateForm.type"
                label="Тип отчета"
                :items="reportTypeItems"
                variant="outlined"
                required
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="templateForm.default_parameters.period"
                label="Период по умолчанию"
                :items="periodItems"
                variant="outlined"
              />
            </v-col>
            
            <v-col cols="12">
              <div class="d-flex flex-wrap gap-4">
                <v-checkbox
                  v-model="templateForm.default_parameters.include_charts"
                  label="Включить графики"
                  density="compact"
                />
                <v-checkbox
                  v-model="templateForm.default_parameters.include_summary"
                  label="Включить сводку"
                  density="compact"
                />
                <v-checkbox
                  v-model="templateForm.is_system"
                  label="Системный шаблон"
                  density="compact"
                />
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showCreateDialog = false">Отмена</v-btn>
          <v-btn
            color="primary"
            :loading="creating"
            @click="createTemplate"
          >
            Создать
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ReportTemplate, ReportTemplateFormData } from '@/types/reports'
import reportsService from '@/services/reportsService'

// Props
interface Props {
  templates: ReportTemplate[]
  loading: boolean
}

interface Emits {
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Data
const search = ref('')
const showCreateDialog = ref(false)
const creating = ref(false)

const templateForm = ref<ReportTemplateFormData>({
  name: '',
  description: '',
  type: 'objects',
  default_parameters: {
    period: 'this_month',
    include_charts: true,
    include_summary: true
  },
  is_system: false
})

// Computed
const reportTypeConfigs = computed(() => reportsService.getReportTypeConfigs())

const reportTypeItems = computed(() => 
  Object.entries(reportTypeConfigs.value).map(([value, config]) => ({
    title: config.label,
    value
  }))
)

const periodItems = computed(() => [
  { title: 'Сегодня', value: 'today' },
  { title: 'Вчера', value: 'yesterday' },
  { title: 'Эта неделя', value: 'this_week' },
  { title: 'Прошлая неделя', value: 'last_week' },
  { title: 'Этот месяц', value: 'this_month' },
  { title: 'Прошлый месяц', value: 'last_month' },
  { title: 'Этот квартал', value: 'this_quarter' },
  { title: 'Прошлый квартал', value: 'last_quarter' }
])

const filteredTemplates = computed(() => {
  if (!search.value) return props.templates
  
  const searchLower = search.value.toLowerCase()
  return props.templates.filter(template => 
    template.name.toLowerCase().includes(searchLower) ||
    template.description.toLowerCase().includes(searchLower)
  )
})

// Methods
const getReportTypeConfig = (type: string) => {
  return reportTypeConfigs.value[type] || {
    label: type,
    icon: 'mdi-file',
    color: 'grey'
  }
}

const runTemplate = (template: ReportTemplate) => {
  console.log('Запуск шаблона:', template)
  // Here you would typically open the report builder with template data pre-filled
}

const editTemplate = (template: ReportTemplate) => {
  console.log('Редактирование шаблона:', template)
  // Here you would open an edit dialog
}

const deleteTemplate = async (template: ReportTemplate) => {
  if (confirm('Вы уверены, что хотите удалить этот шаблон?')) {
    try {
      await reportsService.deleteReportTemplate(template.id)
      emit('refresh')
    } catch (error) {
      console.error('Ошибка удаления шаблона:', error)
    }
  }
}

const createTemplate = async () => {
  creating.value = true
  try {
    await reportsService.createReportTemplate(templateForm.value)
    showCreateDialog.value = false
    resetForm()
    emit('refresh')
  } catch (error) {
    console.error('Ошибка создания шаблона:', error)
  } finally {
    creating.value = false
  }
}

const resetForm = () => {
  templateForm.value = {
    name: '',
    description: '',
    type: 'objects',
    default_parameters: {
      period: 'this_month',
      include_charts: true,
      include_summary: true
    },
    is_system: false
  }
}
</script>

<style scoped>
.template-card {
  height: 100%;
  transition: transform 0.2s ease-in-out;
}

.template-card:hover {
  transform: translateY(-2px);
}
</style>
