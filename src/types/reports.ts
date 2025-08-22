// Types for Reports System
export interface Report {
  id: string
  name: string
  description: string
  type: ReportType
  format: ReportFormat
  parameters: ReportParameters
  created_at: string
  updated_at: string
  created_by: string
  company_id: string
  status: ReportStatus
  file_url?: string
  file_size?: number
  execution_time?: number
  error_message?: string
}

export interface ReportTemplate {
  id: string
  name: string
  description: string
  type: ReportType
  default_parameters: ReportParameters
  created_at: string
  updated_at: string
  created_by: string
  company_id: string
  is_system: boolean
  usage_count: number
}

export interface ReportSchedule {
  id: string
  name: string
  description: string
  template_id: string
  template?: ReportTemplate
  cron_expression: string
  parameters: ReportParameters
  format: ReportFormat
  recipients: string[]
  enabled: boolean
  created_at: string
  updated_at: string
  created_by: string
  company_id: string
  last_execution?: string
  next_execution?: string
  execution_count: number
}

export interface ReportExecution {
  id: string
  schedule_id: string
  schedule?: ReportSchedule
  report_id: string
  report?: Report
  status: ReportExecutionStatus
  started_at: string
  completed_at?: string
  execution_time?: number
  file_url?: string
  file_size?: number
  error_message?: string
  recipients_sent: string[]
  recipients_failed: string[]
}

export interface ReportParameters {
  date_from?: string
  date_to?: string
  period?: ReportPeriod
  location_ids?: string[]
  user_ids?: string[]
  object_ids?: string[]
  contract_ids?: string[]
  installer_ids?: string[]
  equipment_categories?: string[]
  status_filter?: string[]
  include_inactive?: boolean
  group_by?: ReportGroupBy
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  limit?: number
  include_charts?: boolean
  include_summary?: boolean
  custom_fields?: Record<string, any>
}

export interface ReportData {
  headers: string[]
  rows: any[][]
  summary?: ReportSummary
  charts?: ReportChart[]
  metadata: {
    total_records: number
    generated_at: string
    parameters: ReportParameters
    execution_time: number
  }
}

export interface ReportSummary {
  total_count: number
  active_count: number
  inactive_count: number
  total_amount?: number
  average_amount?: number
  period_comparison?: {
    current: number
    previous: number
    change_percent: number
  }
  categories?: Record<string, number>
}

export interface ReportChart {
  id: string
  title: string
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area'
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      backgroundColor?: string | string[]
      borderColor?: string
      fill?: boolean
    }[]
  }
  options?: Record<string, any>
}

export interface ReportFilter {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like' | 'between'
  value: any
  label?: string
}

export interface ReportStats {
  total_reports: number
  reports_today: number
  scheduled_reports: number
  failed_reports: number
  total_size: number
  avg_execution_time: number
  most_used_type: ReportType
  recent_executions: ReportExecution[]
}

export type ReportType = 
  | 'objects'
  | 'users' 
  | 'billing'
  | 'installations'
  | 'warehouse'
  | 'contracts'
  | 'general_stats'
  | 'financial'
  | 'operational'
  | 'custom'

export type ReportFormat = 'csv' | 'excel' | 'pdf' | 'json'

export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed' | 'cancelled'

export type ReportExecutionStatus = 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled'

export type ReportPeriod = 
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | 'custom'

export type ReportGroupBy = 
  | 'date'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'
  | 'location'
  | 'user'
  | 'status'
  | 'category'
  | 'type'

// Form interfaces
export interface ReportFormData {
  name: string
  description: string
  type: ReportType
  format: ReportFormat
  parameters: ReportParameters
  template_id?: string
}

export interface ReportTemplateFormData {
  name: string
  description: string
  type: ReportType
  default_parameters: ReportParameters
  is_system: boolean
}

export interface ReportScheduleFormData {
  name: string
  description: string
  template_id: string
  cron_expression: string
  parameters: ReportParameters
  format: ReportFormat
  recipients: string[]
  enabled: boolean
}

// API Response interfaces
export interface ReportsResponse {
  reports: Report[]
  total: number
  page: number
  limit: number
}

export interface ReportTemplatesResponse {
  templates: ReportTemplate[]
  total: number
  page: number
  limit: number
}

export interface ReportSchedulesResponse {
  schedules: ReportSchedule[]
  total: number
  page: number
  limit: number
}

export interface ReportExecutionsResponse {
  executions: ReportExecution[]
  total: number
  page: number
  limit: number
}

// Utility types
export interface ReportTypeConfig {
  label: string
  description: string
  icon: string
  color: string
  available_parameters: string[]
  default_format: ReportFormat
  supports_charts: boolean
}

export interface ReportFormatConfig {
  label: string
  extension: string
  mime_type: string
  supports_charts: boolean
  max_rows?: number
}

export interface CronPreset {
  label: string
  expression: string
  description: string
}
