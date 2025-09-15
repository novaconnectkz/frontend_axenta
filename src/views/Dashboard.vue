<template>
  <v-container fluid class="dashboard-container">

    <!-- Error State -->
    <v-row v-if="error">
      <v-col cols="12">
        <v-alert type="error" variant="tonal" closable @click:close="clearError">
          <template v-slot:title>
            Ошибка загрузки Dashboard
          </template>
          {{ error }}
          <template v-slot:append>
            <v-btn color="error" variant="outlined" size="small" @click="refreshDashboard">
              Попробовать снова
            </v-btn>
          </template>
        </v-alert>
      </v-col>
    </v-row>

    <!-- Dashboard Grid -->
    <MobileDashboard v-if="mobile" />
    <DashboardGrid v-else />

    <!-- Mock Mode Toggle (только в development) -->
    <MockModeToggle />

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
                  Компания: {{ auth?.company?.value?.name || 'Не указана' }}
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
import MobileDashboard from '@/components/Dashboard/MobileDashboard.vue';
import MockModeToggle from '@/components/Dashboard/MockModeToggle.vue';
import { useAuth } from '@/context/auth';
import { useDashboardStoreWithInit } from '@/store/dashboard';
import { computed, defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';

export default defineComponent({
  name: 'Dashboard',
  components: {
    DashboardGrid,
    MobileDashboard,
    MockModeToggle
  },
  setup() {
    const router = useRouter();
    const dashboardStore = useDashboardStoreWithInit();
    const auth = useAuth();
    const { mobile } = useDisplay();
    const isRefreshing = ref(false);

    // Computed properties
    const error = computed(() => dashboardStore.error);
    const lastRefresh = computed(() => dashboardStore.lastRefresh);

    // Methods

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

    const formatTime = (date: Date): string => {
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return {
      auth,
      mobile,
      error,
      lastRefresh,
      isRefreshing,
      refreshDashboard,
      clearError,
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