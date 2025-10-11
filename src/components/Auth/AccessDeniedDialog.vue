<template>
  <v-dialog
    v-model="show"
    max-width="500"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex align-center text-error">
        <v-icon icon="mdi-shield-alert" class="mr-2" color="error" />
        Доступ запрещен
      </v-card-title>

      <v-card-text class="py-6">
        <div class="text-center mb-4">
          <v-icon icon="mdi-account-cancel" size="64" color="error" class="mb-3" />
          <h3 class="text-h6 mb-2">{{ errorMessage }}</h3>
          <p class="text-body-2 text-medium-emphasis">
            Для доступа к CRM системе Axenta требуется партнерский аккаунт.
          </p>
        </div>

        <v-divider class="my-4" />

        <div v-if="accountDetails" class="account-info">
          <h4 class="text-subtitle-1 mb-3">
            <v-icon icon="mdi-information" class="mr-1" />
            Информация о вашем аккаунте:
          </h4>
          
          <v-list density="compact" class="bg-surface-variant rounded">
            <v-list-item>
              <v-list-item-title>Текущий тип аккаунта</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip 
                  :color="getAccountTypeColor(accountDetails.account_type)" 
                  size="small" 
                  variant="tonal"
                >
                  {{ getAccountTypeLabel(accountDetails.account_type) }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <v-list-item-title>Требуемый тип</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip color="success" size="small" variant="tonal">
                  Партнерский
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </div>

        <v-alert
          type="info"
          variant="tonal"
          class="mt-4"
        >
          <template #title>
            Как получить доступ?
          </template>
          <div>
            Обратитесь к администратору Axenta для изменения типа вашего аккаунта на "Партнерский" 
            или свяжитесь с технической поддержкой.
          </div>
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          variant="outlined"
          @click="goToSupport"
          prepend-icon="mdi-help-circle"
        >
          Техподдержка
        </v-btn>
        <v-btn
          color="primary"
          @click="tryAgain"
          prepend-icon="mdi-refresh"
        >
          Попробовать снова
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  errorMessage?: string
  accountDetails?: {
    account_type: string
    required_type: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  errorMessage: 'Доступ к CRM разрешен только партнерам Axenta',
  accountDetails: undefined
})

const emit = defineEmits<{
  'update:show': [value: boolean]
  'try-again': []
  'go-to-support': []
}>()

const getAccountTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    partner: 'success',
    client: 'warning',
    premium: 'amber',
    basic: 'blue',
    trial: 'orange',
    demo: 'purple',
    free: 'grey'
  }
  return colors[type] || 'default'
}

const getAccountTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    partner: 'Партнерский',
    client: 'Клиентский',
    premium: 'Премиум',
    basic: 'Базовый',
    trial: 'Пробный',
    demo: 'Демо',
    free: 'Бесплатный'
  }
  return labels[type] || type
}

const tryAgain = () => {
  emit('update:show', false)
  emit('try-again')
}

const goToSupport = () => {
  emit('go-to-support')
  // Можно добавить переход на страницу поддержки или открыть email
  window.open('mailto:support@axenta.ru?subject=Запрос на изменение типа аккаунта&body=Здравствуйте! Прошу изменить тип моего аккаунта на "Партнерский" для доступа к CRM системе.', '_blank')
}
</script>

<style scoped>
.account-info {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 8px;
  padding: 16px;
}

/* Темная тема */
[data-theme="dark"] .account-info {
  background: rgba(255, 255, 255, 0.05);
}
</style>
