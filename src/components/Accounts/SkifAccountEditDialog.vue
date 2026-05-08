<template>
  <v-dialog v-model="show" width="900" max-width="95vw" persistent scrollable>
    <AppleCard v-if="account" class="dlg">
      <template #header>
        <div class="hd">
          <h3>Свойства SKIF-аккаунта</h3>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
        </div>
        <div class="sub">
          {{ account.name }} • SKIF
        </div>
      </template>

      <v-tabs v-model="tab" density="compact" align-tabs="start">
        <v-tab value="main">Основное</v-tab>
        <v-tab value="units">Юниты ({{ unitsTotal }})</v-tab>
      </v-tabs>

      <v-window v-model="tab" class="body">
        <v-window-item value="main">
          <div class="info-grid">
            <div class="row">
              <span class="label">Название компании</span>
              <span class="value">{{ account.name || '—' }}</span>
            </div>
            <div class="row">
              <span class="label">UUID компании в SKIF</span>
              <span class="value mono">{{ account.skifCompanyId || '—' }}</span>
            </div>
            <div class="row">
              <span class="label">Подключение SKIF</span>
              <span class="value">{{ account.parentAccountName || '—' }}</span>
            </div>
            <div class="row">
              <span class="label">Объектов всего</span>
              <span class="value">{{ account.objectsTotal ?? 0 }}</span>
            </div>
            <div class="row">
              <span class="label">Объектов активных</span>
              <span class="value">{{ account.objectsActive ?? 0 }}</span>
            </div>
            <div class="row">
              <span class="label">Дата создания</span>
              <span class="value">{{ account.creationDatetime ? formatDate(account.creationDatetime) : '—' }}</span>
            </div>
          </div>

          <!-- Block status -->
          <v-alert v-if="isBlocked" type="error" variant="tonal" density="compact" class="mt-3">
            <div class="d-flex align-center justify-space-between flex-wrap" style="gap: 8px;">
              <div><strong>Компания заблокирована.</strong> Юзеры не могут войти.</div>
              <v-btn color="success" variant="elevated" size="small" :loading="unblocking" @click="onUnblock">
                Разблокировать
              </v-btn>
            </div>
          </v-alert>

          <v-alert v-else-if="!pendingDeleteFor" type="info" variant="tonal" density="compact" class="mt-3">
            SKIF-учётка. Управление: блокировка/разблокировка/удаление.
          </v-alert>

          <!-- Countdown badge: SKIF удалит компанию через N дней -->
          <v-alert v-else type="warning" variant="tonal" density="compact" class="mt-3">
            <div class="d-flex align-center justify-space-between flex-wrap" style="gap: 8px;">
              <div>
                <strong>Удаление запланировано.</strong>
                Через <b>{{ daysLeft }} {{ daysWord }}</b> ({{ formatDate(pendingDeleteFor) }}) SKIF удалит компанию.
              </div>
              <v-btn
                color="warning"
                variant="elevated"
                size="small"
                :loading="canceling"
                @click="onCancelDelete"
              >
                Отменить удаление
              </v-btn>
            </div>
          </v-alert>

          <!-- Actions: блокировка + удаление -->
          <div v-if="!pendingDeleteFor" class="actions-section mt-4">
            <div class="actions-row">
              <v-btn
                v-if="!isBlocked"
                color="warning"
                variant="outlined"
                prepend-icon="mdi-lock-outline"
                :loading="blocking"
                @click="onBlock"
              >
                Заблокировать
              </v-btn>
              <v-btn
                color="error"
                variant="outlined"
                prepend-icon="mdi-delete-outline"
                :loading="deleting"
                @click="onScheduleDelete"
              >
                Запланировать удаление
              </v-btn>
            </div>
            <div class="hint mt-1">
              Удаление: SKIF уберёт компанию через 14 дней (до этого можно отменить).
            </div>
          </div>
        </v-window-item>

        <v-window-item value="units">
          <div v-if="unitsLoading" class="loading">
            <v-progress-circular indeterminate size="24" />
            <span>Загрузка юнитов…</span>
          </div>
          <div v-else-if="units.length === 0" class="empty">Нет юнитов</div>
          <v-data-table
            v-else
            :headers="unitHeaders"
            :items="units"
            density="compact"
            items-per-page="20"
          />
        </v-window-item>
      </v-window>

      <template #footer>
        <div class="ft">
          <v-spacer />
          <v-btn variant="text" @click="close">Закрыть</v-btn>
        </div>
      </template>
    </AppleCard>
  </v-dialog>
