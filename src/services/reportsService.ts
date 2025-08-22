import type {
  Report,
  ReportTemplate,
  ReportSchedule,
  ReportExecution,
  ReportData,
  ReportStats,
  ReportFormData,
  ReportTemplateFormData,
  ReportScheduleFormData,
  ReportsResponse,
  ReportTemplatesResponse,
  ReportSchedulesResponse,
  ReportExecutionsResponse,
  ReportTypeConfig,
  ReportFormatConfig,
  CronPreset
} from '@/types/reports'

class ReportsService {
  private baseUrl = '/api/reports'

  // Demo data
  private demoReports: Report[] = [
    {
      id: '1',
      name: 'Отчет по объектам мониторинга',
      description: 'Подробный отчет по всем активным объектам мониторинга за текущий месяц',
      type: 'objects',
      format: 'excel',
      parameters: {
        date_from: '2024-01-01',
        date_to: '2024-01-31',
        period: 'this_month',
        include_inactive: false,
        group_by: 'location',
        sort_by: 'created_at',
        sort_order: 'desc'
      },
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:35:00Z',
      created_by: 'user1',
      company_id: 'company1',
      status: 'completed',
      file_url: '/reports/objects_2024_01.xlsx',
      file_size: 2048576,
      execution_time: 45
    },
    {
      id: '2',
      name: 'Биллинговый отчет',
      description: 'Отчет по выставленным счетам и платежам за последний квартал',
      type: 'billing',
      format: 'pdf',
      parameters: {
        date_from: '2023-10-01',
        date_to: '2023-12-31',
        period: 'last_quarter',
        include_charts: true,
        include_summary: true
      },
      created_at: '2024-01-10T14:20:00Z',
      updated_at: '2024-01-10T14:25:00Z',
      created_by: 'user2',
      company_id: 'company1',
      status: 'completed',
      file_url: '/reports/billing_q4_2023.pdf',
      file_size: 1024000,
      execution_time: 30
    },
    {
      id: '3',
      name: 'Отчет по монтажам',
      description: 'Статистика выполненных монтажей по монтажникам',
      type: 'installations',
      format: 'csv',
      parameters: {
        date_from: '2024-01-01',
        date_to: '2024-01-31',
        installer_ids: ['inst1', 'inst2'],
        group_by: 'date',
        sort_by: 'date',
        sort_order: 'asc'
      },
      created_at: '2024-01-20T09:15:00Z',
      updated_at: '2024-01-20T09:18:00Z',
      created_by: 'user3',
      company_id: 'company1',
      status: 'generating',
      execution_time: 15
    },
    {
      id: '4',
      name: 'Складской отчет',
      description: 'Отчет по движению оборудования на складе',
      type: 'warehouse',
      format: 'excel',
      parameters: {
        date_from: '2024-01-01',
        date_to: '2024-01-31',
        equipment_categories: ['trackers', 'sensors'],
        include_inactive: true,
        group_by: 'category'
      },
      created_at: '2024-01-18T16:45:00Z',
      updated_at: '2024-01-18T16:48:00Z',
      created_by: 'user1',
      company_id: 'company1',
      status: 'failed',
      error_message: 'Ошибка доступа к данным склада'
    },
    {
      id: '5',
      name: 'Отчет по пользователям',
      description: 'Активность пользователей системы',
      type: 'users',
      format: 'json',
      parameters: {
        date_from: '2024-01-01',
        date_to: '2024-01-31',
        include_inactive: false,
        group_by: 'user',
        sort_by: 'last_login',
        sort_order: 'desc'
      },
      created_at: '2024-01-22T11:30:00Z',
      updated_at: '2024-01-22T11:32:00Z',
      created_by: 'user2',
      company_id: 'company1',
      status: 'completed',
      file_url: '/reports/users_activity_2024_01.json',
      file_size: 512000,
      execution_time: 8
    }
  ]

