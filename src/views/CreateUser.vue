<template>
  <div class="create-user-page">
    <div class="page-header">
      <div class="page-title-section">
        <v-icon icon="mdi-account-plus" size="32" class="page-icon" />
        <div>
          <h1 class="page-title">Создание пользователя</h1>
          <p class="page-subtitle">Создание нового пользователя в выбранной системе мониторинга</p>
        </div>
      </div>

      <div class="page-actions">
        <AppleButton variant="secondary" prepend-icon="mdi-arrow-left" @click="goBack">
          Назад к списку
        </AppleButton>
      </div>
    </div>

    <AppleCard class="create-form-card" variant="outlined">
      <template #header>
        <div class="form-header">
          <v-icon icon="mdi-account-plus" class="form-icon" />
          <span>Информация о пользователе</span>
        </div>
      </template>

      <v-form ref="formRef" @submit.prevent="createUser">
        <div class="form-content">
          <!-- Система мониторинга + Создатель в одной строке -->
          <div class="form-section">
            <div class="form-row">
              <v-select
                v-model="form.system"
                :items="systemOptions"
                label="Система мониторинга"
                variant="outlined"
                density="compact"
                persistent-placeholder
                required
                :loading="loadingConnections"
                @update:model-value="onSystemChange"
              />

              <v-autocomplete
                v-if="!isWialon && !isSkif"
                v-model="form.accountId"
                :items="axentaAccountOptions"
                item-title="displayName"
                item-value="id"
                label="Создатель (учетная запись Axenta)"
                placeholder="Начните вводить название..."
                variant="outlined"
                density="compact"
                persistent-placeholder
                :loading="loadingAxentaAccounts"
                required
                clearable
                no-data-text="Учетные записи не найдены"
                hide-no-data
                auto-select-first
                :rules="[(v: any) => !!v || 'Выберите учетную запись']"
              >
                <template #item="{ props: itemProps, item }">
                  <v-list-item v-bind="itemProps">
                    <template #title>
                      <span class="font-weight-medium">{{ item.raw.name }}</span>
                    </template>
                    <template #subtitle>
                      <span class="text-caption text-grey-600">Admin ID: {{ item.raw.adminId }}</span>
                      <span v-if="item.raw.type" class="text-caption text-grey-500 ml-2">
                        • {{ item.raw.type === 'client' ? 'Клиент' : item.raw.type === 'partner' ? 'Партнёр' : item.raw.type }}
                      </span>
                    </template>
                  </v-list-item>
                </template>
                <template #selection="{ item }">
                  <span class="font-weight-medium">{{ item.raw.name }}</span>
                  <span class="text-caption text-grey-600 ml-2">(Admin ID: {{ item.raw.adminId }})</span>
                </template>
              </v-autocomplete>

              <v-autocomplete
                v-else-if="isSkif"
                v-model="form.skifCompanyId"
                :items="skifCompanyOptions"
                item-title="name"
                item-value="id"
                label="Компания SKIF"
                placeholder="Начните вводить название..."
                variant="outlined"
                density="compact"
                persistent-placeholder
                :loading="loadingSkifCompanies"
                required
                clearable
                hide-no-data
                auto-select-first
                :rules="[(v: any) => !!v || 'Выберите компанию SKIF']"
              />

              <v-autocomplete
                v-else
                v-model="form.wialonCreatorId"
                :items="wialonAccountOptions"
                item-title="displayName"
                item-value="id"
                :label="`Создатель (учётная запись ${selectedConnection?.source_label || ''})`"
                placeholder="Начните вводить название..."
                variant="outlined"
                density="compact"
                persistent-placeholder
                :loading="loadingWialonAccounts"
                clearable
                hide-no-data
                auto-select-first
                :rules="[(v: any) => !!v || 'Выберите учётную запись Wialon']"
              >
                <template #item="{ props: itemProps, item }">
                  <v-list-item v-bind="itemProps">
                    <template #title>
                      <span class="font-weight-medium">{{ item.raw.name }}</span>
                    </template>
                    <template #subtitle>
                      <span class="text-caption text-grey-500">
                        {{ item.raw.dealer_rights ? 'Партнёр (дилер)' : 'Клиент' }}
                        <span v-if="item.raw.id"> • ID: {{ item.raw.id }}</span>
                      </span>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </div>

            <v-alert
              v-if="isWialon"
              type="info"
              variant="tonal"
              density="compact"
              text
              class="mt-2"
            >
              <div class="text-caption">
                Создание Wialon-пользователя <strong>без</strong> биллинг-ресурса.
                Для аккаунта с биллингом — страница «Учетные записи».
              </div>
            </v-alert>

            <div v-if="isSkif" class="form-row mt-2">
              <v-select
                v-model="form.skifRoleKey"
                :items="skifRoleOptions"
                item-title="title"
                item-value="value"
                label="Роль в SKIF"
                variant="outlined"
                density="compact"
                persistent-placeholder
              />
            </div>

            <v-alert
              v-if="isSkif"
              type="info"
              variant="tonal"
              density="compact"
              text
              class="mt-2"
            >
              <div class="text-caption">
                Юзер создаётся в выбранной компании SKIF. Email/телефон — опционально.
              </div>
            </v-alert>
          </div>

          <!-- Логин + Email -->
          <div class="form-section">
            <div class="form-row">
              <v-text-field
                v-model="form.username"
                label="Имя пользователя (логин)"
                placeholder="Введите логин"
                variant="outlined"
                density="compact"
                persistent-placeholder
                required
                clearable
                :rules="usernameRules"
              />
              <v-text-field
                v-model="form.email"
                label="Email"
                type="email"
                placeholder="user@example.com"
                variant="outlined"
                density="compact"
                persistent-placeholder
                :required="!isWialon"
                clearable
                :rules="emailRules"
              />
            </div>
          </div>

          <!-- Полное имя (только axenta) -->
          <div v-if="!isWialon && !isSkif" class="form-section">
            <div class="form-row full-width">
              <v-text-field
                v-model="form.name"
                label="Полное имя"
                placeholder="Иванов Иван Иванович"
                variant="outlined"
                density="compact"
                persistent-placeholder
                required
                clearable
                :rules="nameRules"
              />
            </div>
          </div>

          <!-- Пароль -->
          <div class="form-section">
            <div class="form-row">
              <div class="password-field-wrap">
                <v-text-field
                  v-model="form.password"
                  label="Пароль"
                  :type="showPassword ? 'text' : 'password'"
                  variant="outlined"
                  density="compact"
                persistent-placeholder
                  required
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showPassword = !showPassword"
                  :rules="passwordRules"
                />
                <div v-if="isWialon" class="password-rules">
                  <div v-for="rule in wialonPasswordRules" :key="rule.label" class="rule" :class="{ ok: rule.ok }">
                    <v-icon size="14">{{ rule.ok ? 'mdi-check' : 'mdi-close' }}</v-icon>
                    {{ rule.label }}
                  </div>
                </div>
              </div>
              <v-text-field
                v-if="!isWialon && !isSkif"
                v-model="form.confirmPassword"
                label="Подтверждение пароля"
                :type="showPassword ? 'text' : 'password'"
                variant="outlined"
                density="compact"
                persistent-placeholder
                required
                :rules="confirmPasswordRules"
              />
            </div>
          </div>

          <!-- Axenta-specific: hasAdminAccess + visibleTabsNames -->
          <template v-if="!isWialon && !isSkif">
            <div class="form-section">
              <div class="form-row">
                <v-switch
                  v-model="form.hasAdminAccess"
                  label="Административный доступ"
                  color="primary"
                  density="compact"
                persistent-placeholder
                  hide-details
                />
              </div>
            </div>

            <div class="form-section">
              <div class="form-row full-width">
                <v-select
                  v-model="form.visibleTabsNames"
                  :items="availableTabs"
                  item-title="title"
                  item-value="value"
                  label="Видимые вкладки"
                  multiple
                  chips
                  variant="outlined"
                  density="compact"
                persistent-placeholder
                />
              </div>
            </div>
          </template>
        </div>

        <div class="form-actions">
          <AppleButton variant="secondary" @click="goBack" :disabled="submitting">Отмена</AppleButton>
          <AppleButton type="submit" color="primary" :loading="submitting">Создать</AppleButton>
        </div>
      </v-form>
    </AppleCard>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="bottom right"
    >
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Закрыть</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import accountsService from '@/services/accountsService';
import settingsService from '@/services/settingsService';
import { apiClient } from '@/services/api';
import { config } from '@/config/env';

