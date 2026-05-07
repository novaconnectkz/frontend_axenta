<template>
  <div class="skif-connections">
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-h6">Подключения SKIF.PRO</div>
        <div class="text-caption text-medium-emphasis">
          Cookie-session авторизация ({{ connections.length }} подключений)
        </div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">
        Добавить
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" closable class="mb-3" @click:close="error = ''">
      {{ error }}
    </v-alert>

    <div v-if="loading && !connections.length" class="text-center py-6">
      <v-progress-circular indeterminate />
    </div>

    <div v-else-if="!connections.length" class="text-center py-8 text-medium-emphasis">
      <v-icon size="48" class="mb-2">mdi-satellite-variant</v-icon>
      <div>Нет подключений к SKIF.PRO</div>
      <div class="text-caption mt-1">Добавьте первое подключение чтобы начать синхронизацию</div>
    </div>

    <v-table v-else density="comfortable">
      <thead>
        <tr>
          <th>Название</th>
          <th>URL</th>
          <th>Логин</th>
          <th class="text-end">Объекты</th>
          <th>Авто-sync</th>
          <th>Последняя синхр.</th>
          <th>Статус</th>
          <th class="text-end">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in connections" :key="c.id">
          <td><strong>{{ c.name }}</strong></td>
          <td><span class="font-monospace text-caption">{{ c.base_url }}</span></td>
          <td>{{ c.login }}</td>
          <td class="text-end">{{ c.units_count }}</td>
          <td>
            <v-chip :color="c.auto_sync_enabled ? 'success' : 'grey'" size="x-small">
              {{ c.auto_sync_enabled ? `${c.sync_interval}мин` : 'выкл' }}
            </v-chip>
          </td>
          <td class="text-caption">{{ formatDate(c.last_sync_at) }}</td>
          <td>
            <v-chip
              v-if="c.error_message"
              color="error"
              size="x-small"
              :title="c.error_message"
            >
              <v-icon start size="12">mdi-alert</v-icon>
              Ошибка
            </v-chip>
            <v-chip v-else-if="c.last_login_at" color="success" size="x-small">OK</v-chip>
            <v-chip v-else color="grey" size="x-small">Не проверено</v-chip>
          </td>
          <td class="text-end">
            <v-btn
              variant="text"
              size="small"
              icon="mdi-connection"
              :loading="busy[`test-${c.id}`]"
              title="Тест подключения"
              @click="onTest(c)"
            />
            <v-btn
              variant="text"
              size="small"
              icon="mdi-sync"
              :loading="busy[`sync-${c.id}`]"
              title="Запустить синхронизацию"
              @click="onSync(c)"
            />
            <v-btn
              variant="text"
              size="small"
              icon="mdi-pencil"
              title="Редактировать"
              @click="openEdit(c)"
            />
            <v-btn
              variant="text"
              size="small"
              icon="mdi-delete"
              color="error"
              title="Удалить"
              @click="onDelete(c)"
            />
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- Create/Edit dialog -->
    <v-dialog v-model="dialog" max-width="640">
      <v-card>
        <v-card-title>
          {{ form.id ? 'Редактирование подключения' : 'Новое подключение SKIF.PRO' }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="form.name"
            label="Название"
            placeholder="Основной аккаунт SKIF"
            :rules="[required]"
          />
          <v-text-field
            v-model="form.base_url"
            label="Базовый URL"
            placeholder="https://app.skif.pro"
            hint="По умолчанию https://app.skif.pro"
          />
          <v-text-field
            v-model="form.login"
            label="Логин (email)"
            placeholder="user@example.com"
            :rules="[required]"
          />
          <v-text-field
            v-model="form.password"
            label="Пароль"
            type="password"
            :placeholder="form.id ? '(оставьте пустым чтобы не менять)' : 'обязательное поле'"
            :rules="form.id ? [] : [required]"
            autocomplete="new-password"
          />
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="form.sync_interval"
                type="number"
                label="Интервал синхр. (минут)"
                min="1"
                :rules="[positiveInt]"
              />
            </v-col>
            <v-col cols="12" md="6" class="d-flex align-center">
              <v-switch
                v-model="form.auto_sync_enabled"
                label="Автосинхронизация"
                color="primary"
                hide-details
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" md="6">
              <v-checkbox
                v-model="form.sync_units"
                label="Синхронизировать объекты"
                hide-details
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-checkbox
                v-model="form.sync_terminals"
                label="Синхронизировать терминалы"
                hide-details
              />
            </v-col>
          </v-row>
          <v-alert v-if="form.id" type="info" variant="tonal" class="mt-3" density="compact">
            При смене URL/логина/пароля сохранённая cookie-сессия сбрасывается, следующий запрос сделает re-login.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Отмена</v-btn>
          <v-btn color="primary" :loading="busy['save']" @click="onSave">
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { skifService, type SkifConnection } from "@/services/skifService";

const connections = ref<SkifConnection[]>([]);
const loading = ref(false);
const error = ref("");
const busy = reactive<Record<string, boolean>>({});
const dialog = ref(false);

interface FormState {
  id: number | null;
  name: string;
  base_url: string;
  login: string;
  password: string;
  sync_interval: number;
  auto_sync_enabled: boolean;
  sync_units: boolean;
  sync_terminals: boolean;
}

const form = reactive<FormState>({
  id: null,
  name: "",
  base_url: "https://app.skif.pro",
  login: "",
  password: "",
  sync_interval: 15,
  auto_sync_enabled: false,
  sync_units: true,
  sync_terminals: false,
});

function required(v: string) { return !!v || "Обязательное поле"; }
function positiveInt(v: number) { return (v != null && v > 0) || "Должно быть > 0"; }

function resetForm() {
  form.id = null;
  form.name = "";
  form.base_url = "https://app.skif.pro";
  form.login = "";
  form.password = "";
  form.sync_interval = 15;
  form.auto_sync_enabled = false;
  form.sync_units = true;
  form.sync_terminals = false;
}

function openCreate() {
  resetForm();
  dialog.value = true;
}

function openEdit(c: SkifConnection) {
  form.id = c.id;
  form.name = c.name;
  form.base_url = c.base_url;
  form.login = c.login;
  form.password = "";
  form.sync_interval = c.sync_interval;
  form.auto_sync_enabled = c.auto_sync_enabled;
  form.sync_units = c.sync_units;
  form.sync_terminals = c.sync_terminals;
  dialog.value = true;
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    connections.value = await skifService.list();
  } catch (e: any) {
    error.value = e?.response?.data?.error || e?.message || "Ошибка загрузки";
  } finally {
    loading.value = false;
  }
}

