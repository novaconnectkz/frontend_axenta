<template>
  <v-dialog v-model="show" max-width="780">
    <AppleCard v-if="account">
      <template #header>
        <div class="hd">
          <h3>Свойства Wialon-аккаунта</h3>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
        </div>
        <div class="sub">
          {{ account.name }} • ID {{ account.id }} • {{ account.source_label || account.sourceLabel }}
        </div>
      </template>

      <v-tabs v-model="tab" density="compact" align-tabs="start" show-arrows>
        <v-tab value="main">Основное</v-tab>
        <v-tab value="services">Услуги</v-tab>
        <v-tab value="billing">Биллинг</v-tab>
        <v-tab value="rights">Права</v-tab>
        <v-tab value="access">Доступ</v-tab>
        <v-tab value="custom">Произвольные поля</v-tab>
        <v-tab value="extra">Дополнительно</v-tab>
        <v-tab value="payment">Платёж</v-tab>
        <v-tab value="history">Статистика</v-tab>
      </v-tabs>

      <v-window v-model="tab" class="body">
        <!-- ОСНОВНОЕ -->
        <v-window-item value="main">
          <v-text-field v-model="form.name" label="Название" variant="outlined" density="comfortable" hide-details="auto" />
          <v-switch v-model="form.enable" :label="form.enable ? 'Активен' : 'Заблокирован'" color="primary" hide-details inset />
          <div class="meta">
            <span><b>Дата создания:</b> {{ details?.created_at ? formatDate(details.created_at) : '—' }}</span>
            <span><b>Родитель:</b> {{ details?.parent_account_name || '—' }}</span>
          </div>
        </v-window-item>

        <!-- БИЛЛИНГ -->
        <v-window-item value="billing">
          <v-autocomplete
            v-model="form.plan"
            label="Тарифный план"
            :items="planOptions"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :loading="loadingPlans"
          />
          <div class="row2">
            <v-text-field v-model.number="form.history_period" label="Период хранения (дни)" type="number" variant="outlined" density="comfortable" hide-details="auto" />
            <v-text-field v-model.number="form.min_days" label="Min дней" type="number" variant="outlined" density="comfortable" hide-details="auto" />
          </div>
          <div class="row2">
            <v-text-field v-model.number="form.block_balance" label="blockBalance (блок при балансе)" type="number" step="0.01" variant="outlined" density="comfortable" hide-details="auto" />
            <v-text-field v-model.number="form.deny_balance" label="denyBalance (запрет платных услуг)" type="number" step="0.01" variant="outlined" density="comfortable" hide-details="auto" />
          </div>
          <v-text-field v-model.number="form.flags" label="Флаги учётной записи (uint)" type="number" variant="outlined" density="comfortable" hide-details="auto" />
          <div class="meta">
            <span><b>Баланс:</b> {{ details?.balance || details?.balance_value || '—' }}</span>
            <span><b>Дней:</b> {{ details?.days_counter ?? '—' }}</span>
          </div>
        </v-window-item>

        <!-- ПРАВА -->
        <v-window-item value="rights">
          <v-switch v-model="form.dealer_rights" label="Дилерские права (sys_account_enable_parent)" color="primary" hide-details inset />
          <v-combobox
            v-if="form.dealer_rights"
            v-model="form.sub_plans"
            label="Подчинённые тарифы (sub_plans)"
            multiple chips clearable
            :items="planOptions"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
          />
        </v-window-item>

        <!-- УСЛУГИ -->
        <v-window-item value="services">
          <ServicesTab :connection-id="connId!" :user-id="account!.id" :visible="tab === 'services'" @snack="(p) => emit('snack', p)" />
        </v-window-item>

        <!-- ДОСТУП -->
        <v-window-item value="access">
          <AccessTab :connection-id="connId!" :user-id="account!.id" :visible="tab === 'access'" @snack="(p) => emit('snack', p)" />
        </v-window-item>

        <!-- ПРОИЗВОЛЬНЫЕ ПОЛЯ -->
        <v-window-item value="custom">
          <CustomFieldsTab :connection-id="connId!" :user-id="account!.id" :visible="tab === 'custom'" @snack="(p) => emit('snack', p)" />
        </v-window-item>

        <!-- ДОПОЛНИТЕЛЬНО -->
        <v-window-item value="extra">
          <ExtraTab :connection-id="connId!" :user-id="account!.id" :visible="tab === 'extra'" @snack="(p) => emit('snack', p)" />
        </v-window-item>

        <!-- СТАТИСТИКА -->
        <v-window-item value="history">
          <HistoryTab :connection-id="connId!" :user-id="account!.id" :visible="tab === 'history'" @snack="(p) => emit('snack', p)" />
        </v-window-item>

        <!-- ПЛАТЁЖ -->
        <v-window-item value="payment">
          <div class="hint">Сумма и дни могут быть отрицательными (списание).</div>
          <div class="row2">
            <v-text-field v-model.number="payment.balance_update" label="Сумма" type="number" step="0.01" variant="outlined" density="comfortable" hide-details="auto" />
            <v-text-field v-model.number="payment.days_update" label="Добавить дней" type="number" variant="outlined" density="comfortable" hide-details="auto" />
          </div>
          <v-text-field v-model="payment.description" label="Комментарий к платежу" variant="outlined" density="comfortable" hide-details="auto" />
          <v-btn color="success" :loading="paying" :disabled="!canPay" @click="doPayment">Провести платёж</v-btn>
        </v-window-item>
      </v-window>

      <template #footer>
        <div class="ft">
          <v-spacer />
          <v-btn variant="text" :disabled="saving" @click="close">Отмена</v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="!hasChanges || ['services','access','custom','extra','payment','history'].includes(tab)"
            @click="save"
          >Сохранить</v-btn>
        </div>
      </template>
    </AppleCard>
  </v-dialog>