  private demoTemplates: ReportTemplate[] = [
    {
      id: 'tpl1',
      name: 'Ежемесячный отчет по объектам',
      description: 'Стандартный шаблон для отчета по объектам мониторинга',
      type: 'objects',
      default_parameters: {
        period: 'this_month',
        include_inactive: false,
        group_by: 'location',
        include_charts: true,
        include_summary: true
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      created_by: 'system',
      company_id: 'company1',
      is_system: true,
      usage_count: 15
    },
    {
      id: 'tpl2',
      name: 'Биллинговый отчет по договорам',
      description: 'Детальный отчет по биллингу с разбивкой по договорам',
      type: 'billing',
      default_parameters: {
        period: 'this_month',
        group_by: 'date',
        include_charts: true,
        include_summary: true
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-10T12:00:00Z',
      created_by: 'system',
      company_id: 'company1',
      is_system: true,
      usage_count: 8
    },
    {
      id: 'tpl3',
      name: 'Отчет эффективности монтажников',
      description: 'Анализ производительности монтажников',
      type: 'installations',
      default_parameters: {
        period: 'this_week',
        group_by: 'user',
        sort_by: 'completion_rate',
        sort_order: 'desc',
        include_summary: true
      },
      created_at: '2024-01-05T00:00:00Z',
      updated_at: '2024-01-20T15:00:00Z',
      created_by: 'user1',
      company_id: 'company1',
      is_system: false,
      usage_count: 12
    }
  ]

  private demoSchedules: ReportSchedule[] = [
    {
      id: 'sch1',
      name: 'Еженедельный отчет по объектам',
      description: 'Автоматический отчет каждый понедельник в 9:00',
      template_id: 'tpl1',
      cron_expression: '0 9 * * 1',
      parameters: {
        period: 'last_week',
        include_inactive: false,
        group_by: 'location'
      },
      format: 'excel',
      recipients: ['manager@company.com', 'admin@company.com'],
      enabled: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      created_by: 'user1',
      company_id: 'company1',
      last_execution: '2024-01-22T09:00:00Z',
      next_execution: '2024-01-29T09:00:00Z',
      execution_count: 4
    },
    {
      id: 'sch2',
      name: 'Ежемесячный биллинговый отчет',
      description: 'Отчет по биллингу в первый день месяца',
      template_id: 'tpl2',
      cron_expression: '0 8 1 * *',
      parameters: {
        period: 'last_month',
        include_charts: true,
        include_summary: true
      },
      format: 'pdf',
      recipients: ['finance@company.com', 'director@company.com'],
      enabled: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      created_by: 'user2',
      company_id: 'company1',
      last_execution: '2024-01-01T08:00:00Z',
      next_execution: '2024-02-01T08:00:00Z',
      execution_count: 1
    },
    {
      id: 'sch3',
      name: 'Ежедневный отчет по монтажам',
      description: 'Ежедневная сводка по выполненным монтажам',
      template_id: 'tpl3',
      cron_expression: '0 18 * * *',
      parameters: {
        period: 'today',
        group_by: 'user',
        include_summary: true
      },
      format: 'csv',
      recipients: ['operations@company.com'],
      enabled: false,
      created_at: '2024-01-10T00:00:00Z',
      updated_at: '2024-01-20T15:00:00Z',
      created_by: 'user3',
      company_id: 'company1',
      last_execution: '2024-01-20T18:00:00Z',
      next_execution: '2024-01-21T18:00:00Z',
      execution_count: 10
    }
  ]

  private demoExecutions: ReportExecution[] = [
    {
      id: 'exec1',
      schedule_id: 'sch1',
      report_id: '1',
      status: 'completed',
      started_at: '2024-01-22T09:00:00Z',
      completed_at: '2024-01-22T09:02:30Z',
      execution_time: 150,
      file_url: '/reports/weekly_objects_2024_w3.xlsx',
      file_size: 1536000,
      recipients_sent: ['manager@company.com', 'admin@company.com'],
      recipients_failed: []
    },
    {
      id: 'exec2',
      schedule_id: 'sch2',
      report_id: '2',
      status: 'completed',
      started_at: '2024-01-01T08:00:00Z',
      completed_at: '2024-01-01T08:03:45Z',
      execution_time: 225,
      file_url: '/reports/monthly_billing_2023_12.pdf',
      file_size: 2048000,
      recipients_sent: ['finance@company.com', 'director@company.com'],
      recipients_failed: []
    },
    {
      id: 'exec3',
      schedule_id: 'sch3',
      report_id: '3',
      status: 'failed',
      started_at: '2024-01-20T18:00:00Z',
      completed_at: '2024-01-20T18:01:15Z',
      execution_time: 75,
      error_message: 'Недостаточно данных для генерации отчета',
      recipients_sent: [],
      recipients_failed: ['operations@company.com']
    }
  ]

  // Configuration data
  getReportTypeConfigs(): Record<string, ReportTypeConfig> {
    return {
      objects: {
        label: 'Объекты мониторинга',
        description: 'Отчеты по объектам, их статусам и активности',
        icon: 'mdi-map-marker-multiple',
        color: 'primary',
        available_parameters: ['date_from', 'date_to', 'location_ids', 'status_filter', 'include_inactive'],
        default_format: 'excel',
        supports_charts: true
      },
      users: {
        label: 'Пользователи',
        description: 'Отчеты по пользователям и их активности',
        icon: 'mdi-account-group',
        color: 'secondary',
        available_parameters: ['date_from', 'date_to', 'user_ids', 'include_inactive'],
        default_format: 'csv',
        supports_charts: true
      },
      billing: {
        label: 'Биллинг',
        description: 'Финансовые отчеты, счета и платежи',
        icon: 'mdi-currency-usd',
        color: 'success',
        available_parameters: ['date_from', 'date_to', 'contract_ids', 'include_summary'],
        default_format: 'pdf',
        supports_charts: true
      },
      installations: {
        label: 'Монтажи',
        description: 'Отчеты по выполненным монтажам и диагностикам',
        icon: 'mdi-tools',
        color: 'info',
        available_parameters: ['date_from', 'date_to', 'installer_ids', 'location_ids'],
        default_format: 'excel',
        supports_charts: true
      },
      warehouse: {
        label: 'Склад',
        description: 'Отчеты по складским операциям и остаткам',
        icon: 'mdi-warehouse',
        color: 'warning',
        available_parameters: ['date_from', 'date_to', 'equipment_categories', 'location_ids'],
        default_format: 'excel',
        supports_charts: false
      },
      contracts: {
        label: 'Договоры',
        description: 'Отчеты по договорам и их исполнению',
        icon: 'mdi-file-document-multiple',
        color: 'purple',
        available_parameters: ['date_from', 'date_to', 'contract_ids', 'status_filter'],
        default_format: 'pdf',
        supports_charts: true
      },
      general_stats: {
        label: 'Общая статистика',
        description: 'Сводные отчеты по всем разделам системы',
        icon: 'mdi-chart-line',
        color: 'deep-purple',
        available_parameters: ['date_from', 'date_to', 'include_charts', 'include_summary'],
        default_format: 'pdf',
        supports_charts: true
      }
    }
  }

  getReportFormatConfigs(): Record<string, ReportFormatConfig> {
    return {
      csv: {
        label: 'CSV',
        extension: 'csv',
        mime_type: 'text/csv',
        supports_charts: false,
        max_rows: 1000000
      },
      excel: {
        label: 'Excel',
        extension: 'xlsx',
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        supports_charts: true,
        max_rows: 1000000
      },
      pdf: {
        label: 'PDF',
        extension: 'pdf',
        mime_type: 'application/pdf',
        supports_charts: true,
        max_rows: 50000
      },
      json: {
        label: 'JSON',
        extension: 'json',
        mime_type: 'application/json',
        supports_charts: false,
        max_rows: 100000
      }
    }
  }

  getCronPresets(): CronPreset[] {
    return [
      { label: 'Каждый день в 9:00', expression: '0 9 * * *', description: 'Ежедневно в 9 утра' },
      { label: 'Каждый понедельник в 9:00', expression: '0 9 * * 1', description: 'Еженедельно по понедельникам' },
      { label: 'Первого числа в 8:00', expression: '0 8 1 * *', description: 'Ежемесячно первого числа' },
      { label: 'Каждый час', expression: '0 * * * *', description: 'Ежечасно' },
      { label: 'Каждые 6 часов', expression: '0 */6 * * *', description: 'Каждые 6 часов' },
      { label: 'Рабочие дни в 18:00', expression: '0 18 * * 1-5', description: 'Понедельник-пятница в 18:00' }
    ]
  }

  // API methods
  async getReports(params?: {
    page?: number
    limit?: number
    type?: string
    status?: string
    search?: string
  }): Promise<ReportsResponse> {
    // Simulate API call with demo data
    await new Promise(resolve => setTimeout(resolve, 500))
    
    let filteredReports = [...this.demoReports]
    
    if (params?.type) {
      filteredReports = filteredReports.filter(r => r.type === params.type)
    }
    
    if (params?.status) {
      filteredReports = filteredReports.filter(r => r.status === params.status)
    }
    
    if (params?.search) {
      const search = params.search.toLowerCase()
      filteredReports = filteredReports.filter(r => 
        r.name.toLowerCase().includes(search) ||
        r.description.toLowerCase().includes(search)
      )
    }
    
    const page = params?.page || 1
    const limit = params?.limit || 10
    const start = (page - 1) * limit
    const end = start + limit
    
    return {
      reports: filteredReports.slice(start, end),
      total: filteredReports.length,
      page,
      limit
    }
  }

  async getReportTemplates(params?: {
    page?: number
    limit?: number
    type?: string
    search?: string
  }): Promise<ReportTemplatesResponse> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    let filteredTemplates = [...this.demoTemplates]
    
    if (params?.type) {
      filteredTemplates = filteredTemplates.filter(t => t.type === params.type)
    }
    
    if (params?.search) {
      const search = params.search.toLowerCase()
      filteredTemplates = filteredTemplates.filter(t => 
        t.name.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search)
      )
    }
    
    const page = params?.page || 1
    const limit = params?.limit || 10
    const start = (page - 1) * limit
    const end = start + limit
    
    return {
      templates: filteredTemplates.slice(start, end),
      total: filteredTemplates.length,
      page,
      limit
    }
  }