async function onSave() {
  if (!form.name || !form.login) {
    error.value = "Заполните название и логин";
    return;
  }
  if (!form.id && !form.password) {
    error.value = "Пароль обязателен при создании";
    return;
  }
  busy.save = true;
  try {
    if (form.id) {
      const update: Record<string, unknown> = {
        name: form.name,
        base_url: form.base_url,
        login: form.login,
        sync_interval: form.sync_interval,
        auto_sync_enabled: form.auto_sync_enabled,
        sync_units: form.sync_units,
        sync_terminals: form.sync_terminals,
      };
      if (form.password) update.password = form.password;
      await skifService.update(form.id, update);
    } else {
      await skifService.create({
        name: form.name,
        base_url: form.base_url,
        login: form.login,
        password: form.password,
        sync_interval: form.sync_interval,
        auto_sync_enabled: form.auto_sync_enabled,
        sync_units: form.sync_units,
        sync_terminals: form.sync_terminals,
      });
    }
    dialog.value = false;
    await load();
  } catch (e: any) {
    error.value = e?.response?.data?.error || e?.message || "Ошибка сохранения";
  } finally {
    busy.save = false;
  }
}

async function onTest(c: SkifConnection) {
  busy[`test-${c.id}`] = true;
  error.value = "";
  try {
    await skifService.test(c.id);
    await load();
  } catch (e: any) {
    error.value = `Тест ${c.name}: ${e?.response?.data?.error || e?.message}`;
  } finally {
    busy[`test-${c.id}`] = false;
  }
}

async function onSync(c: SkifConnection) {
  busy[`sync-${c.id}`] = true;
  error.value = "";
  try {
    const r = await skifService.sync(c.id);
    await load();
    if (r?.upserted != null) {
      // мини-уведомление через временный alert
      error.value = `${c.name}: загружено ${r.upserted} объектов`;
    }
  } catch (e: any) {
    error.value = `Синхр. ${c.name}: ${e?.response?.data?.error || e?.message}`;
  } finally {
    busy[`sync-${c.id}`] = false;
  }
}

async function onDelete(c: SkifConnection) {
  if (!confirm(`Удалить подключение «${c.name}»? Все связанные юниты также будут удалены.`)) return;
  try {
    await skifService.remove(c.id);
    await load();
  } catch (e: any) {
    error.value = e?.response?.data?.error || e?.message || "Ошибка удаления";
  }
}

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("ru-RU");
}

onMounted(load);
</script>
