<template>
  <div class="create-account-page">
    <!-- Заголовок страницы -->
    <div class="page-header">
      <div class="page-title-section">
        <v-icon icon="mdi-domain-plus" size="32" class="page-icon" />
        <div>
          <h1 class="page-title">Создание учетной записи</h1>
          <p class="page-subtitle">Создание новой учетной записи и администратора</p>
        </div>
      </div>
      
      <div class="page-actions">
        <AppleButton
          variant="secondary"
          prepend-icon="mdi-arrow-left"
          @click="goBack"
        >
          Назад к списку
        </AppleButton>
      </div>
    </div>

    <!-- Форма создания -->
    <AppleCard class="create-form-card" variant="outlined">
      <template #header>
        <div class="form-header">
          <v-icon icon="mdi-account-plus" class="form-icon" />
          <span>Информация об учетной записи</span>
        </div>
      </template>
      
      <v-form ref="formRef" @submit.prevent="createAccount">
        <div class="form-content">
          <!-- Выбор системы мониторинга. Скрываем если активна только Axenta (нет wialon connections) -->
          <div v-if="systemOptions.length > 1" class="form-section">
            <h4 class="form-section-title">Система мониторинга</h4>
            <div class="form-row full-width">
              <v-select
                v-model="form.system"
                :items="systemOptions"
                label="Где создать учётную запись"
                variant="outlined"
                density="compact"
                required
                :loading="loadingConnections"
                @update:model-value="onSystemChange"
              />
            </div>
          </div>

          <!-- Основная информация -->
          <div class="form-section">
            <h4 class="form-section-title">Основная информация</h4>

            <div class="form-row full-width">
              <AppleInput
                v-model="form.name"
                label="Название учетной записи"
                placeholder="Введите название"
                required
                :error-message="errors.name"
                :error="!!errors.name"
                clearable
                density="compact"
              />
            </div>

            <div class="form-row">
              <v-select
                v-model="form.type"
                :items="typeOptions"
                :label="isWialon ? 'Тип учётной записи (Партнёр = права дилера)' : 'Тип учетной записи'"
                variant="outlined"
                density="compact"
                required
                :error-messages="errors.type"
              />

              <!-- Тарифный план — только для Wialon Hosting (на Wialon Local билинга нет вообще) -->
              <v-select
                v-if="isWialon && showBillingPlanField"
                v-model="form.billingPlan"
                :items="billingPlanOptions"
                label="Тарифный план"
                variant="outlined"
                density="compact"
                :loading="loadingPlans"
                :no-data-text="loadingPlans ? 'Загрузка...' : 'Тарифы не найдены'"
                required
              />

              <!-- Видимые вкладки — только для Axenta -->
              <v-select
                v-if="!isWialon"
                v-model="form.admin.visibleTabsNames"
                :items="visibleTabsOptions"
                label="Видимые вкладки"
                variant="outlined"
                density="compact"
                multiple
                chips
                clearable
                :error-messages="errors['admin.visibleTabsNames']"
              />
            </div>

            <!-- Axenta-only поля: комментарий + дата блокировки -->
            <div v-if="!isWialon" class="form-row">
              <AppleInput
                v-model="form.comment"
                label="Комментарий"
                placeholder="Введите комментарий"
                clearable
                density="compact"
              />

              <AppleInput
                v-model="form.blockingDatetime"
                label="Дата блокировки"
                type="datetime-local"
                placeholder="Выберите дату блокировки"
                clearable
                density="compact"
              />
            </div>
          </div>
          
          <!-- Секция администратора -->
          <div class="form-section">
            <h4 class="form-section-title">Данные администратора</h4>

            <div class="form-row">
              <AppleInput
                v-if="!isWialon"
                v-model="form.admin.name"
                label="Имя администратора"
                placeholder="Введите имя"
                required
                :error-message="errors['admin.name']"
                :error="!!errors['admin.name']"
                clearable
                density="compact"
              />

              <AppleInput
                v-model="form.admin.username"
                label="Логин администратора"
                placeholder="Введите логин"
                required
                :error-message="errors['admin.username']"
                :error="!!errors['admin.username']"
                clearable
                density="compact"
              />
            </div>

            <div class="form-row">
              <AppleInput
                v-model="form.admin.email"
                label="Email администратора"
                type="email"
                placeholder="admin@example.com"
                required
                :error-message="errors['admin.email']"
                :error="!!errors['admin.email']"
                clearable
                density="compact"
              />

              <AppleInput
                v-if="!isWialon"
                v-model="form.adminId"
                label="ID администратора"
                type="number"
                placeholder="Введите ID администратора"
                clearable
                density="compact"
              />
            </div>

            <div class="form-row">
              <AppleInput
                v-model="form.admin.password"
                label="Пароль администратора"
                type="password"
                placeholder="Введите пароль"
                required
                :error-message="errors['admin.password']"
                :error="!!errors['admin.password']"
                clearable
                density="compact"
              />

              <AppleInput
                v-if="!isWialon"
                v-model="form.admin.confirmPassword"
                label="Подтверждение пароля"
                type="password"
                placeholder="Подтвердите пароль"
                required
                :error-message="errors['admin.confirmPassword']"
                :error="!!errors['admin.confirmPassword']"
                clearable
                density="compact"
              />
            </div>

          </div>
        </div>
      </v-form>
      
      <template #footer>
        <div class="form-actions">
          <AppleButton
            variant="secondary"
            @click="goBack"
            :disabled="saving"
          >
            Отмена
          </AppleButton>
          
          <AppleButton
            @click="createAccount"
            :loading="saving"
            :disabled="!isFormValid"
            prepend-icon="mdi-check"
          >
            Создать учетную запись
          </AppleButton>
        </div>
      </template>
    </AppleCard>

    <!-- Snackbar для уведомлений -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="bottom right">
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Красивые уведомления об успехе -->
    <SuccessNotification
      v-model="successNotification.show"
      :title="successNotification.title"
      :message="successNotification.message"
      :details="successNotification.details"
      :icon="successNotification.icon"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppleButton from '@/components/Apple/AppleButton.vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import AppleInput from '@/components/Apple/AppleInput.vue';