</template>

<script setup lang="ts">
import AppleCard from '@/components/Apple/AppleCard.vue';
import { apiClient } from '@/services/api';
import { computed, ref, watch } from 'vue';
import ServicesTab from './wialon-tabs/ServicesTab.vue';
import AccessTab from './wialon-tabs/AccessTab.vue';
import CustomFieldsTab from './wialon-tabs/CustomFieldsTab.vue';
import ExtraTab from './wialon-tabs/ExtraTab.vue';
import HistoryTab from './wialon-tabs/HistoryTab.vue';

interface Account {
  id: number;
  name?: string;
  source?: string;
  source_label?: string;
  sourceLabel?: string;
  connection_id?: number;
  connectionId?: number;
  isActive?: boolean;
  is_active?: boolean;
  type?: string;
  dealer_rights?: boolean;
  dealerRights?: boolean;
}

interface Details {
  user_id: number;
  resource_id: number;
  plan?: string;
  sub_plans?: string[];
  enabled?: number;
  flags?: number;
  balance?: string;
  balance_value?: number;
  days_counter?: number;
  block_balance?: number;
  deny_balance?: number;
  history_period?: number;
  min_days?: number;
  dealer_rights?: boolean;
  parent_account_id?: number;
  parent_account_name?: string;
  created_at?: string;
}

const props = defineProps<{ modelValue: boolean; account: Account | null }>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'saved'): void;
  (e: 'snack', p: { text: string; color: 'success' | 'error' | 'info' }): void;
}>();

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const tab = ref<'main' | 'services' | 'billing' | 'rights' | 'access' | 'custom' | 'extra' | 'payment' | 'history'>('main');
const details = ref<Details | null>(null);
const planOptions = ref<string[]>([]);
const loadingPlans = ref(false);
const saving = ref(false);
const paying = ref(false);

const form = ref({
  name: '',
  enable: true,
  plan: '',
  dealer_rights: false,
  history_period: 0,
  min_days: 0,
  flags: 0,
  block_balance: 0,
  deny_balance: 0,
  sub_plans: [] as string[],
});
const initial = ref({ ...form.value });

const payment = ref({ balance_update: 0, days_update: 0, description: '' });

const connId = computed(() => props.account?.connection_id ?? props.account?.connectionId);

const reloadDetails = async () => {
  if (!props.account || !connId.value) return;
  try {
    const r = await apiClient.get(`/wialon/connections/${connId.value}/accounts/${props.account.id}`);
    details.value = r.data;
    const snap = {
      name: props.account.name || '',
      enable: (details.value!.enabled ?? 1) === 1,
      plan: details.value!.plan || '',
      dealer_rights: details.value!.dealer_rights || false,
      history_period: details.value!.history_period ?? 0,
      min_days: details.value!.min_days ?? 0,
      flags: details.value!.flags ?? 0,
      block_balance: details.value!.block_balance ?? 0,
      deny_balance: details.value!.deny_balance ?? 0,
      sub_plans: [...(details.value!.sub_plans || [])],
    };
    form.value = { ...snap };
    initial.value = { ...snap };
  } catch (e: any) {
    emit('snack', { text: 'Не удалось получить детали: ' + (e?.message || ''), color: 'error' });
  }
};

