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

    <!-- Mobile — старый компонент пока без редизайна -->
    <MobileDashboard v-if="mobile" />

    <template v-else>
      <!-- Top: KPI bar (4 фиксированные метрики с дельтами) -->
      <KPIBar ref="kpiBar" />

      <!-- Alerts row (показывается только если есть active алерты) -->
      <AlertsRow ref="alertsRow" />

      <!-- Today: монтажи + последние счета -->
      <v-row dense>
        <v-col cols="12" md="6">
          <TodayInstallations ref="todayInst" />
        </v-col>
        <v-col cols="12" md="6">
          <RecentInvoices ref="recentInv" />
        </v-col>
      </v-row>

      <!-- Customizable widgets row — сворачивается по умолчанию -->
      <v-expansion-panels v-model="advancedOpen" class="mt-4" variant="accordion">
        <v-expansion-panel value="advanced">
          <v-expansion-panel-title>
            <v-icon class="mr-2">mdi-view-dashboard-edit-outline</v-icon>
            Расширенные виджеты
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <DashboardGrid />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </template>

  </v-container>
</template>

<script lang="ts">
import DashboardGrid from '@/components/Dashboard/DashboardGrid.vue';
import MobileDashboard from '@/components/Dashboard/MobileDashboard.vue';
import KPIBar from '@/components/Dashboard/KPIBar.vue';
import AlertsRow from '@/components/Dashboard/AlertsRow.vue';
import TodayInstallations from '@/components/Dashboard/TodayInstallations.vue';
import RecentInvoices from '@/components/Dashboard/RecentInvoices.vue';
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
    KPIBar,
    AlertsRow,
    TodayInstallations,
    RecentInvoices
  },
  setup() {
    const router = useRouter();
    const dashboardStore = useDashboardStoreWithInit();
    const auth = useAuth();
    const { mobile } = useDisplay();
    const isRefreshing = ref(false);
    const updateLastRefresh = useSystemRefresh();

    // Refs к новым секциям — для refresh-all
    const kpiBar = ref<{ reload: () => Promise<void> } | null>(null);
    const alertsRow = ref<{ reload: () => Promise<void> } | null>(null);
    const todayInst = ref<{ reload: () => Promise<void> } | null>(null);
    const recentInv = ref<{ reload: () => Promise<void> } | null>(null);

    // Состояние раскрытия аккордеона расширенных виджетов
    const advancedOpen = ref<string[] | string | undefined>([]);

    // Computed properties
    const error = computed(() => dashboardStore.error);

    // Methods
    const refreshDashboard = async () => {
      try {
        isRefreshing.value = true;
        await Promise.all([
          kpiBar.value?.reload(),
          alertsRow.value?.reload(),
          todayInst.value?.reload(),
          recentInv.value?.reload(),
          dashboardStore.refreshAll(),
        ]);
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

    onMounted(() => {
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
      clearError,
      kpiBar,
      alertsRow,
      todayInst,
      recentInv,
      advancedOpen,
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