import SuccessNotification from '@/components/Common/SuccessNotification.vue';
import accountsService from '@/services/accountsService';
import settingsService from '@/services/settingsService';

// Router
const router = useRouter();

// Reactive data
const saving = ref(false);
const formRef = ref();
const loadingConnections = ref(false);
const loadingPlans = ref(false);

// Список wialon-подключений (загружается на mount). Используется в селекторе "Система мониторинга".
type WialonConnection = { id: number; name: string; user_name: string; connection_type: 'hosting' | 'local'; is_active: boolean; source_label: string };
const wialonConnections = ref<WialonConnection[]>([]);
const billingPlans = ref<Array<{ name: string }>>([]);

// Интерфейс для формы создания учетной записи
interface AccountForm {
  // 'axenta' — создать через Axenta API; 'wialon:N' — через Wialon connection N
  system: string;
  name: string;
  type: 'client' | 'partner';
  comment: string;
  blockingDatetime: string;
  adminId: number | null;
  billingPlan: string;
  admin: {
    name: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    visibleTabsNames: string[];
  };
}

const form = ref<AccountForm>({
  system: 'axenta',
  name: '',
  type: 'client',
  comment: '',
  blockingDatetime: '',
  adminId: null,
  billingPlan: '',
  admin: {
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    visibleTabsNames: ['monitoring'],
  },
});

const errors = ref<Record<string, string>>({});

// Snackbar для уведомлений
const snackbar = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000
});

// Красивые уведомления об успехе
const successNotification = ref({
  show: false,
  title: '',
  message: '',
  details: '',
  icon: 'mdi-check-circle'
});

// Computed
const isWialon = computed(() => form.value.system.startsWith('wialon:'));
const selectedConnection = computed<WialonConnection | undefined>(() => {
  if (!isWialon.value) return undefined;
  const id = Number(form.value.system.slice('wialon:'.length));
  return wialonConnections.value.find(c => c.id === id);
});
const isWialonLocal = computed(() => selectedConnection.value?.connection_type === 'local');

const systemOptions = computed(() => {
  const opts: Array<{ value: string; title: string }> = [
    { value: 'axenta', title: 'Axenta Cloud' },
  ];
  for (const c of wialonConnections.value) {
    opts.push({ value: `wialon:${c.id}`, title: c.source_label });
  }
  return opts;
});