  async getReportSchedules(params?: {
    page?: number
    limit?: number
    enabled?: boolean
    search?: string
  }): Promise<ReportSchedulesResponse> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    let filteredSchedules = [...this.demoSchedules]
    
    if (params?.enabled !== undefined) {
      filteredSchedules = filteredSchedules.filter(s => s.enabled === params.enabled)
    }
    
    if (params?.search) {
      const search = params.search.toLowerCase()
      filteredSchedules = filteredSchedules.filter(s => 
        s.name.toLowerCase().includes(search) ||
        s.description.toLowerCase().includes(search)
      )
    }
    
    const page = params?.page || 1
    const limit = params?.limit || 10
    const start = (page - 1) * limit
    const end = start + limit
    
    return {
      schedules: filteredSchedules.slice(start, end),
      total: filteredSchedules.length,
      page,
      limit
    }
  }

  async getReportExecutions(params?: {
    page?: number
    limit?: number
    schedule_id?: string
    status?: string
  }): Promise<ReportExecutionsResponse> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    let filteredExecutions = [...this.demoExecutions]
    
    if (params?.schedule_id) {
      filteredExecutions = filteredExecutions.filter(e => e.schedule_id === params.schedule_id)
    }
    
    if (params?.status) {
      filteredExecutions = filteredExecutions.filter(e => e.status === params.status)
    }
    
    const page = params?.page || 1
    const limit = params?.limit || 10
    const start = (page - 1) * limit
    const end = start + limit
    
    return {
      executions: filteredExecutions.slice(start, end),
      total: filteredExecutions.length,
      page,
      limit
    }
  }

  async getReportStats(): Promise<ReportStats> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    return {
      total_reports: this.demoReports.length,
      reports_today: 2,
      scheduled_reports: this.demoSchedules.filter(s => s.enabled).length,
      failed_reports: this.demoReports.filter(r => r.status === 'failed').length,
      total_size: this.demoReports.reduce((sum, r) => sum + (r.file_size || 0), 0),
      avg_execution_time: 45,
      most_used_type: 'objects',
      recent_executions: this.demoExecutions.slice(0, 5)
    }
  }

  async createReport(data: ReportFormData): Promise<Report> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newReport: Report = {
      id: `report_${Date.now()}`,
      name: data.name,
      description: data.description,
      type: data.type,
      format: data.format,
      parameters: data.parameters,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'current_user',
      company_id: 'company1',
      status: 'generating'
    }
    
    this.demoReports.unshift(newReport)
    return newReport
  }

  async createReportTemplate(data: ReportTemplateFormData): Promise<ReportTemplate> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const newTemplate: ReportTemplate = {
      id: `tpl_${Date.now()}`,
      name: data.name,
      description: data.description,
      type: data.type,
      default_parameters: data.default_parameters,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'current_user',
      company_id: 'company1',
      is_system: data.is_system,
      usage_count: 0
    }
    
    this.demoTemplates.unshift(newTemplate)
    return newTemplate
  }

  async createReportSchedule(data: ReportScheduleFormData): Promise<ReportSchedule> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const newSchedule: ReportSchedule = {
      id: `sch_${Date.now()}`,
      name: data.name,
      description: data.description,
      template_id: data.template_id,
      cron_expression: data.cron_expression,
      parameters: data.parameters,
      format: data.format,
      recipients: data.recipients,
      enabled: data.enabled,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'current_user',
      company_id: 'company1',
      execution_count: 0
    }
    
    this.demoSchedules.unshift(newSchedule)
    return newSchedule
  }

  async deleteReport(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const index = this.demoReports.findIndex(r => r.id === id)
    if (index !== -1) {
      this.demoReports.splice(index, 1)
    }
  }

  async deleteReportTemplate(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const index = this.demoTemplates.findIndex(t => t.id === id)
    if (index !== -1) {
      this.demoTemplates.splice(index, 1)
    }
  }

  async deleteReportSchedule(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const index = this.demoSchedules.findIndex(s => s.id === id)
    if (index !== -1) {
      this.demoSchedules.splice(index, 1)
    }
  }

  async toggleScheduleEnabled(id: string, enabled: boolean): Promise<ReportSchedule> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const schedule = this.demoSchedules.find(s => s.id === id)
    if (schedule) {
      schedule.enabled = enabled
      schedule.updated_at = new Date().toISOString()
    }
    return schedule!
  }

  async generateReportPreview(data: ReportFormData): Promise<ReportData> {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Generate mock preview data based on report type
    const mockData: ReportData = {
      headers: this.getMockHeaders(data.type),
      rows: this.getMockRows(data.type),
      summary: this.getMockSummary(data.type),
      charts: data.parameters.include_charts ? this.getMockCharts(data.type) : [],
      metadata: {
        total_records: 100,
        generated_at: new Date().toISOString(),
        parameters: data.parameters,
        execution_time: 1.5
      }
    }
    
    return mockData
  }

  private getMockHeaders(type: string): string[] {
    switch (type) {
      case 'objects':
        return ['ID', 'Название', 'Тип', 'Статус', 'Локация', 'Дата создания', 'Последняя активность']
      case 'users':
        return ['ID', 'Имя', 'Email', 'Роль', 'Статус', 'Последний вход', 'Дата регистрации']
      case 'billing':
        return ['Номер счета', 'Дата', 'Клиент', 'Сумма', 'Статус', 'Дата оплаты']
      case 'installations':
        return ['ID', 'Объект', 'Монтажник', 'Дата', 'Статус', 'Продолжительность', 'Стоимость']
      case 'warehouse':
        return ['ID', 'Название', 'Категория', 'Количество', 'Статус', 'Локация', 'Дата поступления']
      default:
        return ['ID', 'Название', 'Значение', 'Дата']
    }
  }

  private getMockRows(type: string): any[][] {
    const rows = []
    for (let i = 1; i <= 10; i++) {
      switch (type) {
        case 'objects':
          rows.push([
            `obj_${i}`,
            `Объект ${i}`,
            'GPS трекер',
            i % 3 === 0 ? 'Неактивен' : 'Активен',
            `Локация ${i % 3 + 1}`,
            '2024-01-01',
            '2024-01-20'
          ])
          break
        case 'users':
          rows.push([
            `user_${i}`,
            `Пользователь ${i}`,
            `user${i}@example.com`,
            i % 2 === 0 ? 'Администратор' : 'Пользователь',
            'Активен',
            '2024-01-20',
            '2024-01-01'
          ])
          break
        case 'billing':
          rows.push([
            `INV-${1000 + i}`,
            '2024-01-15',
            `Клиент ${i}`,
            `${(i * 1000).toLocaleString()} ₽`,
            i % 4 === 0 ? 'Не оплачен' : 'Оплачен',
            i % 4 === 0 ? '-' : '2024-01-16'
          ])
          break
        default:
          rows.push([`${i}`, `Запись ${i}`, `Значение ${i}`, '2024-01-20'])
      }
    }
    return rows
  }

  private getMockSummary(type: string): any {
    switch (type) {
      case 'objects':
        return {
          total_count: 150,
          active_count: 120,
          inactive_count: 30,
          categories: {
            'GPS трекеры': 80,
            'Датчики': 45,
            'Контроллеры': 25
          }
        }
      case 'billing':
        return {
          total_count: 45,
          total_amount: 450000,
          average_amount: 10000,
          period_comparison: {
            current: 450000,
            previous: 420000,
            change_percent: 7.1
          }
        }
      default:
        return {
          total_count: 100,
          active_count: 85,
          inactive_count: 15
        }
    }
  }

  private getMockCharts(type: string): any[] {
    switch (type) {
      case 'objects':
        return [{
          id: 'objects_by_status',
          title: 'Объекты по статусам',
          type: 'doughnut',
          data: {
            labels: ['Активные', 'Неактивные', 'В ремонте'],
            datasets: [{
              label: 'Количество',
              data: [120, 25, 5],
              backgroundColor: ['#4CAF50', '#FFC107', '#F44336']
            }]
          }
        }]
      case 'billing':
        return [{
          id: 'billing_trend',
          title: 'Динамика доходов',
          type: 'line',
          data: {
            labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май'],
            datasets: [{
              label: 'Доходы, ₽',
              data: [420000, 450000, 380000, 520000, 480000],
              borderColor: '#2196F3',
              fill: false
            }]
          }
        }]
      default:
        return []
    }
  }
}

export const reportsService = new ReportsService()
export default reportsService
