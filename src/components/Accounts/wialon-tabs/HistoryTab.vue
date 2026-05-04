<template>
  <div class="t">
    <div class="ctl">
      <v-text-field v-model="from" type="date" label="От" density="compact" variant="outlined" hide-details />
      <v-text-field v-model="to" type="date" label="До" density="compact" variant="outlined" hide-details />
      <v-select v-model="typeFilter" :items="typeOptions" label="Тип" density="compact" variant="outlined" hide-details />
      <v-btn color="primary" size="small" :loading="loading" @click="load">Показать</v-btn>
    </div>
    <div class="tbl">
      <div class="hdr">
        <span>Время</span><span>Услуга</span><span>Стоимость</span><span>Счётчик</span><span>Описание</span>
      </div>
      <div v-for="(r, i) in records" :key="i" class="row">
        <span>{{ fmt(r.time) }}</span>
        <span>{{ r.service }}</span>
        <span>{{ r.cost }}</span>
        <span>{{ r.counter }}</span>
        <span>{{ r.descr }}</span>
      </div>
      <div v-if="records.length === 0 && !loading" class="muted">Записей нет</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { apiClient } from '@/services/api';
import { ref, watch } from 'vue';

interface Entry { time: number; service: string; cost: string; counter: number; descr: string }

const props = defineProps<{ connectionId: number; userId: number; visible: boolean }>();
const emit = defineEmits<{ (e: 'snack', p: { text: string; color: 'success'|'error'|'info' }): void }>();

const records = ref<Entry[]>([]);
const loading = ref(false);
const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
const from = ref(monthAgo);
const to = ref(today);
const typeFilter = ref<number>(0);
const typeOptions = [
  { title: 'Все', value: 0 },
  { title: 'Пополнение', value: 1 },
  { title: 'Списание', value: 2 },
];

const load = async () => {
  if (!props.connectionId || !props.userId) return;
  loading.value = true;
  try {
    const fromUnix = Math.floor(new Date(from.value).getTime() / 1000);
    const toUnix = Math.floor(new Date(to.value + 'T23:59:59').getTime() / 1000);
    const r = await apiClient.get(`/wialon/connections/${props.connectionId}/accounts/${props.userId}/history`, {
      params: { from: fromUnix, to: toUnix, type: typeFilter.value },
    });
    records.value = (r.data?.records || []).sort((a: Entry, b: Entry) => b.time - a.time);
  } catch (e: any) { emit('snack', { text: e?.response?.data?.error || 'Ошибка истории', color: 'error' }); }
  finally { loading.value = false; }
};

watch(() => [props.visible, props.userId], () => { if (props.visible) load(); }, { immediate: true });

const fmt = (unix: number) => new Date(unix * 1000).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
</script>

<style scoped>
.t { display: flex; flex-direction: column; gap: 12px; }
.ctl { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 8px; align-items: end; }
.tbl { display: flex; flex-direction: column; gap: 1px; max-height: 420px; overflow-y: auto; font-size: 12px; }
.hdr, .row { display: grid; grid-template-columns: 130px 1fr 80px 60px 2fr; gap: 8px; padding: 6px 8px; }
.hdr { background: rgba(0,0,0,0.06); font-weight: 600; position: sticky; top: 0; }
.row:hover { background: rgba(0,0,0,0.03); }
.muted { font-size: 13px; color: rgba(0,0,0,0.5); padding: 16px 0; text-align: center; }
</style>
