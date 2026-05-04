<template>
  <div class="t">
    <div v-if="loading" class="muted">Загрузка…</div>
    <template v-else>
      <section>
        <h5>Пользовательский FTP-сервер</h5>
        <v-switch v-model="ftp.enabled" :label="ftp.enabled ? 'Включён' : 'Выключен'" color="primary" hide-details inset density="compact" />
        <div class="grid">
          <v-text-field v-model="ftp.host" label="Хост" :disabled="!ftp.enabled" density="compact" variant="outlined" hide-details />
          <v-text-field v-model="ftp.login" label="Логин" :disabled="!ftp.enabled" density="compact" variant="outlined" hide-details />
          <v-text-field v-model="ftp.password" label="Пароль (оставить пустым = не менять)" :disabled="!ftp.enabled" type="password" density="compact" variant="outlined" hide-details />
          <v-text-field v-model="ftp.path" label="Директория" :disabled="!ftp.enabled" density="compact" variant="outlined" hide-details />
        </div>
        <v-btn color="primary" size="small" :loading="savingFtp" @click="saveFtp">Сохранить FTP</v-btn>
      </section>

      <v-divider />

      <section>
        <h5>Пользовательский шаблон письма</h5>
        <v-switch v-model="email.enabled" :label="email.enabled ? 'Включён' : 'Выключен'" color="primary" hide-details inset density="compact" />
        <v-text-field v-model="email.subject" label="Тема письма" :disabled="!email.enabled" density="compact" variant="outlined" hide-details />
        <v-textarea v-model="email.body" label="Тело письма" :disabled="!email.enabled" rows="4" density="compact" variant="outlined" hide-details />
        <div class="tags">
          <span class="tag" v-for="t in tags" :key="t.k"><code>{{ t.k }}</code> — {{ t.v }}</span>
        </div>
        <v-btn color="primary" size="small" :loading="savingEmail" @click="saveEmail">Сохранить шаблон</v-btn>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { apiClient } from '@/services/api';
import { ref, watch } from 'vue';

const props = defineProps<{ connectionId: number; userId: number; visible: boolean }>();
const emit = defineEmits<{ (e: 'snack', p: { text: string; color: 'success'|'error'|'info' }): void }>();

const loading = ref(false);
const savingFtp = ref(false);
const savingEmail = ref(false);

const ftp = ref({ enabled: false, host: '', login: '', password: '', path: '' });
const email = ref({ enabled: false, subject: '%JOB_NOTIFICATION%', body: 'Ваш отчет готов.' });

const tags = [
  { k: '%JOB_NOTIFICATION%', v: 'Имя задания/уведомления' },
  { k: '%TEMPLATE%', v: 'Имя шаблона отчёта' },
  { k: '%DATE_TIME%', v: 'Дата и время' },
  { k: '%ITEM%', v: 'Имя элемента отчёта' },
  { k: '%LINK%', v: 'Ссылка на скачивание отчёта' },
];

const load = async () => {
  if (!props.connectionId || !props.userId) return;
  loading.value = true;
  try {
    const r = await apiClient.get(`/wialon/connections/${props.connectionId}/accounts/${props.userId}/extra`);
    const d = r.data || {};
    ftp.value = { enabled: d.ftp_enabled, host: d.ftp_host || '', login: d.ftp_login || '', password: '', path: d.ftp_path || '' };
    email.value = { enabled: d.email_enabled, subject: d.email_subject || '%JOB_NOTIFICATION%', body: d.email_body || 'Ваш отчет готов.' };
  } catch (e: any) { emit('snack', { text: e?.response?.data?.error || 'Ошибка загрузки', color: 'error' }); }
  finally { loading.value = false; }
};

watch(() => [props.visible, props.userId], () => { if (props.visible) load(); }, { immediate: true });

const saveFtp = async () => {
  savingFtp.value = true;
  try {
    await apiClient.put(`/wialon/connections/${props.connectionId}/accounts/${props.userId}/extra/ftp`, ftp.value);
    emit('snack', { text: 'FTP сохранён', color: 'success' });
  } catch (e: any) { emit('snack', { text: e?.response?.data?.error || 'Ошибка', color: 'error' }); }
  finally { savingFtp.value = false; }
};
const saveEmail = async () => {
  savingEmail.value = true;
  try {
    await apiClient.put(`/wialon/connections/${props.connectionId}/accounts/${props.userId}/extra/email-template`, email.value);
    emit('snack', { text: 'Шаблон письма сохранён', color: 'success' });
  } catch (e: any) { emit('snack', { text: e?.response?.data?.error || 'Ошибка', color: 'error' }); }
  finally { savingEmail.value = false; }
};
</script>

<style scoped>
.t { display: flex; flex-direction: column; gap: 16px; }
section { display: flex; flex-direction: column; gap: 10px; }
section h5 { margin: 0; font-size: 13px; font-weight: 600; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; font-size: 11px; color: rgba(0,0,0,0.6); }
.tag { padding: 2px 6px; background: rgba(0,0,0,0.05); border-radius: 4px; }
.tag code { background: transparent; }
.muted { font-size: 13px; color: rgba(0,0,0,0.5); padding: 16px 0; text-align: center; }
</style>
