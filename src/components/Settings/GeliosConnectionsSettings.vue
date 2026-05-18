<template>
  <div class="gelios-connections">
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-h6">Подключения GELIOS</div>
        <div class="text-caption text-medium-emphasis">
          OAuth2 Bearer ({{ connections.length }} подключений) · api.geliospro.com
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
      <v-icon size="48" class="mb-2">mdi-crosshairs-gps</v-icon>
      <div>Нет подключений к GELIOS</div>
      <div class="text-caption mt-1">Добавьте первое подключение чтобы начать синхронизацию</div>
    </div>

    <v-table v-else density="comfortable">
      <thead>
        <tr>
          <th>Название</th>
          <th>Пользователь</th>
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
          <td>{{ c.username }}</td>
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
          {{ form.id ? 'Редактирование подключения' : 'Новое подключение GELIOS' }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="form.name"
            label="Название"
            placeholder="Основной аккаунт GELIOS"
            :rules="[required]"
          />
          <v-text-field
            v-model="form.username"
            label="Пользователь"
            placeholder="ГАРАЖ24"
            hint="Имя пользователя GELIOS (поддерживается кириллица)"
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
          <v-checkbox
            v-model="form.sync_units"
            label="Синхронизировать объекты"
            hide-details
          />
          <v-alert type="info" variant="tonal" class="mt-3" density="compact">
            Хост GELIOS фиксирован (api.geliospro.com), не настраивается.
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
import { geliosService, type GeliosConnection } from "@/services/geliosService";

const connections = ref<GeliosConnection[]>([]);
const loading = ref(false);
const error = ref("");
const busy = reactive<Record<string, boolean>>({});
const dialog = ref(false);

interface FormState {
  id: number | null;
  name: string;
  username: string;
  password: string;
  sync_interval: number;
  auto_sync_enabled: boolean;
  sync_units: boolean;
}

const form = reactive<FormState>({
  id: null,
  name: "",
  username: "",
  password: "",
  sync_interval: 15,
  auto_sync_enabled: false,
  sync_units: true,
});

function required(v: string) { return !!v || "Обязательное поле"; }
function positiveInt(v: number) { return (v != null && v > 0) || "Должно быть > 0"; }

function resetForm() {
  form.id = null;
  form.name = "";
  form.username = "";
  form.password = "";
  form.sync_interval = 15;
  form.auto_sync_enabled = false;
  form.sync_units = true;
}

function openCreate() {
  resetForm();
  dialog.value = true;
}

function openEdit(c: GeliosConnection) {
  form.id = c.id;
  form.name = c.name;
  form.username = c.username;
  form.password = "";
  form.sync_interval = c.sync_interval;
  form.auto_sync_enabled = c.auto_sync_enabled;
  form.sync_units = c.sync_units;
  dialog.value = true;
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    connections.value = await geliosService.list();
  } catch (e: any) {
    error.value = e?.response?.data?.error || e?.message || "Ошибка загрузки";
  } finally {
    loading.value = false;
  }
}

async function onSave() {
  if (!form.name || !form.username) {
    error.value = "Заполните название и пользователя";
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
        username: form.username,
        sync_interval: form.sync_interval,
        auto_sync_enabled: form.auto_sync_enabled,
        sync_units: form.sync_units,
      };
      if (form.password) update.password = form.password;
      await geliosService.update(form.id, update);
    } else {
      await geliosService.create({
        name: form.name,
        username: form.username,
        password: form.password,
        sync_interval: form.sync_interval,
        auto_sync_enabled: form.auto_sync_enabled,
        sync_units: form.sync_units,
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

async function onTest(c: GeliosConnection) {
  busy[`test-${c.id}`] = true;
  error.value = "";
  try {
    const r = await geliosService.test(c.id);
    await load();
    error.value = `${c.name}: OK, объектов в GELIOS — ${r?.units_total ?? "?"}`;
  } catch (e: any) {
    error.value = `Тест ${c.name}: ${e?.response?.data?.error || e?.message}`;
  } finally {
    busy[`test-${c.id}`] = false;
  }
}

async function onSync(c: GeliosConnection) {
  busy[`sync-${c.id}`] = true;
  error.value = "";
  try {
    const r = await geliosService.sync(c.id);
    await load();
    if (r?.upserted != null) {
      error.value = `${c.name}: загружено ${r.upserted} объектов`;
    }
  } catch (e: any) {
    error.value = `Синхр. ${c.name}: ${e?.response?.data?.error || e?.message}`;
  } finally {
    busy[`sync-${c.id}`] = false;
  }
}

async function onDelete(c: GeliosConnection) {
  if (!confirm(`Удалить подключение «${c.name}»? Все связанные объекты также будут удалены.`)) return;
  try {
    await geliosService.remove(c.id);
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
