<template>
  <div class="notification-templates">
    <!-- Заголовок -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h3 class="text-h6 font-weight-bold mb-1">Шаблоны уведомлений</h3>
        <p class="text-body-2 text-medium-emphasis">
          Управление шаблонами для email/telegram/max каналов. Если для типа события нет
          company-specific шаблона, используется встроенный (builtin).
        </p>
      </div>
      <div class="d-flex gap-2">
        <v-btn
          variant="outlined"
          prepend-icon="mdi-flask-outline"
          @click="testDialogOpen = true"
        >Тестовая отправка</v-btn>
        <v-btn
          variant="outlined"
          prepend-icon="mdi-database-import"
          :loading="seedingDefaults"
          @click="seedDefaults"
        >Создать стандартные</v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreateDialog"
        >Новый шаблон</v-btn>
      </div>
    </div>

    <!-- Фильтры -->
    <v-card variant="flat" class="mb-4 pa-3" border>
      <div class="d-flex gap-3 flex-wrap">
        <v-select
          v-model="filters.type"
          :items="typeOptions"
          label="Тип события"
          density="compact"
          variant="outlined"
          clearable
          hide-details
          style="max-width: 280px"
          @update:modelValue="loadTemplates"
        />
        <v-select
          v-model="filters.channel"
          :items="channelOptions"
          label="Канал"
          density="compact"
          variant="outlined"
          clearable
          hide-details
          style="max-width: 200px"
          @update:modelValue="loadTemplates"
        />
        <v-spacer />
        <v-chip color="info" variant="tonal" size="small">
          Всего: {{ templates.length }}
        </v-chip>
      </div>
    </v-card>

    <!-- Таблица шаблонов -->
    <v-data-table
      :headers="tableHeaders"
      :items="templates"
      :loading="loading"
      density="comfortable"
      class="elevation-0 border"
      no-data-text="Нет шаблонов. Нажмите «Создать стандартные» чтобы добавить набор по умолчанию."
    >
      <template #[`item.type`]="{ item }">
        <code class="text-body-2">{{ item.type }}</code>
      </template>

      <template #[`item.channel`]="{ item }">
        <v-chip
          :color="channelColor(item.channel)"
          size="small"
          variant="tonal"
        >
          <v-icon start :icon="channelIcon(item.channel)" />
          {{ item.channel }}
        </v-chip>
      </template>

      <template #[`item.is_active`]="{ item }">
        <v-icon :color="item.is_active ? 'success' : 'grey'">
          {{ item.is_active ? 'mdi-check-circle' : 'mdi-circle-off-outline' }}
        </v-icon>
      </template>

      <template #[`item.company_id`]="{ item }">
        <v-chip
          v-if="item.company_id === 0"
          size="small"
          color="warning"
          variant="tonal"
          title="Глобальный шаблон, виден всем компаниям"
        >global</v-chip>
        <v-chip
          v-else-if="(item.name || '').startsWith('builtin_')"
          size="small"
          color="info"
          variant="tonal"
          title="Засеян из builtin-набора, можно редактировать"
        >builtin</v-chip>
        <v-chip
          v-else
          size="small"
          color="success"
          variant="tonal"
        >custom</v-chip>
      </template>

      <template #[`item.actions`]="{ item }">
        <v-btn
          size="small"
          variant="text"
          icon="mdi-pencil"
          :disabled="item.company_id === 0"
          @click="openEditDialog(item)"
        />
        <v-btn
          size="small"
          variant="text"
          icon="mdi-delete"
          color="error"
          :disabled="item.company_id === 0"
          @click="confirmDelete(item)"
        />
      </template>
    </v-data-table>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="editDialogOpen" max-width="800" persistent>
      <v-card>
        <v-card-title>
          {{ editingTemplate?.id ? `Редактировать шаблон #${editingTemplate?.id}` : 'Новый шаблон' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="editForm" v-model="editFormValid">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editingTemplate.name"
                  label="Имя (уникальное)"
                  variant="outlined"
                  density="compact"
                  :rules="[v => !!v || 'Обязательно']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editingTemplate.type"
                  :items="typeOptions"
                  label="Тип события"
                  variant="outlined"
                  density="compact"
                  :rules="[v => !!v || 'Обязательно']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editingTemplate.channel"
                  :items="channelOptions"
                  label="Канал"
                  variant="outlined"
                  density="compact"
                  :rules="[v => !!v || 'Обязательно']"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editingTemplate.priority"
                  :items="priorityOptions"
                  label="Приоритет"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-if="editingTemplate.channel === 'email'"
                  v-model="editingTemplate.subject"
                  label="Тема email (placeholders: {{.installation_id}}, {{.scheduled_at}}, ...)"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editingTemplate.template"
                  label="Тело шаблона (HTML для email, plain для telegram/max)"
                  variant="outlined"
                  rows="10"
                  :rules="[v => !!v || 'Обязательно']"
                  required
                />
                <div class="text-caption text-medium-emphasis">
                  Доступные placeholders (синтаксис Go text/template):
                  <code>installation_id</code>, <code>installation_type</code>,
                  <code>scheduled_at</code>, <code>address</code>,
                  <code>installer_full_name</code>, <code>client_contact</code>
                  — оборачивать в двойные фигурные скобки с точкой:
                  <code>{{ placeholderExample }}</code>
                </div>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editingTemplate.description"
                  label="Описание (для админов)"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="editingTemplate.retry_attempts"
                  label="Попыток повтора"
                  type="number"
                  variant="outlined"
                  density="compact"
                  min="0"
                  max="10"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="editingTemplate.delay_seconds"
                  label="Задержка (сек)"
                  type="number"
                  variant="outlined"
                  density="compact"
                  min="0"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-switch
                  v-model="editingTemplate.is_active"
                  label="Активен"
                  color="success"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editDialogOpen = false">Отмена</v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="!editFormValid"
            @click="saveTemplate"
          >Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Test Send Dialog -->
    <v-dialog v-model="testDialogOpen" max-width="600">
      <v-card>
        <v-card-title>Тестовая отправка уведомления</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-select
                v-model="testForm.type"
                :items="typeOptions"
                label="Тип события"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="testForm.channel"
                :items="channelOptions"
                label="Канал"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="testForm.recipient"
                :label="testForm.channel === 'email' ? 'Email-адрес получателя' : 'chat_id (Telegram/MAX)'"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="testDataJson"
                label="Данные для шаблона (JSON, опционально)"
                variant="outlined"
                rows="4"
                placeholder='{"installer_full_name": "Тест Тестов", "scheduled_at": "2026-01-15 10:00", "address": "ул. Пример, 1"}'
                hint="Если оставить пустым, шаблон будет рендериться с пустыми переменными"
                persistent-hint
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="testDialogOpen = false">Отмена</v-btn>
          <v-btn color="primary" :loading="testing" @click="performTest">Отправить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar для результатов -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { notificationsService, type NotificationTemplate } from "@/services/notificationsService";

const loading = ref(false);
const saving = ref(false);
const seedingDefaults = ref(false);
const testing = ref(false);

// Литерал для отображения placeholder-синтаксиса в шаблоне без ломания Vue парсера
const placeholderExample = "{{.installation_id}}";

const templates = ref<NotificationTemplate[]>([]);

const filters = reactive({
  type: "" as string | null,
  channel: "" as string | null,
});

const tableHeaders = [
  { title: "ID", key: "id", width: 70 },
  { title: "Имя", key: "name" },
  { title: "Тип", key: "type" },
  { title: "Канал", key: "channel", width: 130 },
  { title: "Активен", key: "is_active", width: 100 },
  { title: "Источник", key: "company_id", width: 110 },
  { title: "Действия", key: "actions", width: 120, sortable: false },
];

const typeOptions = [
  { title: "installation_created (новый монтаж)", value: "installation_created" },
  { title: "installation_updated (обновление)", value: "installation_updated" },
  { title: "installation_completed (завершён)", value: "installation_completed" },
  { title: "installation_cancelled (отменён)", value: "installation_cancelled" },
  { title: "installation_rescheduled (перенос)", value: "installation_rescheduled" },
  { title: "installation_reminder (напоминание)", value: "installation_reminder" },
];

const channelOptions = [
  { title: "Email", value: "email" },
  { title: "Telegram", value: "telegram" },
  { title: "MAX", value: "max" },
];

const priorityOptions = [
  { title: "Низкий", value: "low" },
  { title: "Обычный", value: "normal" },
  { title: "Высокий", value: "high" },
  { title: "Срочный", value: "urgent" },
];

// === Edit dialog ===

const editDialogOpen = ref(false);
const editingTemplate = ref<Partial<NotificationTemplate>>({});
const editFormValid = ref(false);

function openCreateDialog() {
  editingTemplate.value = {
    name: "",
    type: "installation_created",
    channel: "email",
    subject: "",
    template: "",
    description: "",
    is_active: true,
    language: "ru",
    priority: "normal",
    retry_attempts: 3,
    delay_seconds: 0,
  };
  editDialogOpen.value = true;
}

function openEditDialog(t: NotificationTemplate) {
  editingTemplate.value = { ...t };
  editDialogOpen.value = true;
}

async function saveTemplate() {
  saving.value = true;
  try {
    const payload = editingTemplate.value;
    if (payload.id) {
      await notificationsService.updateTemplate(payload.id, payload);
      showSnackbar("Шаблон обновлён", "success");
    } else {
      await notificationsService.createTemplate(payload);
      showSnackbar("Шаблон создан", "success");
    }
    editDialogOpen.value = false;
    await loadTemplates();
  } catch (e: any) {
    showSnackbar("Ошибка сохранения: " + (e.response?.data?.error || e.message), "error");
  } finally {
    saving.value = false;
  }
}

async function confirmDelete(t: NotificationTemplate) {
  if (!confirm(`Удалить шаблон «${t.name}»? Это действие нельзя отменить.`)) return;
  try {
    await notificationsService.deleteTemplate(t.id);
    showSnackbar("Шаблон удалён", "success");
    await loadTemplates();
  } catch (e: any) {
    showSnackbar("Ошибка удаления: " + (e.response?.data?.error || e.message), "error");
  }
}

async function seedDefaults() {
  seedingDefaults.value = true;
  try {
    await notificationsService.seedDefaults();
    showSnackbar("Стандартные шаблоны созданы / обновлены", "success");
    await loadTemplates();
  } catch (e: any) {
    showSnackbar("Ошибка: " + (e.response?.data?.error || e.message), "error");
  } finally {
    seedingDefaults.value = false;
  }
}

// === Test send ===

const testDialogOpen = ref(false);
const testForm = reactive({
  type: "installation_created",
  channel: "email" as "email" | "telegram" | "max",
  recipient: "",
});
const testDataJson = ref('{"installer_full_name": "Тест Тестов", "scheduled_at": "2026-01-15 10:00", "address": "ул. Пример, 1", "installation_id": 999}');

async function performTest() {
  testing.value = true;
  let data: Record<string, unknown> = {};
  try {
    data = testDataJson.value ? JSON.parse(testDataJson.value) : {};
  } catch {
    showSnackbar("Невалидный JSON в данных", "error");
    testing.value = false;
    return;
  }
  try {
    await notificationsService.testSend({
      type: testForm.type,
      channel: testForm.channel,
      recipient: testForm.recipient,
      data,
    });
    showSnackbar("Тестовое уведомление отправлено", "success");
    testDialogOpen.value = false;
  } catch (e: any) {
    showSnackbar("Ошибка отправки: " + (e.response?.data?.error || e.message), "error");
  } finally {
    testing.value = false;
  }
}

// === Snackbar ===

const snackbar = reactive({ show: false, message: "", color: "success" });
function showSnackbar(message: string, color: "success" | "error" | "info" = "info") {
  snackbar.message = message;
  snackbar.color = color;
  snackbar.show = true;
}

// === Helpers ===

function channelColor(ch: string): string {
  return { email: "blue", telegram: "cyan", max: "deep-purple" }[ch] || "grey";
}
function channelIcon(ch: string): string {
  return {
    email: "mdi-email",
    telegram: "mdi-send",
    max: "mdi-message-processing",
  }[ch] || "mdi-bell";
}

// === Load ===

async function loadTemplates() {
  loading.value = true;
  try {
    const filt: { type?: string; channel?: string } = {};
    if (filters.type) filt.type = filters.type;
    if (filters.channel) filt.channel = filters.channel;
    templates.value = await notificationsService.listTemplates(filt);
  } catch (e: any) {
    showSnackbar("Ошибка загрузки: " + (e.response?.data?.error || e.message), "error");
  } finally {
    loading.value = false;
  }
}

onMounted(loadTemplates);
</script>

<style scoped>
.notification-templates code {
  background: rgba(0, 0, 0, 0.04);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.85em;
}
</style>
