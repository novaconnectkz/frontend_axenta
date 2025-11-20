import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export interface AuditLog {
  id: number
  timestamp: string
  user_id: string
  username: string
  role: string
  tenant_id: string
  ip: string
  user_agent: string
  action: string
  resource: string
  method: string
  path: string
  status_code: number
  details: Record<string, any>
  success: boolean
  level: string
  error: string
  duration_ms: number
  created_at: string
  updated_at: string
}

export interface AuditLogFilters {
  page?: number
  per_page?: number
  user_id?: string
  action?: string
  level?: string
  success?: boolean
  start_date?: string
  end_date?: string
  search?: string
  sort_by?: string
  sort_order?: string
}

export interface AuditLogStats {
  period: number
  start_date: string
  stats: {
    total_logs: number
    success_count: number
    error_count: number
    unique_users: number
    unique_actions: number
  }
  top_actions: Array<{
    action: string
    count: number
  }>
  level_stats: Array<{
    level: string
    count: number
  }>
  daily_activity: Array<{
    date: string
    count: number
  }>
}

class AuditService {
  /**
   * Получить список аудит-логов с фильтрацией
   */
  async getLogs(filters: AuditLogFilters = {}) {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/api/auth/audit/logs`, {
      headers: {
        Authorization: `Token ${token}`
      },
      params: filters
    })
    return response.data
  }

  /**
   * Получить детали конкретного аудит-лога
   */
  async getLog(id: number) {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/api/auth/audit/logs/${id}`, {
      headers: {
        Authorization: `Token ${token}`
      }
    })
    return response.data
  }

  /**
   * Получить статистику по аудит-логам
   */
  async getStats(days: number = 7): Promise<{ data: AuditLogStats }> {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/api/auth/audit/stats`, {
      headers: {
        Authorization: `Token ${token}`
      },
      params: { days }
    })
    return response.data
  }

  /**
   * Экспортировать аудит-логи в JSON
   */
  async exportLogs(filters: AuditLogFilters = {}) {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_URL}/api/auth/audit/export`, {
      headers: {
        Authorization: `Token ${token}`
      },
      params: filters
    })
    return response.data
  }
}

export default new AuditService()