const router = useRouter();
const formRef = ref();
const submitting = ref(false);
const showPassword = ref(false);
const loadingConnections = ref(false);
const loadingAxentaAccounts = ref(false);
const loadingWialonAccounts = ref(false);

type WialonConnection = { id: number; name: string; user_name: string; connection_type: 'hosting' | 'local'; is_active: boolean; source_label: string };
const wialonConnections = ref<WialonConnection[]>([]);

type SkifConnection = { id: number; name: string; is_active: boolean };
const skifConnections = ref<SkifConnection[]>([]);
type SkifCompanyOption = { id: string; name: string };
const skifCompanyOptions = ref<SkifCompanyOption[]>([]);
const loadingSkifCompanies = ref(false);

const skifRoleOptions = [
  { title: 'Редактор (EDITOR)', value: 'EDITOR' },
  { title: 'Администратор (ADMIN)', value: 'ADMIN' },
  { title: 'Читатель (READER)', value: 'READER' },
  { title: 'Супервизор (SUPERVISOR)', value: 'SUPERVISOR' },
];

interface AxentaAccountOption {
  id: number;
  adminId: number;
  name: string;
  type?: string;
  displayName: string;
}

interface WialonAccountOption {
  id: number; // wialon user id, используется как creatorId
  name: string;
  dealer_rights: boolean;
  source_label: string;
  displayName: string;
}

