<template>
  <v-card class="axenta-connection-settings" variant="outlined">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-cloud-key-outline" class="mr-2" />
      Подключение Axenta
    </v-card-title>

    <v-card-text>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Логин и пароль аккаунта axenta.cloud вашей компании. Используются
        сервером для синхронизации и операций (создание учёток/пользователей).
        Пароль хранится в зашифрованном виде и не отображается.
      </p>

      <!-- Статус -->
      <v-alert
        :type="statusType"
        variant="tonal"
        density="compact"
        class="mb-4"
        :text="statusText"
      />

      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="login"
            label="Логин Axenta"
            placeholder="company@axenta"
            variant="outlined"
            density="compact"
            :disabled="loading"
            autocomplete="off"
            hide-details="auto"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="password"
            label="Пароль Axenta"
            :placeholder="configured ? '•••••••• (оставьте пустым — без изменений при сохранении невозможно)' : 'введите пароль'"
            :type="showPassword ? 'text' : 'password'"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            variant="outlined"
            density="compact"
            :disabled="loading"
            autocomplete="new-password"
            hide-details="auto"
            @click:append-inner="showPassword = !showPassword"
          />
        </v-col>
      </v-row>

      <div v-if="testResult" class="mt-3">
        <v-alert
          :type="testResult.ok ? 'success' : 'error'"
          variant="tonal"
          density="compact"
          :text="testResult.ok ? 'Соединение успешно — креды рабочие.' : ('Проверка не прошла: ' + testResult.error)"
        />
      </div>
    </v-card-text>

    <v-card-actions class="px-4 pb-4">
      <v-btn
        variant="text"
        :loading="testing"
        :disabled="loading || !login || !password"
        prepend-icon="mdi-lan-connect"
        @click="testConnection"
      >
        Проверить соединение
      </v-btn>
      <v-spacer />
      <v-btn
        color="primary"
        variant="flat"
        :loading="saving"
        :disabled="loading || !login || !password"
        prepend-icon="mdi-content-save"
        @click="save"
      >
        Сохранить
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { apiClient } from '@/services/api';

const login = ref('');
const password = ref('');
const showPassword = ref(false);
const configured = ref(false);

const loadingInit = ref(true);
const testing = ref(false);
const saving = ref(false);
const loading = computed(() => loadingInit.value || testing.value || saving.value);

const testResult = ref<{ ok: boolean; error?: string } | null>(null);

const statusType = computed(() => (configured.value ? 'success' : 'warning'));
const statusText = computed(() =>
  loadingInit.value
    ? 'Загрузка состояния…'
    : configured.value
      ? 'Axenta подключена (логин и пароль заданы).'
      : 'Axenta не настроена — синхронизация и операции работают в режиме degraded.',
);

async function loadStatus() {
  loadingInit.value = true;
  try {
    const { data } = await apiClient.get('/auth/axenta-credentials');
    if (data?.status === 'success' && data.data) {
      login.value = data.data.login || '';
      configured.value = !!data.data.configured;
    }
  } catch (e) {
    console.error('❌ Не удалось загрузить статус Axenta-подключения:', e);
  } finally {
    loadingInit.value = false;
  }
}

async function testConnection() {
  testing.value = true;
  testResult.value = null;
  try {
    const { data } = await apiClient.post('/auth/axenta-credentials/test', {
      login: login.value,
      password: password.value,
    });
    const r = data?.data ?? {};
    testResult.value = { ok: !!r.ok, error: r.error || 'неизвестная ошибка' };
  } catch (e: any) {
    testResult.value = { ok: false, error: e?.response?.data?.error || 'ошибка запроса' };
  } finally {
    testing.value = false;
  }
}

async function save() {
  saving.value = true;
  testResult.value = null;
  try {
    const { data } = await apiClient.put('/auth/axenta-credentials', {
      login: login.value,
      password: password.value,
    });
    const r = data?.data ?? {};
    if (data?.status === 'success') {
      configured.value = !!r.configured;
      testResult.value = {
        ok: !!r.connectionOk,
        error: r.error || 'сохранено, но проверка соединения не прошла',
      };
      password.value = ''; // не держим plaintext в форме после сохранения
    } else {
      testResult.value = { ok: false, error: data?.error || 'не удалось сохранить' };
    }
  } catch (e: any) {
    testResult.value = { ok: false, error: e?.response?.data?.error || 'ошибка сохранения' };
  } finally {
    saving.value = false;
  }
}

onMounted(loadStatus);
</script>

<style scoped>
.axenta-connection-settings {
  margin-bottom: 16px;
}
</style>