const loadPlans = async () => {
  if (!connId.value) return;
  loadingPlans.value = true;
  try {
    const r = await apiClient.get(`/wialon/connections/${connId.value}/billing-plans`);
    planOptions.value = (r.data?.plans || []).map((p: any) => p.name).filter(Boolean);
  } catch (e: any) {
    console.error('billing-plans error', e);
  } finally {
    loadingPlans.value = false;
  }
};

watch(
  () => [props.modelValue, props.account?.id],
  async () => {
    if (!props.modelValue || !props.account) return;
    tab.value = 'main';
    payment.value = { balance_update: 0, days_update: 0, description: '' };
    await Promise.all([reloadDetails(), loadPlans()]);
  },
  { immediate: true },
);

const hasChanges = computed(() => {
  const a = form.value, b = initial.value;
  if (a.name !== b.name) return true;
  if (a.enable !== b.enable) return true;
  if (a.plan !== b.plan) return true;
  if (a.dealer_rights !== b.dealer_rights) return true;
  if (a.history_period !== b.history_period) return true;
  if (a.min_days !== b.min_days) return true;
  if (a.flags !== b.flags) return true;
  if (a.block_balance !== b.block_balance) return true;
  if (a.deny_balance !== b.deny_balance) return true;
  if (JSON.stringify(a.sub_plans) !== JSON.stringify(b.sub_plans)) return true;
  return false;
});

const canPay = computed(() => payment.value.balance_update !== 0 || payment.value.days_update !== 0);

const close = () => { show.value = false; };

const formatDate = (s: string) => {
  try { return new Date(s).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return s; }
};

const save = async () => {
  if (!props.account || !connId.value) return;
  const a = form.value, b = initial.value;
  const payload: Record<string, any> = {};
  if (a.name !== b.name) payload.name = a.name;
  if (a.enable !== b.enable) payload.enable = a.enable;
  if (a.plan !== b.plan) payload.plan = a.plan;
  if (a.dealer_rights !== b.dealer_rights) payload.dealer_rights = a.dealer_rights;
  if (a.history_period !== b.history_period) payload.history_period = a.history_period;
  if (a.min_days !== b.min_days) payload.min_days = a.min_days;
  if (a.flags !== b.flags) payload.flags = a.flags;
  if (a.block_balance !== b.block_balance) payload.block_balance = a.block_balance;
  if (a.deny_balance !== b.deny_balance) payload.deny_balance = a.deny_balance;
  if (JSON.stringify(a.sub_plans) !== JSON.stringify(b.sub_plans)) payload.sub_plans = a.sub_plans;

  saving.value = true;
  try {
    await apiClient.put(`/wialon/connections/${connId.value}/accounts/${props.account.id}`, payload);
    emit('snack', { text: 'Сохранено', color: 'success' });
    emit('saved');
    close();
  } catch (e: any) {
    emit('snack', { text: e?.response?.data?.error || 'Ошибка сохранения', color: 'error' });
  } finally {
    saving.value = false;
  }
};

const doPayment = async () => {
  if (!props.account || !connId.value) return;
  paying.value = true;
  try {
    await apiClient.post(`/wialon/connections/${connId.value}/accounts/${props.account.id}/payment`, payment.value);
    emit('snack', { text: 'Платёж проведён', color: 'success' });
    emit('saved');
    payment.value = { balance_update: 0, days_update: 0, description: '' };
    await reloadDetails();
  } catch (e: any) {
    emit('snack', { text: e?.response?.data?.error || 'Ошибка платежа', color: 'error' });
  } finally {
    paying.value = false;
  }
};
</script>

<style scoped>
.hd { display: flex; align-items: center; gap: 8px; }
.sub { font-size: 12px; color: rgba(0, 0, 0, 0.6); padding-left: 4px; }
.body { padding: 16px 4px 4px; display: flex; flex-direction: column; gap: 14px; }
.body :deep(.v-window-item) { display: flex; flex-direction: column; gap: 14px; padding: 8px 0; }
.row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.meta { font-size: 12px; color: rgba(0, 0, 0, 0.6); display: flex; gap: 16px; flex-wrap: wrap; }
.hint { font-size: 12px; color: rgba(0, 0, 0, 0.6); padding: 4px 0; }
.ft { display: flex; align-items: center; gap: 8px; padding: 8px 0; }
</style>