const axentaAccountOptions = ref<AxentaAccountOption[]>([]);
const wialonAccountOptions = ref<WialonAccountOption[]>([]);

const form = ref({
  system: 'axenta', // 'axenta' | 'wialon:N'
  username: '',
  email: '',
  name: '',
  password: '',
  confirmPassword: '',
  accountId: null as number | null,
  wialonCreatorId: null as number | null,
  skifCompanyId: null as string | null,
  skifRoleKey: 'EDITOR',
  hasAdminAccess: false,
  visibleTabsNames: ['monitoring', 'reports'] as string[],
});

const snackbar = ref({ show: false, text: '', color: 'info', timeout: 5000 });

const showSnackbar = (text: string, color: 'info' | 'success' | 'error' | 'warning' = 'info') => {
  snackbar.value = { show: true, text, color, timeout: 5000 };
};

// Computed
const isWialon = computed(() => form.value.system.startsWith('wialon:'));
const isSkif = computed(() => form.value.system.startsWith('skif:'));
const selectedConnection = computed<WialonConnection | undefined>(() => {
  if (!isWialon.value) return undefined;
  const id = Number(form.value.system.slice('wialon:'.length));
  return wialonConnections.value.find((c) => c.id === id);
});
const selectedSkifConnection = computed<SkifConnection | undefined>(() => {
  if (!isSkif.value) return undefined;
  const id = Number(form.value.system.slice('skif:'.length));
  return skifConnections.value.find((c) => c.id === id);
});

const systemOptions = computed(() => {
  const opts: Array<{ value: string; title: string }> = [
    { value: 'axenta', title: 'Axenta Cloud' },
  ];
  for (const c of wialonConnections.value) {
    opts.push({ value: `wialon:${c.id}`, title: c.source_label });
  }
  for (const c of skifConnections.value) {
    opts.push({ value: `skif:${c.id}`, title: `SKIF — ${c.name}` });
  }
  return opts;
});

const availableTabs = [
  { title: 'Мониторинг', value: 'monitoring' },
  { title: 'Треки', value: 'tracks' },
  { title: 'Отчеты', value: 'reports' },
  { title: 'Сообщения', value: 'messages' },
  { title: 'Уведомления', value: 'notifications' },
  { title: 'Геозоны', value: 'geofences' },
  { title: 'Водители', value: 'drivers' },
  { title: 'Прицепы', value: 'trailers' },
  { title: 'Объекты', value: 'objects' },
  { title: 'Пользователи', value: 'users' },
  { title: 'Здания', value: 'buildings' },
  { title: 'Устройства', value: 'devices' },
];

// Validation
const usernameRules = [
  (v: string) => !!v || 'Логин обязателен',
  (v: string) => (v && v.length >= 3) || 'Минимум 3 символа',
  (v: string) => /^[a-zA-Z0-9_.\- ]+$/.test(v) || 'Латиница, цифры, точки, дефисы, пробелы',
];

const emailRules = computed(() => {
  const required = !isWialon.value && !isSkif.value;
  return [
    (v: string) => (required ? !!v || 'Email обязателен' : true),
    (v: string) => !v || /.+@.+\..+/.test(v) || 'Неверный формат email',
  ];
});

const nameRules = [
  (v: string) => !!v || 'Полное имя обязательно',
  (v: string) => (v && v.length >= 2) || 'Минимум 2 символа',
];

