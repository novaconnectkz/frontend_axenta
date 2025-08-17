<template>
  <v-container fluid class="dashboard-container">
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">
              Добро пожаловать, {{ auth.user.value?.name || 'Пользователь' }}!
            </h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              {{ formatDate(new Date()) }}
            </p>
          </div>
          
          <div class="d-flex align-center gap-2">
            <v-btn
              icon="mdi-refresh"
              variant="outlined"
              @click="refreshDashboard"
              :loading="isRefreshing"
              title="Обновить данные"
            />
            
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-account-circle"
                  variant="outlined"
                  v-bind="props"
                />
              </template>
              <v-list>
                <v-list-item>
                  <v-list-item-title>{{ auth.user.value?.name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ auth.user.value?.accountName }}</v-list-item-subtitle>
                </v-list-item>
                <v-divider />
                <v-list-item to="/profile">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-account-cog" />
                  </template>
                  <v-list-item-title>Профиль</v-list-item-title>
                </v-list-item>
                <v-list-item to="/settings">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-cog" />
                  </template>
                  <v-list-item-title>Настройки</v-list-item-title>
                </v-list-item>
                <v-divider />
                <v-list-item @click="handleLogout">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-logout" />
                  </template>
                  <v-list-item-title>Выйти</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Error State -->
    <v-row v-if="error">
      <v-col cols="12">
        <v-alert
          type="error"
          variant="tonal"
          closable
          @click:close="clearError"
        >
          <template v-slot:title>
            Ошибка загрузки Dashboard
          </template>
          {{ error }}
          <template v-slot:append>
            <v-btn
              color="error"
              variant="outlined"
              size="small"
              @click="refreshDashboard"
            >
              Попробовать снова
            </v-btn>
          </template>
        </v-alert>
      </v-col>
    </v-row>

    <!-- Dashboard Grid -->
    <DashboardGrid />

    <!-- System Status Bar -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card variant="tonal" color="surface">
          <v-card-text class="py-2">
            <div class="d-flex align-center justify-space-between text-caption">
              <div class="d-flex align-center">
                <v-icon icon="mdi-circle" size="8" color="success" class="me-2" />
                <span>Система работает нормально</span>
              </div>
              
              <div class="d-flex align-center gap-4">
                <span v-if="lastRefresh">
                  Последнее обновление: {{ formatTime(lastRefresh) }}
                </span>
                
                <span>
                  Компания: {{ auth.company.value?.name || 'Не указана' }}
                </span>
                
                <span>
                  Версия: 1.0.0
                </span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import DashboardGrid from '@/components/Dashboard/DashboardGrid.vue';
import { useAuth } from '@/context/auth';
import { useDashboardStore } from '@/store/dashboard';
import { computed, defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'Dashboard',
  components: {
    DashboardGrid
  },
  setup() {
    const auth = useAuth();
    const router = useRouter();
    const dashboardStore = useDashboardStore();
    const isRefreshing = ref(false);

    // Computed properties
    const error = computed(() => dashboardStore.error);
    const lastRefresh = computed(() => dashboardStore.lastRefresh);

    // Methods
    const handleLogout = () => {
      auth.logout();
      router.push('/login');
    };

    const refreshDashboard = async () => {
      try {
        isRefreshing.value = true;
        await dashboardStore.refreshAll();
      } catch (error) {
        console.error('Ошибка обновления Dashboard:', error);
      } finally {
        isRefreshing.value = false;
      }
    };

    const clearError = () => {
      dashboardStore.clearError();
    };

    const formatDate = (date: Date): string => {
      return date.toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatTime = (date: Date): string => {
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return {
      auth,
      error,
      lastRefresh,
      isRefreshing,
      handleLogout,
      refreshDashboard,
      clearError,
      formatDate,
      formatTime
    };
  }
});
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: rgb(var(--v-theme-surface));
}

.gap-2 {
  gap: 8px;
}

.gap-4 {
  gap: 16px;
}
</style>