const billingPlanOptions = computed(() => billingPlans.value.map(p => ({ value: p.name, title: p.name })));
// Селектор тарифа показываем только если: Wialon Hosting + есть тарифы. На WL/при отсутствии — скрываем (поле опциональное).
const showBillingPlanField = computed(() => isWialon.value && !isWialonLocal.value && billingPlans.value.length > 0);

const isFormValid = computed(() => {
  if (!form.value.name.trim() || !form.value.type) return false;
  if (!form.value.admin.username.trim() || !form.value.admin.email.trim() || !form.value.admin.password.trim()) return false;

  if (isWialon.value) {
    // Для Wialon: name пользователя необязателен (используется username), confirmPassword нет
    return !Object.values(errors.value).some(e => e);
  }

  // Axenta: требуем admin.name + confirmPassword + совпадение паролей
  if (!form.value.admin.name.trim() || !form.value.admin.confirmPassword.trim()) return false;
  if (form.value.admin.password !== form.value.admin.confirmPassword) return false;
  return !Object.values(errors.value).some(e => e);
});

// Options
const typeOptions = [
  { title: 'Клиент', value: 'client' },
  { title: 'Партнер', value: 'partner' },
];

const visibleTabsOptions = [
  { title: 'Мониторинг', value: 'monitoring' },
  { title: 'Объекты', value: 'objects' },
  { title: 'Пользователи', value: 'users' },
  { title: 'Монтажи', value: 'installations' },
  { title: 'Склад', value: 'warehouse' },
  { title: 'Договоры', value: 'contracts' },
  { title: 'Биллинг', value: 'billing' },
  { title: 'Отчеты', value: 'reports' },
  { title: 'Настройки', value: 'settings' },
];

// Methods
const resetForm = () => {
  form.value = {
    system: form.value.system, // оставляем выбор системы, чтобы юзер мог создать ещё один
    name: '',
    type: 'client',
    comment: '',
    blockingDatetime: '',
    adminId: null,
    billingPlan: '',
    admin: {
      name: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      visibleTabsNames: ['monitoring'],
    },
  };
  errors.value = {};
};

// При изменении выбранной системы — для wialon загружаем тарифы
const onSystemChange = async () => {
  form.value.billingPlan = '';
  billingPlans.value = [];
  if (!isWialon.value) return;
  const conn = selectedConnection.value;
  if (!conn) return;
  loadingPlans.value = true;
  try {
    const plans = await settingsService.getWialonBillingPlans(conn.id);
    billingPlans.value = plans;
    // Автовыбор если план единственный
    if (plans.length === 1) {
      form.value.billingPlan = plans[0].name;
    }
  } finally {
    loadingPlans.value = false;
  }
};

onMounted(async () => {
  loadingConnections.value = true;
  try {
    wialonConnections.value = await settingsService.getWialonConnections();
  } finally {
    loadingConnections.value = false;
  }
});

const validateForm = (): boolean => {
  errors.value = {};

  if (!form.value.name.trim()) {
    errors.value.name = 'Название учетной записи обязательно';
    return false;
  }
  if (!form.value.type) {
    errors.value.type = 'Тип учетной записи обязателен';
    return false;
  }
  if (!form.value.admin.username.trim()) {
    errors.value['admin.username'] = 'Логин обязателен';
    return false;
  }
  if (!form.value.admin.email.trim()) {
    errors.value['admin.email'] = 'Email обязателен';
    return false;
  }
  if (!form.value.admin.password.trim()) {
    errors.value['admin.password'] = 'Пароль обязателен';
    return false;
  }

  // Axenta-only валидация
  if (!isWialon.value) {
    if (!form.value.admin.name.trim()) {
      errors.value['admin.name'] = 'Имя администратора обязательно';
      return false;
    }
    if (!form.value.admin.confirmPassword.trim()) {
      errors.value['admin.confirmPassword'] = 'Подтверждение пароля обязательно';
      return false;
    }
    if (form.value.admin.password !== form.value.admin.confirmPassword) {
      errors.value['admin.confirmPassword'] = 'Пароли не совпадают';
      return false;
    }
  }

  return true;
};