const passwordRules = computed(() => [
  (v: string) => !!v || 'Пароль обязателен',
  (v: string) => (isWialon.value ? isWialonPasswordValid.value || 'Не выполнены требования Wialon' : (v && v.length >= 6) || 'Минимум 6 символов'),
]);

const confirmPasswordRules = [
  (v: string) => !!v || 'Подтвердите пароль',
  (v: string) => v === form.value.password || 'Пароли не совпадают',
];

// Wialon strong-policy
const wialonPasswordRules = computed(() => {
  const p = form.value.password || '';
  const u = form.value.username || '';
  return [
    { label: '8+ символов', ok: p.length >= 8 },
    { label: 'Заглавная', ok: /[A-Z]/.test(p) },
    { label: 'Строчная', ok: /[a-z]/.test(p) },
    { label: 'Цифра', ok: /[0-9]/.test(p) },
    { label: 'Спецсимвол', ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
    { label: 'Не равен логину', ok: !p || !u || p.toLowerCase() !== u.toLowerCase() },
  ];
});
const isWialonPasswordValid = computed(() => wialonPasswordRules.value.every((r) => r.ok));

// Loaders
const loadWialonConnections = async () => {
  loadingConnections.value = true;
  try {
    wialonConnections.value = await settingsService.getWialonConnections();
  } catch (e) {
    console.error('loadWialonConnections', e);
    wialonConnections.value = [];
  } finally {
    loadingConnections.value = false;
  }
};

const loadSkifConnections = async () => {
  try {
    const r = await apiClient.get('/auth/skif/connections');
    skifConnections.value = (r.data?.data || [])
      .filter((c: any) => c.is_active)
      .map((c: any) => ({ id: c.id, name: c.name, is_active: c.is_active }));
  } catch (e) {
    console.error('loadSkifConnections', e);
    skifConnections.value = [];
  }
};

const loadSkifCompaniesForConnection = async (connectionId: number) => {
  loadingSkifCompanies.value = true;
  try {
    const r = await apiClient.get(`/auth/skif/connections/${connectionId}/companies`);
    skifCompanyOptions.value = (r.data?.data || []) as SkifCompanyOption[];
  } catch (e) {
    console.error('loadSkifCompaniesForConnection', e);
    skifCompanyOptions.value = [];
  } finally {
    loadingSkifCompanies.value = false;
  }
};

const loadAxentaAccounts = async () => {
  loadingAxentaAccounts.value = true;
  try {
    const r = await accountsService.getAccounts({ page: 1, per_page: 200, ordering: 'name' });
    axentaAccountOptions.value = (r.results || []).map((acc: any) => ({
      id: acc.id,
      adminId: acc.adminId || acc.admin_id || acc.id,
      name: acc.name,
      type: acc.type,
      displayName: `${acc.name} (Admin ID: ${acc.adminId || acc.admin_id || acc.id})`,
    }));
  } catch (e) {
    console.error('loadAxentaAccounts', e);
    axentaAccountOptions.value = [];
  } finally {
    loadingAxentaAccounts.value = false;
  }
};

const loadWialonAccountsForConnection = async (connectionId: number) => {
  loadingWialonAccounts.value = true;
  try {
    const data = await settingsService.getWialonAccounts();
    wialonAccountOptions.value = (data?.items || [])
      .filter((acc: any) => acc.connection_id === connectionId)
      .map((acc: any) => ({
        id: acc.id,
        name: acc.name,
        dealer_rights: acc.dealer_rights || false,
        source_label: acc.source_label || '',
        displayName: acc.name,
      }));
  } catch (e) {
    console.error('loadWialonAccountsForConnection', e);
    wialonAccountOptions.value = [];
  } finally {
    loadingWialonAccounts.value = false;
  }
};

const onSystemChange = () => {
  // Сбросить creator при смене системы
  form.value.accountId = null;
  form.value.wialonCreatorId = null;
  form.value.skifCompanyId = null;
  if (isWialon.value && selectedConnection.value) {
    loadWialonAccountsForConnection(selectedConnection.value.id);
  } else if (isSkif.value && selectedSkifConnection.value) {
    loadSkifCompaniesForConnection(selectedSkifConnection.value.id);
  }
};

watch(() => form.value.system, () => onSystemChange());

// Submit
const createUser = async () => {
  const valid = await formRef.value?.validate();
  if (!valid?.valid) {
    showSnackbar('Заполните обязательные поля', 'error');
    return;
  }

  submitting.value = true;
  try {
    if (isWialon.value && selectedConnection.value) {
      const result = await settingsService.createWialonUser(selectedConnection.value.id, {
        username: form.value.username,
        password: form.value.password,
        email: form.value.email || undefined,
        creatorId: form.value.wialonCreatorId || undefined,
      });
      if (!result.ok) {
        showSnackbar(result.error || 'Ошибка создания Wialon-пользователя', 'error');
        return;
      }
      showSnackbar(`Wialon-пользователь "${form.value.username}" создан`, 'success');
      setTimeout(() => router.push('/users'), 1500);
      return;
    }

    if (isSkif.value && selectedSkifConnection.value) {
      if (!form.value.skifCompanyId) {
        showSnackbar('Выберите компанию SKIF', 'error');
        return;
      }
      try {
        await apiClient.post(
          `/auth/skif/connections/${selectedSkifConnection.value.id}/users?company=${encodeURIComponent(form.value.skifCompanyId)}`,
          {
            name: form.value.username,
            email: form.value.email || undefined,
            password: form.value.password,
            role_key: form.value.skifRoleKey,
          },
        );
        showSnackbar(`SKIF-пользователь "${form.value.username}" создан`, 'success');
        setTimeout(() => router.push('/users'), 1500);
      } catch (e: any) {
        const msg = e?.response?.data?.error || e?.message || 'Ошибка создания SKIF-пользователя';
        showSnackbar(msg, 'error');
      }
      return;
    }

    // Axenta-flow
    const accountId = form.value.accountId;
    if (!accountId) {
      showSnackbar('Выберите учетную запись Axenta', 'error');
      return;
    }

    const payload = {
      name: form.value.name,
      username: form.value.username,
      email: form.value.email,
      password: form.value.password,
      hasAdminAccess: form.value.hasAdminAccess,
      visibleTabsNames: form.value.visibleTabsNames,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const tok = localStorage.getItem('axenta_token');
    if (tok) headers['Authorization'] = `Token ${tok}`;
    const company = localStorage.getItem('axenta_company');
    if (company) {
      try {
        headers['X-Tenant-ID'] = String(JSON.parse(company).id);
      } catch (e) { /* ignore */ }
    }
    headers['X-Account-Id'] = String(accountId);

    const resp = await fetch(`${config.apiBaseUrl}/api/cms/users/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...payload, accountId }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      showSnackbar(data?.error || `Ошибка создания (HTTP ${resp.status})`, 'error');
      return;
    }
    showSnackbar(`Пользователь "${form.value.username}" создан`, 'success');
    setTimeout(() => router.push('/users'), 1500);
  } catch (e: any) {
    console.error('createUser', e);
    showSnackbar(e?.message || 'Ошибка создания пользователя', 'error');
  } finally {
    submitting.value = false;
  }
};

const goBack = () => router.push('/users');

onMounted(async () => {
  await Promise.all([loadAxentaAccounts(), loadWialonConnections(), loadSkifConnections()]);
});
</script>

<style scoped>
.password-field-wrap { flex: 1; }
.password-rules {
  margin-top: 4px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 12px;
  font-size: 12px;
}
.password-rules .rule {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ff3b30;
}
.password-rules .rule.ok { color: #34c759; }

.create-user-page {
  padding: 8px 24px 24px 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 24px;
}

.page-title-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.page-icon {
  color: var(--color-primary);
  margin-top: 4px;
}

.page-title {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px 0;
  line-height: 1.2;
}

.page-subtitle {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.3;
}

.page-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.create-form-card {
  max-width: 1200px;
  margin: 0 auto;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.form-icon { color: var(--color-primary); }
.form-content { padding: 0; }
.form-section { margin-bottom: 16px; }
.form-section:last-child { margin-bottom: 0; }

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 8px;
  align-items: start;
}
.form-row:last-child { margin-bottom: 0; }
.form-row.full-width { grid-template-columns: 1fr; }

:deep(.v-field) {
  --v-field-padding-top: 8px;
  --v-field-padding-bottom: 8px;
}
:deep(.v-label) { font-size: 14px; line-height: 1.2; }
:deep(.v-input__details) { min-height: 16px; padding-top: 4px; }

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .create-user-page { padding: 6px 16px 16px 16px; }
  .page-header { flex-direction: column; align-items: stretch; gap: 8px; margin-bottom: 10px; }
  .page-title { font-size: 20px; }
  .page-subtitle { font-size: 13px; }
  .form-row { grid-template-columns: 1fr; gap: 8px; }
  .form-section { margin-bottom: 12px; }
  .form-actions { flex-direction: column-reverse; }
}
</style>
