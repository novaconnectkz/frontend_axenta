<template>
  <div class="pa-4">
    <div class="d-flex justify-space-between align-center mb-4">
      <v-text-field
        v-model="search"
        label="Поиск расписаний"
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
        Создать расписание
      </v-btn>
    </div>

    <!-- Schedules Table -->
    <v-data-table
      :headers="headers"
      :items="filteredSchedules"
      :loading="loading"
      :items-per-page="10"
      class="elevation-1"
    >
      <template #item.enabled="{ item }">
        <v-switch
          :model-value="item.enabled"
          color="primary"
          hide-details
          @update:model-value="toggleSchedule(item, $event)"
        />
      </template>

      <template #item.template="{ item }">
        <div v-if="item.template">
          <div class="text-body-2">{{ item.template.name }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ getReportTypeConfig(item.template.type).label }}
          </div>
        </div>
        <span v-else class="text-medium-emphasis">—</span>
      </template>

      <template #item.cron_expression="{ item }">
        <v-chip size="small" variant="outlined">
          {{ item.cron_expression }}
        </v-chip>
        <div class="text-caption text-medium-emphasis mt-1">
          {{ getCronDescription(item.cron_expression) }}
        </div>
      </template>

      <template #item.recipients="{ item }">
        <v-chip-group>
          <v-chip
            v-for="recipient in item.recipients.slice(0, 2)"
            :key="recipient"
            size="x-small"
            variant="outlined"
          >
            {{ recipient }}
          </v-chip>
          <v-chip
            v-if="item.recipients.length > 2"
            size="x-small"
            variant="outlined"
          >
            +{{ item.recipients.length - 2 }}
          </v-chip>
        </v-chip-group>
      </template>

      <template #item.next_execution="{ item }">
        <span v-if="item.next_execution && item.enabled">
          {{ formatDate(item.next_execution) }}
        </span>
        <span v-else class="text-medium-emphasis">—</span>
      </template>

      <template #item.execution_count="{ item }">
        <v-chip size="small" variant="tonal" color="info">
          {{ item.execution_count }}
        </v-chip>
      </template>

      <template #item.actions="{ item }">
        <v-btn
          icon="mdi-play"
          size="small"
          variant="text"
          color="primary"
          @click="runSchedule(item)"
        />
        <v-btn
          icon="mdi-pencil"
          size="small"
          variant="text"
          @click="editSchedule(item)"
        />
        <v-btn
          icon="mdi-delete"
          size="small"
          variant="text"
          color="error"
          @click="deleteSchedule(item)"
        />
      </template>
    </v-data-table>

    <!-- Create Schedule Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="900">
      <v-card>
        <v-card-title>
          <span class="text-h5">Создать расписание отчета</span>
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Настройте автоматическую генерацию и отправку отчетов по расписанию.
          </p>
          
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="scheduleForm.name"
                label="Название расписания"
                variant="outlined"
                required
              />
            </v-col>
            
            <v-col cols="12">
              <v-textarea
                v-model="scheduleForm.description"
                label="Описание"
                variant="outlined"
                rows="2"
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="scheduleForm.template_id"
                label="Шаблон отчета"
                :items="templateItems"
                variant="outlined"
                required
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="scheduleForm.format"
                label="Формат экспорта"
                :items="formatItems"
                variant="outlined"
                required
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="cronPreset"
                label="Расписание"
                :items="cronPresets"
                variant="outlined"
                @update:model-value="onCronPresetChange"
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model="scheduleForm.cron_expression"
                label="Cron выражение"
                variant="outlined"
                required
                hint="Формат: минута час день месяц день_недели"
                persistent-hint
              />
            </v-col>
            
            <v-col cols="12">
              <v-combobox
                v-model="scheduleForm.recipients"
                label="Получатели"
                variant="outlined"
                multiple
                chips
                closable-chips
                hint="Введите email адреса получателей"
                persistent-hint
              />
            </v-col>
            
            <v-col cols="12">
              <v-checkbox
                v-model="scheduleForm.enabled"
                label="Активировать расписание"
                density="compact"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showCreateDialog = false">Отмена</v-btn>
          <v-btn
            color="primary"
            :loading="creating"
            @click="createSchedule"
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
import type { ReportSchedule, ReportScheduleFormData } from '@/types/reports'
import reportsService from '@/services/reportsService'