const createAccount = async () => {
  if (!validateForm()) {
    return;
  }

  try {
    saving.value = true;

    if (isWialon.value) {
      // Wialon: вызываем backend POST /api/wialon/connections/:id/accounts
      const conn = selectedConnection.value!;
      const result = await settingsService.createWialonAccount(conn.id, {
        name: form.value.name,
        username: form.value.admin.username,
        password: form.value.admin.password,
        email: form.value.admin.email,
        type: form.value.type,
        billingPlan: form.value.billingPlan || undefined,
      });
      if (!result.ok) {
        showSnackbar(result.error || 'Ошибка создания Wialon-аккаунта', 'error');
        return;
      }
      successNotification.value = {
        show: true,
        title: 'Wialon-аккаунт создан',
        message: `"${form.value.name}" создан в ${conn.source_label}`,
        details: `Тип: ${form.value.type === 'client' ? 'Клиент' : 'Партнёр (дилер)'}${form.value.billingPlan ? `, тариф: ${form.value.billingPlan}` : ''}`,
        icon: 'mdi-check-circle',
      };
      resetForm();
      setTimeout(() => router.push('/accounts'), 2000);
      return;
    }

    // Axenta: существующий поток
    const accountData: any = {
      name: form.value.name,
      type: form.value.type,
      comment: form.value.comment || null,
      blockingDatetime: form.value.blockingDatetime || null,
      admin: {
        name: form.value.admin.name,
        username: form.value.admin.username,
        email: form.value.admin.email,
        password: form.value.admin.password,
        confirmPassword: form.value.admin.confirmPassword,
        visibleTabsNames: form.value.admin.visibleTabsNames,
      },
    };
    if (form.value.adminId) {
      accountData.adminId = form.value.adminId;
    }

    const response = await accountsService.createAccount(accountData);

    if (response.status === 'success') {
      successNotification.value = {
        show: true,
        title: 'Учетная запись создана',
        message: `Учетная запись "${form.value.name}" успешно создана`,
        details: `Тип: ${form.value.type === 'client' ? 'Клиент' : 'Партнер'}`,
        icon: 'mdi-check-circle',
      };
      resetForm();
      setTimeout(() => router.push('/accounts'), 2000);
    } else {
      showSnackbar(response.error || 'Ошибка создания учетной записи', 'error');
    }
  } catch (error: any) {
    console.error('Ошибка создания учетной записи:', error);
    showSnackbar('Ошибка создания учетной записи', 'error');
  } finally {
    saving.value = false;
  }
};

const goBack = () => {
  router.push('/accounts');
};

const showSnackbar = (text: string, color: string = 'info') => {
  snackbar.value.text = text;
  snackbar.value.color = color;
  snackbar.value.show = true;
};

// Следим за изменением паролей для валидации
import { watch } from 'vue';

watch([() => form.value.admin.password, () => form.value.admin.confirmPassword], () => {
  if (form.value.admin.password && form.value.admin.confirmPassword) {
    if (form.value.admin.password !== form.value.admin.confirmPassword) {
      errors.value['admin.confirmPassword'] = 'Пароли не совпадают';
    } else {
      delete errors.value['admin.confirmPassword'];
    }
  }
});
</script>

<style scoped>
.create-account-page {
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

.form-icon {
  color: var(--color-primary);
}

.form-content {
  padding: 0;
}

.form-section {
  margin-bottom: 16px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-section-title {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(60, 60, 67, 0.08);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 8px;
}

.form-row:last-child {
  margin-bottom: 0;
}

/* Для полей, которые должны занимать всю ширину */
.form-row.full-width {
  grid-template-columns: 1fr;
}

/* Компактные поля ввода */
:deep(.v-field) {
  --v-field-padding-top: 8px;
  --v-field-padding-bottom: 8px;
}

:deep(.v-label) {
  font-size: 14px;
  line-height: 1.2;
}

:deep(.v-input__details) {
  min-height: 16px;
  padding-top: 4px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Адаптивность */
@media (max-width: 768px) {
  .create-account-page {
    padding: 6px 16px 16px 16px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    margin-bottom: 10px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .page-subtitle {
    font-size: 13px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .form-section {
    margin-bottom: 12px;
  }
  
  .form-section-title {
    font-size: 14px;
    margin-bottom: 6px;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
}

/* Темная тема */
[data-theme="dark"] .form-section-title {
  border-bottom-color: rgba(84, 84, 136, 0.08);
  color: var(--text-primary);
}
</style>
