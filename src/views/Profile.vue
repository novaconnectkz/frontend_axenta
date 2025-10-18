<template>
  <div class="profile-page">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-account-circle</v-icon>
              Профиль пользователя
              <v-spacer />
              <v-chip
                v-if="auth.user.value"
                :color="getRoleColor(auth.user.value.accountType)"
                variant="tonal"
                size="small"
              >
                {{ getRoleLabel(auth.user.value.accountType) }}
              </v-chip>
            </v-card-title>

            <v-card-text>
              <div v-if="auth.user.value">
                <v-row>
                  <!-- Левая колонка -->
                  <v-col cols="12" md="6">
                    <v-list density="compact">
                      <v-list-item>
                        <v-list-item-title>ID пользователя</v-list-item-title>
                        <v-list-item-subtitle>{{ auth.user.value.id }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item>
                        <v-list-item-title>Логин</v-list-item-title>
                        <v-list-item-subtitle>{{ auth.user.value.username }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item>
                        <v-list-item-title>Полное имя</v-list-item-title>
                        <v-list-item-subtitle>{{ auth.user.value.name }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item v-if="auth.user.value.email">
                        <v-list-item-title>Email</v-list-item-title>
                        <v-list-item-subtitle>
                          <a :href="`mailto:${auth.user.value.email}`" class="text-primary">
                            {{ auth.user.value.email }}
                          </a>
                        </v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item>
                        <v-list-item-title>Статус</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip 
                            :color="auth.user.value.isActive ? 'success' : 'error'" 
                            size="small" 
                            variant="tonal"
                          >
                            {{ auth.user.value.isActive ? 'Активен' : 'Неактивен' }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Права администратора</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip 
                            :color="auth.user.value.isAdmin ? 'warning' : 'default'" 
                            size="small" 
                            variant="tonal"
                          >
                            {{ auth.user.value.isAdmin ? 'Да' : 'Нет' }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <v-list-item-title>Название компании</v-list-item-title>
                        <v-list-item-subtitle>{{ auth.user.value.accountName }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item>
                        <v-list-item-title>Тип аккаунта</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip 
                            :color="getAccountTypeColor(auth.user.value.accountType)" 
                            size="small" 
                            variant="tonal"
                          >
                            {{ getAccountTypeLabel(auth.user.value.accountType) }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item v-if="auth.user.value.accountId">
                        <v-list-item-title>ID аккаунта</v-list-item-title>
                        <v-list-item-subtitle>{{ auth.user.value.accountId }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-col>

                  <!-- Правая колонка -->
                  <v-col cols="12" md="6">
                    <v-list density="compact">
                      <v-list-item v-if="auth.user.value.creatorName">
                        <v-list-item-title>Создатель аккаунта</v-list-item-title>
                        <v-list-item-subtitle>{{ auth.user.value.creatorName }}</v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item v-if="auth.user.value.accountBlockingDatetime">
                        <v-list-item-title>Блокировка аккаунта</v-list-item-title>
                        <v-list-item-subtitle class="text-error">
                          <v-icon icon="mdi-alert" size="16" class="mr-1" />
                          {{ formatDate(auth.user.value.accountBlockingDatetime) }}
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item v-if="auth.user.value.language">
                        <v-list-item-title>Язык интерфейса</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip size="small" variant="tonal" color="info">
                            {{ getLanguageLabel(auth.user.value.language) }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item v-if="auth.user.value.timezone">
                        <v-list-item-title>Часовой пояс</v-list-item-title>
                        <v-list-item-subtitle>UTC{{ auth.user.value.timezone >= 0 ? '+' : '' }}{{ auth.user.value.timezone }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item v-if="auth.user.value.lastLogin">
                        <v-list-item-title>Последний вход</v-list-item-title>
                        <v-list-item-subtitle>{{ formatDate(auth.user.value.lastLogin) }}</v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item v-if="auth.company.value">
                        <v-list-item-title>ID компании в системе</v-list-item-title>
                        <v-list-item-subtitle>{{ auth.company.value.id }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-col>
                </v-row>
              </div>

              <div v-else class="text-center py-8">
                <v-icon size="64" color="grey">mdi-account-off</v-icon>
                <p class="text-h6 mt-2">Пользователь не авторизован</p>
                <p class="text-body-2 text-medium-emphasis">
                  Войдите в систему для просмотра профиля
                </p>
                <v-btn
                  color="primary"
                  class="mt-4"
                  @click="$router.push('/login')"
                >
                  Войти в систему
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { defineComponent, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/context/auth'

export default defineComponent({
  name: 'Profile',
  setup() {
    const router = useRouter()
    const auth = useAuth()


    const getRoleColor = (role) => {
      const colors = {
        admin: 'success',
        manager: 'primary',
        tech: 'warning',
        accountant: 'info',
        demo: 'purple',
        user: 'grey',
        partner: 'deep-purple',
        premium: 'amber'
      }
      return colors[role] || 'grey'
    }

    const getRoleLabel = (role) => {
      const labels = {
        admin: 'Администратор',
        manager: 'Менеджер',
        tech: 'Техник',
        accountant: 'Бухгалтер',
        demo: 'Демо',
        user: 'Пользователь',
        partner: 'Партнер',
        premium: 'Премиум'
      }
      return labels[role] || role
    }

    const getAccountTypeColor = (type) => {
      const colors = {
        partner: 'deep-purple',
        client: 'blue-grey',
        premium: 'amber',
        basic: 'blue',
        trial: 'orange',
        demo: 'purple',
        free: 'grey'
      }
      return colors[type] || 'primary'
    }

    const getAccountTypeLabel = (type) => {
      const labels = {
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

    const getLanguageLabel = (lang) => {
      const languages = {
        ru: 'Русский',
        en: 'English',
        de: 'Deutsch',
        fr: 'Français',
        es: 'Español'
      }
      return languages[lang] || lang
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'Не указано'
      
      try {
        const date = new Date(dateString)
        return date.toLocaleString('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch (error) {
        return dateString
      }
    }

    // Проверяем авторизацию при монтировании
    onMounted(() => {
      if (!auth.isAuthenticated.value) {
        router.push('/login')
      }
    })

    return {
      auth,
      getRoleColor,
      getRoleLabel,
      getAccountTypeColor,
      getAccountTypeLabel,
      getLanguageLabel,
      formatDate,
    }
  },
})
</script>

<style scoped>
.profile-page {
  padding: 20px 0;
}

.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