// Props
interface Props {
  schedules: ReportSchedule[]
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
const cronPreset = ref('')

const scheduleForm = ref<ReportScheduleFormData>({
  name: '',
  description: '',
  template_id: '',
  cron_expression: '0 9 * * 1',
  parameters: {},
  format: 'excel',
  recipients: [],
  enabled: true
})

// Computed
const reportTypeConfigs = computed(() => reportsService.getReportTypeConfigs())
const cronPresets = computed(() => reportsService.getCronPresets())

const templateItems = computed(() => [
  { title: 'Ежемесячный отчет по объектам', value: 'tpl1' },
  { title: 'Биллинговый отчет по договорам', value: 'tpl2' },
  { title: 'Отчет эффективности монтажников', value: 'tpl3' }
])

const formatItems = computed(() => [
  { title: 'Excel', value: 'excel' },
  { title: 'PDF', value: 'pdf' },
  { title: 'CSV', value: 'csv' },
  { title: 'JSON', value: 'json' }
])

const filteredSchedules = computed(() => {
  if (!search.value) return props.schedules
  
  const searchLower = search.value.toLowerCase()
  return props.schedules.filter(schedule => 
    schedule.name.toLowerCase().includes(searchLower) ||
    schedule.description.toLowerCase().includes(searchLower)
  )
})

// Table headers
const headers = [
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Активен', key: 'enabled', sortable: true },
  { title: 'Шаблон', key: 'template', sortable: false },
  { title: 'Расписание', key: 'cron_expression', sortable: false },
  { title: 'Получатели', key: 'recipients', sortable: false },
  { title: 'Следующий запуск', key: 'next_execution', sortable: true },
  { title: 'Выполнений', key: 'execution_count', sortable: true },
  { title: 'Действия', key: 'actions', sortable: false }
]

// Methods
const getReportTypeConfig = (type: string) => {
  return reportTypeConfigs.value[type] || {
    label: type,
    icon: 'mdi-file',
    color: 'grey'
  }
}

const getCronDescription = (expression: string) => {
  const preset = cronPresets.value.find(p => p.expression === expression)
  return preset?.description || 'Пользовательское расписание'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const toggleSchedule = async (schedule: ReportSchedule, enabled: boolean) => {
  try {
    await reportsService.toggleScheduleEnabled(schedule.id, enabled)
    emit('refresh')
  } catch (error) {
    console.error('Ошибка изменения статуса расписания:', error)
  }
}

const runSchedule = (schedule: ReportSchedule) => {
  console.log('Запуск расписания:', schedule)
  // Here you would trigger immediate execution
}

const editSchedule = (schedule: ReportSchedule) => {
  console.log('Редактирование расписания:', schedule)
  // Here you would open edit dialog
}

const deleteSchedule = async (schedule: ReportSchedule) => {
  if (confirm('Вы уверены, что хотите удалить это расписание?')) {
    try {
      await reportsService.deleteReportSchedule(schedule.id)
      emit('refresh')
    } catch (error) {
      console.error('Ошибка удаления расписания:', error)
    }
  }
}

const onCronPresetChange = (presetLabel: string) => {
  const preset = cronPresets.value.find(p => p.label === presetLabel)
  if (preset) {
    scheduleForm.value.cron_expression = preset.expression
  }
}

const createSchedule = async () => {
  creating.value = true
  try {
    await reportsService.createReportSchedule(scheduleForm.value)
    showCreateDialog.value = false
    resetForm()
    emit('refresh')
  } catch (error) {
    console.error('Ошибка создания расписания:', error)
  } finally {
    creating.value = false
  }
}

const resetForm = () => {
  scheduleForm.value = {
    name: '',
    description: '',
    template_id: '',
    cron_expression: '0 9 * * 1',
    parameters: {},
    format: 'excel',
    recipients: [],
    enabled: true
  }
  cronPreset.value = ''
}
</script>