</template>

<script setup lang="ts">
import AppleCard from '@/components/Apple/AppleCard.vue';
import { apiClient } from '@/services/api';
import { skifAccountsService } from '@/services/skifAccountsService';
import { computed, ref, watch } from 'vue';

interface SkifAccount {
  id: number;
  name?: string;
  skifCompanyId?: string;
  parentAccountName?: string;
  objectsTotal?: number;
  objectsActive?: number;
  creationDatetime?: string;
  connectionId?: number;
  deleteScheduledFor?: string;
  isActive?: boolean;
}

interface SkifUnit {
  id: number;
  skif_unit_id: string;
  name: string;
  imei: string;
  phone: string;
  model: string;
  is_active: boolean;
  skif_company_id: string;
  skif_company: string;
  skif_created_at?: string;
}

const props = defineProps<{ modelValue: boolean; account: SkifAccount | null }>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'changed'): void;
  (e: 'snack', p: { text: string; color: 'success' | 'error' | 'info' | 'warning' }): void;
}>();

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const tab = ref<'main' | 'units'>('main');
const units = ref<SkifUnit[]>([]);
const unitsLoading = ref(false);
const unitsTotal = computed(() => units.value.length);

const deleting = ref(false);
const canceling = ref(false);
const blocking = ref(false);
const unblocking = ref(false);

// Локальный override блок-статуса (мгновенный UI после block/unblock).
// Сбрасывается в null при смене account, тогда читается реальное props.account.isActive.
const blockOverride = ref<boolean | null>(null);
const isBlocked = computed(() => {
  if (blockOverride.value !== null) return blockOverride.value;
  // isActive=false из /unified/accounts (источник: skif_company_statuses.company_status != "ACTIVE")
  return props.account?.isActive === false;
});

// Локальный override чтобы UI обновлялся сразу после schedule/cancel
// без ожидания refresh всего /unified/accounts.
const pendingOverride = ref<string | null | undefined>(undefined);
const pendingDeleteFor = computed<string | null>(() => {
  if (pendingOverride.value !== undefined) return pendingOverride.value;
  return props.account?.deleteScheduledFor || null;
});
const daysLeft = computed(() => {
  if (!pendingDeleteFor.value) return 0;
  const ms = new Date(pendingDeleteFor.value).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
});
const daysWord = computed(() => {
  const n = daysLeft.value;
  const last = n % 10;
  const last2 = n % 100;
  if (last2 >= 11 && last2 <= 14) return 'дней';
  if (last === 1) return 'день';
  if (last >= 2 && last <= 4) return 'дня';
  return 'дней';
});

const onScheduleDelete = async () => {
  if (!props.account?.connectionId || !props.account?.skifCompanyId) return;
  if (!confirm(`Запланировать удаление компании "${props.account.name}"?\nSKIF удалит её через 14 дней. До этого срока можно отменить.`)) return;
  deleting.value = true;
  try {
    const r = await skifAccountsService.scheduleDelete(props.account.connectionId, props.account.skifCompanyId);
    if (!r.ok) {
      emit('snack', { text: r.error || 'Ошибка', color: 'error' });
      return;
    }
    pendingOverride.value = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    emit('snack', { text: 'Удаление запланировано', color: 'warning' });
    emit('changed');
  } finally {
    deleting.value = false;
  }
};

const onBlock = async () => {
  if (!props.account?.connectionId || !props.account?.skifCompanyId) return;
  if (!confirm(`Заблокировать компанию "${props.account.name}"?\nПользователи не смогут войти. Терминалы продолжат отправлять данные.`)) return;
  blocking.value = true;
  try {
    const r = await skifAccountsService.block(props.account.connectionId, props.account.skifCompanyId, 'terminals_not_block');
    if (!r.ok) {
      emit('snack', { text: r.error || 'Ошибка', color: 'error' });
      return;
    }
    blockOverride.value = true;
    emit('snack', { text: 'Компания заблокирована', color: 'warning' });
    emit('changed');
  } finally {
    blocking.value = false;
  }
};

