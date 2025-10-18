<template>
  <div class="local-profile">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-account-circle</v-icon>
              Профиль пользователя
              <v-spacer />
              <v-chip
                :color="getRoleColor(user?.role)"
                variant="tonal"
                size="small"
              >
                {{ getRoleLabel(user?.role) }}
              </v-chip>
            </v-card-title>

            <v-card-text>
              <v-row v-if="user">
                <!-- Основная информация -->
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="mb-4">
                    <v-card-title class="text-h6">
                      <v-icon class="mr-2">mdi-account</v-icon>
                      Основная информация
                    </v-card-title>
                    <v-card-text>
                      <v-list density="compact">
                        <v-list-item>
                          <v-list-item-title>ID пользователя</v-list-item-title>
                          <v-list-item-subtitle>{{ user.id }}</v-list-item-subtitle>
                        </v-list-item>
                        
                        <v-list-item>
                          <v-list-item-title>Логин</v-list-item-title>
                          <v-list-item-subtitle>{{ user.username }}</v-list-item-subtitle>
                        </v-list-item>
                        
                        <v-list-item v-if="user.name">
                          <v-list-item-title>Имя</v-list-item-title>
                          <v-list-item-subtitle>{{ user.name }}</v-list-item-subtitle>
                        </v-list-item>
                        
                        <v-list-item v-if="user.email">
                          <v-list-item-title>Email</v-list-item-title>
                          <v-list-item-subtitle>{{ user.email }}</v-list-item-subtitle>
                        </v-list-item>
                        
                        <v-list-item>
                          <v-list-item-title>Роль</v-list-item-title>
                          <v-list-item-subtitle>
                            <v-chip
                              :color="getRoleColor(user.role)"
                              variant="tonal"
                              size="small"
                            >
                              {{ getRoleLabel(user.role) }}
                            </v-chip>
                          </v-list-item-subtitle>
                        </v-list-item>
                        
                        <v-list-item>
                          <v-list-item-title>Статус</v-list-item-title>
                          <v-list-item-subtitle>
                            <v-chip
                              :color="user.is_active ? 'success' : 'error'"
                              variant="tonal"
                              size="small"
                            >
                              {{ user.is_active ? 'Активен' : 'Неактивен' }}
                            </v-chip>
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-card-text>
                  </v-card>
                </v-col>

                <!-- Статистика -->
                <v-col cols="12" md="6">
                  <v-card variant="outlined" class="mb-4">
                    <v-card-title class="text-h6">
                      <v-icon class="mr-2">mdi-chart-line</v-icon>
                      Статистика
                    </v-card-title>
                    <v-card-text>
                      <v-list density="compact">
                        <v-list-item>
                          <v-list-item-title>ID компании</v-list-item-title>
                          <v-list-item-subtitle>{{ user.company_id }}</v-list-item-subtitle>
                        </v-list-item>
                        
                        <v-list-item>
                          <v-list-item-title>Количество входов</v-list-item-title>
                          <v-list-item-subtitle>{{ user.login_count || 0 }}</v-list-item-subtitle>
                        </v-list-item>
                        
                        <v-list-item v-if="user.last_login">
                          <v-list-item-title>Последний вход</v-list-item-title>
                          <v-list-item-subtitle>{{ formatDate(user.last_login) }}</v-list-item-subtitle>
                        </v-list-item>
                        
                        <v-list-item>
                          <v-list-item-title>Дата создания</v-list-item-title>
                          <v-list-item-subtitle>{{ formatDate(user.created_at) }}</v-list-item-subtitle>
                        </v-list-item>
                        
                        <v-list-item>
                          <v-list-item-title>Последнее обновление</v-list-item-title>
                          <v-list-item-subtitle>{{ formatDate(user.updated_at) }}</v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-card-text>
                  </v-card>
                </v-col>

                <!-- Права доступа -->
                <v-col cols="12">
                  <v-card variant="outlined">
                    <v-card-title class="text-h6">
                      <v-icon class="mr-2">mdi-shield-account</v-icon>
                      Права доступа
                    </v-card-title>
                    <v-card-text>
                      <v-row>
                        <v-col cols="12" sm="6" md="3">
                          <v-card 
                            :color="localAuth.isAdmin.value ? 'success' : 'grey-lighten-3'"
                            variant="tonal"
                          >
                            <v-card-text class="text-center">
                              <v-icon 
                                size="large" 
                                :color="localAuth.isAdmin.value ? 'success' : 'grey'"
                              >
                                mdi-shield-crown
                              </v-icon>
                              <div class="text-h6 mt-2">Администратор</div>
                              <div class="text-caption">
                                {{ localAuth.isAdmin.value ? 'Доступно' : 'Недоступно' }}
                              </div>
                            </v-card-text>
                          </v-card>
                        </v-col>
                        
                        <v-col cols="12" sm="6" md="3">
                          <v-card 
                            :color="localAuth.isManager.value ? 'primary' : 'grey-lighten-3'"
                            variant="tonal"
                          >
                            <v-card-text class="text-center">
                              <v-icon 
                                size="large" 
                                :color="localAuth.isManager.value ? 'primary' : 'grey'"
                              >
                                mdi-account-tie
                              </v-icon>
                              <div class="text-h6 mt-2">Менеджер</div>
                              <div class="text-caption">
                                {{ localAuth.isManager.value ? 'Доступно' : 'Недоступно' }}
                              </div>
                            </v-card-text>
                          </v-card>
                        </v-col>
                        
                        <v-col cols="12" sm="6" md="3">
                          <v-card 
                            :color="localAuth.isTech.value ? 'warning' : 'grey-lighten-3'"
                            variant="tonal"
                          >
                            <v-card-text class="text-center">
                              <v-icon 
                                size="large" 
                                :color="localAuth.isTech.value ? 'warning' : 'grey'"
                              >
                                mdi-tools
                              </v-icon>
                              <div class="text-h6 mt-2">Техник</div>
                              <div class="text-caption">
                                {{ localAuth.isTech.value ? 'Доступно' : 'Недоступно' }}
                              </div>
                            </v-card-text>
                          </v-card>
                        </v-col>
                        
                        <v-col cols="12" sm="6" md="3">
                          <v-card 
                            :color="localAuth.isAccountant.value ? 'info' : 'grey-lighten-3'"
                            variant="tonal"
                          >
                            <v-card-text class="text-center">
                              <v-icon 
                                size="large" 
                                :color="localAuth.isAccountant.value ? 'info' : 'grey'"
                              >
                                mdi-calculator
                              </v-icon>
                              <div class="text-h6 mt-2">Бухгалтер</div>
                              <div class="text-caption">
                                {{ localAuth.isAccountant.value ? 'Доступно' : 'Недоступно' }}
                              </div>
                            </v-card-text>
                          </v-card>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>


              <!-- Действия -->
              <v-row class="mt-4">
                <v-col cols="12">
                  <v-card variant="outlined">
                    <v-card-title class="text-h6">
                      <v-icon class="mr-2">mdi-cog</v-icon>
                      Действия
                    </v-card-title>
                    <v-card-text>
                      <div class="d-flex flex-wrap gap-2">
                        <v-btn
                          color="primary"
                          variant="outlined"
                          @click="refreshUserData"
                          :loading="isRefreshing"
                        >
                          <v-icon left>mdi-refresh</v-icon>
                          Обновить данные
                        </v-btn>
                        
                        <v-btn
                          color="warning"
                          variant="outlined"
                          @click="handleLogout"
                          :loading="isLoading"
                        >
                          <v-icon left>mdi-logout</v-icon>
                          Выйти из системы
                        </v-btn>
                        
                        <v-btn
                          v-if="localAuth.isAdmin.value"
                          color="success"
                          variant="outlined"
                          @click="$router.push('/admin/users')"
                        >
                          <v-icon left>mdi-account-multiple</v-icon>
                          Управление пользователями
                        </v-btn>
                        
                        <ForceLogout
                          text="Принудительный выход"
                          variant="danger"
                          button-variant="outlined"
                          size="default"
                          @logout="handleForceLogout"
                        />
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Диалог подтверждения выхода -->
    <v-dialog v-model="logoutDialog" max-width="400">
      <v-card>
        <v-card-title>Подтверждение выхода</v-card-title>
        <v-card-text>
          Вы уверены, что хотите выйти из системы?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="logoutDialog = false">Отмена</v-btn>
          <v-btn 
            color="warning" 
            @click="confirmLogout"
            :loading="isLoading"
          >
            Выйти
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLocalAuth } from '@/composables/useLocalAuth'
import TokenDisplay from '@/components/Auth/TokenDisplay.vue'
import ForceLogout from '@/components/Auth/ForceLogout.vue'

