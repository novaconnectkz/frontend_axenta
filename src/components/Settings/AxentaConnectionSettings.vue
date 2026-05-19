<template>
  <v-row>
    <v-col cols="12" md="6">
      <v-card
        class="integration-card"
        :class="{ 'integration-card--active': configured }"
        elevation="2"
      >
        <!-- Заголовок (как GELIOS/SKIF/Wialon) -->
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-3">
            <v-avatar color="blue-darken-2" size="40">
              <v-icon>mdi-cloud-key-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold">Подключение Axenta</div>
              <div class="text-caption text-medium-emphasis">axenta.cloud — синхронизация и операции</div>
            </div>
          </div>
          <v-chip
            :color="configured ? 'success' : 'grey'"
            :variant="configured ? 'elevated' : 'outlined'"
            size="small"
          >
            {{ loadingInit ? '…' : (configured ? 'Активно' : 'Неактивна') }}
          </v-chip>
        </v-card-title>

        <!-- Описание -->
        <v-card-text class="pt-0">
          <p class="text-body-2 mb-1">
            <v-icon size="16" class="mr-1" color="blue-darken-2">mdi-cloud</v-icon>
            Axenta API
            <span class="text-caption text-medium-emphasis ms-2">
              логин/пароль аккаунта компании; server-токен для sync и мутаций
            </span>
          </p>
          <p v-if="configured && login" class="text-caption text-medium-emphasis mb-0">
            Логин: <strong>{{ login }}</strong> · пароль хранится зашифрованным
          </p>
        </v-card-text>

        <!-- Действия (как у соседних карточек) -->
        <v-card-actions class="pt-0">
          <v-spacer />
          <v-btn
            variant="text"
            size="small"
            prepend-icon="mdi-lan-connect"
            :loading="testing"
            :disabled="loading || !login || !password"
            @click="testConnection"
          >
            Проверить
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            size="small"
            prepend-icon="mdi-cog"
            @click="showConfig = !showConfig"
          >
            Настроить
          </v-btn>
        </v-card-actions>

        <!-- Раскрывающаяся форма -->
        <v-expand-transition>
          <div v-show="showConfig">
            <v-divider />
            <v-card-text>
              <v-alert
                v-if="testResult"
                :type="testResult.ok ? 'success' : 'error'"
                variant="tonal"
                density="compact"
                class="mb-4"
                :text="testResult.ok ? 'Соединение успешно — креды рабочие.' : ('Проверка не прошла: ' + testResult.error)"
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
                    :placeholder="configured ? '•••••••• (не меняется при пустом)' : 'введите пароль'"
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
            </v-card-text>
            <v-card-actions class="px-4 pb-4">
              <v-spacer />
              <v-btn
                color="primary"
                variant="flat"
                size="small"
                :loading="saving"
                :disabled="loading || !login || !password"
                prepend-icon="mdi-content-save"
                @click="save"
              >
                Сохранить
              </v-btn>
            </v-card-actions>
          </div>
        </v-expand-transition>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { apiClient } from '@/services/api';

const login = ref('');
const password = ref('');
const showPassword = ref(false);
const showConfig = ref(false);
const configured = ref(false);

const loadingInit = ref(true);
const testing = ref(false);
const saving = ref(false);
const loading = computed(() => loadingInit.value || testing.value || saving.value);

const testResult = ref<{ ok: boolean; error?: string } | null>(null);

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
  showConfig.value = true;
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
      password.value = '';
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
.integration-card {
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.integration-card:hover {
  transform: translateY(-2px);
}
.integration-card--active {
  border-left: 3px solid rgb(var(--v-theme-success));
}
</style>