const onUnblock = async () => {
  if (!props.account?.connectionId || !props.account?.skifCompanyId) return;
  unblocking.value = true;
  try {
    const r = await skifAccountsService.unblock(props.account.connectionId, props.account.skifCompanyId);
    if (!r.ok) {
      emit('snack', { text: r.error || 'Ошибка', color: 'error' });
      return;
    }
    blockOverride.value = false;
    emit('snack', { text: 'Компания разблокирована', color: 'success' });
    emit('changed');
  } finally {
    unblocking.value = false;
  }
};

const onCancelDelete = async () => {
  if (!props.account?.connectionId || !props.account?.skifCompanyId) return;
  canceling.value = true;
  try {
    const r = await skifAccountsService.cancelDelete(props.account.connectionId, props.account.skifCompanyId);
    if (!r.ok) {
      emit('snack', { text: r.error || 'Ошибка', color: 'error' });
      return;
    }
    pendingOverride.value = null;
    emit('snack', { text: 'Удаление отменено', color: 'success' });
    emit('changed');
  } finally {
    canceling.value = false;
  }
};

const unitHeaders = [
  { title: 'Название', key: 'name', sortable: true },
  { title: 'IMEI', key: 'imei', sortable: true },
  { title: 'Модель', key: 'model', sortable: true },
  { title: 'Активен', key: 'is_active', sortable: true },
];

const loadUnits = async () => {
  if (!props.account?.connectionId || !props.account?.skifCompanyId) return;
  unitsLoading.value = true;
  try {
    const r = await apiClient.get(`/auth/skif/connections/${props.account.connectionId}/units`);
    const all: SkifUnit[] = r.data?.data || [];
    units.value = all.filter(u => u.skif_company_id === props.account?.skifCompanyId);
  } catch (e) {
    console.error('skif units load error', e);
    units.value = [];
  } finally {
    unitsLoading.value = false;
  }
};

watch(
  () => [props.modelValue, props.account?.skifCompanyId],
  async () => {
    if (!props.modelValue || !props.account) return;
    tab.value = 'main';
    pendingOverride.value = undefined; // сбрасываем override на свежий account
    blockOverride.value = null;
    await loadUnits();
  },
  { immediate: true },
);

const close = () => { show.value = false; };

const formatDate = (s: string) => {
  try {
    return new Date(s).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return s;
  }
};
</script>

<style scoped>
.dlg { display: flex; flex-direction: column; max-height: 80vh; }
.dlg :deep(.apple-card-content) { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.hd { display: flex; align-items: center; gap: 8px; }
.sub { font-size: 12px; color: rgba(0, 0, 0, 0.6); padding-left: 4px; }
.body { padding: 16px 4px 4px; display: flex; flex-direction: column; flex: 1; min-height: 0; overflow-y: auto; }
.body :deep(.v-window) { flex: 1; min-height: 0; }
.info-grid { display: flex; flex-direction: column; gap: 10px; padding: 8px 4px; }
.row { display: grid; grid-template-columns: 220px 1fr; gap: 12px; align-items: baseline; }
.label { font-size: 13px; color: rgba(0, 0, 0, 0.6); font-weight: 500; }
.value { font-size: 14px; color: rgba(0, 0, 0, 0.87); }
.value.mono { font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 12px; }
.loading { display: flex; align-items: center; gap: 8px; padding: 24px; color: rgba(0, 0, 0, 0.6); }
.empty { padding: 24px; text-align: center; color: rgba(0, 0, 0, 0.6); }
.ft { display: flex; align-items: center; gap: 8px; padding: 8px 0; }
.actions-section { padding: 16px; background: rgba(0, 0, 0, 0.02); border-radius: 8px; border: 1px solid rgba(0, 0, 0, 0.08); }
.actions-row { display: flex; gap: 8px; flex-wrap: wrap; }
.hint { font-size: 12px; color: rgba(0, 0, 0, 0.6); }
[data-theme="dark"] .actions-section { background: rgba(255, 255, 255, 0.02); border-color: rgba(255, 255, 255, 0.08); }
[data-theme="dark"] .hint { color: rgba(255, 255, 255, 0.6); }

[data-theme="dark"] .label { color: rgba(255, 255, 255, 0.6); }
[data-theme="dark"] .value { color: rgba(255, 255, 255, 0.87); }
[data-theme="dark"] .sub { color: rgba(255, 255, 255, 0.6); }
</style>