export default defineComponent({
  name: 'LocalProfile',
  components: {
    TokenDisplay,
    ForceLogout
  },
  setup() {
    const router = useRouter()
    const localAuth = useLocalAuth()
    
    const isRefreshing = ref(false)
    const logoutDialog = ref(false)

    // Методы
    const refreshUserData = async () => {
      isRefreshing.value = true
      try {
        await localAuth.getCurrentUser()
        console.log('✅ User data refreshed')
      } catch (error) {
        console.error('Failed to refresh user data:', error)
      } finally {
        isRefreshing.value = false
      }
    }

    const handleLogout = () => {
      logoutDialog.value = true
    }

    const confirmLogout = async () => {
      try {
        await localAuth.logout()
        router.push('/local-login')
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        logoutDialog.value = false
      }
    }

    const handleClearTokens = () => {
      localAuth.logout()
      router.push('/local-login')
    }

    const handleForceLogout = () => {
      console.log('🚨 Force logout from LocalProfile')
      // Функция принудительного выхода уже обрабатывается в компоненте ForceLogout
    }

    const getRoleColor = (role) => {
      const colors = {
        admin: 'success',
        manager: 'primary',
        tech: 'warning',
        accountant: 'info',
        user: 'grey'
      }
      return colors[role] || 'grey'
    }

    const getRoleLabel = (role) => {
      const labels = {
        admin: 'Администратор',
        manager: 'Менеджер',
        tech: 'Техник',
        accountant: 'Бухгалтер',
        user: 'Пользователь'
      }
      return labels[role] || 'Неизвестно'
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
        return 'Неверный формат даты'
      }
    }

    // Проверяем авторизацию при монтировании
    onMounted(() => {
      if (!localAuth.isAuthenticated.value) {
        router.push('/local-login')
      }
    })

    return {
      // From localAuth
      user: localAuth.user,
      isLoading: localAuth.isLoading,
      localAuth,

      // Local state
      isRefreshing,
      logoutDialog,

      // Methods
      refreshUserData,
      handleLogout,
      confirmLogout,
      handleClearTokens,
      handleForceLogout,
      getRoleColor,
      getRoleLabel,
      formatDate,
    }
  },
})
</script>

<style scoped>
.local-profile {
  padding: 20px 0;
}

.gap-2 {
  gap: 8px;
}

.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
