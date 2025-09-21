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

    <!-- System Status Bar перенесен в боковое меню -->
  </v-container>
</template>

<script lang="ts">
import DashboardGrid from '@/components/Dashboard/DashboardGrid.vue';
import MobileDashboard from '@/components/Dashboard/MobileDashboard.vue';
import MockModeToggle from '@/components/Dashboard/MockModeToggle.vue';
import { useAuth } from '@/context/auth';
import { useSystemRefresh } from '@/composables/useSystemRefresh';
import { useDashboardStoreWithInit } from '@/store/dashboard';
import { computed, defineComponent, onMounted, ref } from 'vue';
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
    const updateLastRefresh = useSystemRefresh();

    // Computed properties
    const error = computed(() => dashboardStore.error);

    // Methods

    const refreshDashboard = async () => {
      try {
        isRefreshing.value = true;
        await dashboardStore.refreshAll();
        // Обновляем время последнего обновления после успешной загрузки данных
        updateLastRefresh();
      } catch (error) {
        console.error('Ошибка обновления Dashboard:', error);
      } finally {
        isRefreshing.value = false;
      }
    };

    const clearError = () => {
      dashboardStore.clearError();
    };

    // Обновляем время при монтировании компонента (когда данные уже загружены)
    onMounted(() => {
      // Небольшая задержка, чтобы дать время данным загрузиться
      setTimeout(() => {
        updateLastRefresh();
      }, 100);
    });

    return {
      auth,
      mobile,
      error,
      isRefreshing,
      refreshDashboard,
      clearError
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