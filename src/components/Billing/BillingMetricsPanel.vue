<template>
  <!--
    Сворачиваемая панель «Метрики биллинга» (Фаза A IA-реструктуризации).
    Самодостаточна: сама грузит dashboard-данные и рендерит карточки по категориям.
    Используется на вкладке «Контрагенты» (раздел Биллинг). Подпанель «договоры»
    (зависит от ContractsTab) сюда НЕ входит — она остаётся на вкладке Договоры.
  -->
  <v-row class="mb-4" no-gutters>
    <v-col cols="12">
      <v-card variant="outlined" class="mb-2">
        <v-card-title class="d-flex align-center" style="cursor: pointer" @click="metricsVisible = !metricsVisible">
          <v-icon class="mr-2">mdi-chart-box</v-icon>
          <span>Метрики биллинга</span>
          <v-spacer />
          <v-icon>{{ metricsVisible ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </v-card-title>
      </v-card>
    </v-col>

    <v-col cols="12">
      <v-expand-transition>
        <div v-if="metricsVisible">
          <v-card v-for="cat in categories" :key="cat.key" variant="outlined" class="pa-2 mb-2">
            <v-card-title class="text-subtitle-1 d-flex align-center" style="cursor: pointer" @click="toggle(cat.key)">
              <v-icon class="mr-2">{{ cat.icon }}</v-icon>
              <span>{{ cat.title }}</span>
              <v-spacer />
              <v-icon>{{ expanded[cat.key] ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </v-card-title>
            <v-expand-transition>
              <v-card-text v-if="expanded[cat.key]">
                <v-row v-if="loading" no-gutters>
                  <v-col v-for="i in cat.metrics.length" :key="i" cols="6" sm="4" md="3" lg="2" class="pa-1">
                    <v-skeleton-loader type="card" class="ma-1" />
                  </v-col>
                </v-row>
                <v-row v-else no-gutters>
                  <v-col v-for="m in cat.metrics" :key="m.key" cols="6" sm="4" md="3" lg="2" class="pa-1">
                    <BillingStatCard
                      :title="widget(m.key)?.title || m.fallback"
                      :value="widget(m.key)?.value || 0"
                      :icon="m.icon"
                      :icon-color="m.color"
                      :format="m.format"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-expand-transition>
          </v-card>
        </div>
      </v-expand-transition>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import billingService from '@/services/billingService'
import type { BillingDashboardData } from '@/types/billing'
import BillingStatCard from '@/components/Billing/BillingStatCard.vue'

type Fmt = 'currency' | 'number' | 'percentage'
type Color = 'primary' | 'success' | 'warning' | 'error' | 'info'

const metricsVisible = ref(false)
const loading = ref(false)
const dashboardData = ref<BillingDashboardData | null>(null)

const expanded = ref<Record<string, boolean>>({
  basic: true, critical: false, important: false, additional: false,
})
function toggle(key: string) { expanded.value[key] = !expanded.value[key] }

function widget(key: string): { title?: string; value?: number } | undefined {
  return (dashboardData.value?.widgets as any)?.[key]
}

const categories: { key: string; title: string; icon: string; metrics: { key: string; fallback: string; icon: string; color: Color; format: Fmt }[] }[] = [
  {
    key: 'basic', title: 'Основные метрики', icon: 'mdi-chart-line', metrics: [
      { key: 'total_revenue', fallback: 'Общий доход', icon: 'mdi-currency-rub', color: 'primary', format: 'currency' },
      { key: 'monthly_revenue', fallback: 'Доход за месяц', icon: 'mdi-calendar-month', color: 'success', format: 'currency' },
      { key: 'active_subscriptions', fallback: 'Активные подписки', icon: 'mdi-credit-card-check', color: 'success', format: 'number' },
      { key: 'outstanding_amount', fallback: 'К оплате', icon: 'mdi-clock-alert', color: 'warning', format: 'currency' },
      { key: 'overdue_amount', fallback: 'Просрочено', icon: 'mdi-alert-circle', color: 'error', format: 'currency' },
      { key: 'overdue_invoices', fallback: 'Просроченные счета', icon: 'mdi-file-document-alert', color: 'error', format: 'number' },
    ],
  },
  {
    key: 'critical', title: 'Критичные метрики', icon: 'mdi-alert-circle', metrics: [
      { key: 'average_invoice_amount', fallback: 'Средний чек', icon: 'mdi-cash-multiple', color: 'primary', format: 'currency' },
      { key: 'payment_conversion_rate', fallback: 'Конверсия оплат', icon: 'mdi-percent', color: 'success', format: 'percentage' },
      { key: 'average_payment_days', fallback: 'Средний срок оплаты', icon: 'mdi-calendar-clock', color: 'info', format: 'number' },
      { key: 'expected_revenue', fallback: 'Ожидаемый доход', icon: 'mdi-chart-line', color: 'success', format: 'currency' },
    ],
  },
  {
    key: 'important', title: 'Важные метрики', icon: 'mdi-star', metrics: [
      { key: 'invoices_to_send', fallback: 'Счета к отправке', icon: 'mdi-email-send', color: 'warning', format: 'number' },
      { key: 'partially_paid_amount', fallback: 'Частично оплачено', icon: 'mdi-cash-partial', color: 'warning', format: 'currency' },
      { key: 'partially_paid_count', fallback: 'Частично оплаченные', icon: 'mdi-file-document-edit', color: 'warning', format: 'number' },
      { key: 'new_subscriptions', fallback: 'Новые подписки', icon: 'mdi-account-plus', color: 'success', format: 'number' },
    ],
  },
  {
    key: 'additional', title: 'Полезные метрики', icon: 'mdi-chart-box', metrics: [
      { key: 'average_revenue_per_contract', fallback: 'Средний доход с договора', icon: 'mdi-chart-box', color: 'primary', format: 'currency' },
      { key: 'overdue_percentage', fallback: 'Процент просрочки', icon: 'mdi-alert', color: 'error', format: 'percentage' },
      { key: 'invoices_without_contract', fallback: 'Счета без договора', icon: 'mdi-file-question', color: 'warning', format: 'number' },
      { key: 'payment_activity_7d', fallback: 'Платежи за 7 дней', icon: 'mdi-calendar-week', color: 'info', format: 'number' },
      { key: 'payment_activity_30d', fallback: 'Платежи за 30 дней', icon: 'mdi-calendar-month', color: 'info', format: 'number' },
    ],
  },
]

function companyId(): number {
  try {
    const c = localStorage.getItem('axenta_company')
    return c ? Number(JSON.parse(c)?.id) || 0 : 0
  } catch { return 0 }
}

async function load() {
  loading.value = true
  try {
    dashboardData.value = await billingService.getBillingDashboardData(companyId())
  } catch (e) {
    console.warn('Метрики биллинга: не удалось загрузить', e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
