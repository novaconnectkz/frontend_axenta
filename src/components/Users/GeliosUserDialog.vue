<template>
  <v-dialog v-model="show" max-width="520" persistent>
    <AppleCard>
      <template #header>
        <div class="hd">
          <h3>{{ mode === 'create' ? 'Создать GELIOS-пользователя' : 'Удалить GELIOS-пользователя' }}</h3>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" :disabled="busy" @click="close" />
        </div>
      </template>

      <!-- CREATE -->
      <div v-if="mode === 'create'" class="body">
        <v-select
          v-model="form.creator_id"
          :items="creators"
          item-title="login"
          item-value="gelios_id"
          label="Создатель (узел дерева GELIOS)"
          variant="outlined"
          density="comfortable"
          :loading="loadingCreators"
          hide-details="auto"
        />
        <v-text-field
          v-model.trim="form.login"
          label="Логин *"
          variant="outlined"
          density="comfortable"
          :rules="[(v) => (v && v.length >= 3) || 'минимум 3 символа']"
          hide-details="auto"
        />
        <v-text-field
          v-model="form.password"
          label="Пароль *"
          type="password"
          variant="outlined"
          density="comfortable"
          :rules="[(v) => (v && v.length >= 5) || 'минимум 5 символов']"
          hide-details="auto"
        />
        <v-text-field v-model.trim="form.email" label="Email" type="email" variant="outlined" density="comfortable" hide-details="auto" />
        <v-text-field v-model.trim="form.phone" label="Телефон" variant="outlined" density="comfortable" hide-details="auto" />
        <v-text-field v-model.trim="form.legal_name" label="Юр. лицо" variant="outlined" density="comfortable" hide-details="auto" />
        <v-checkbox v-model="form.is_admin" label="Администратор (дилер-узел, может иметь детей)" hide-details="auto" />
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-2">{{ error }}</v-alert>
      </div>

      <!-- DELETE (защита от дурака: ввести логин для подтверждения) -->
      <div v-else class="body">
        <v-alert type="warning" variant="tonal" density="compact">
          GELIOS удаляет пользователя <b>безвозвратно</b> (hard delete). Восстановление невозможно.
        </v-alert>
        <p class="confirm-text">
          Пользователь: <b>{{ targetLogin || '—' }}</b><br />
          Создатель: {{ user?.creatorName || user?.creator_name || '—' }}
        </p>
        <v-alert v-if="!targetLogin" type="error" variant="tonal" density="compact">
          У записи нет канонического GELIOS-логина — удаление недоступно.
        </v-alert>
        <v-text-field
          v-else
          v-model.trim="confirmLogin"
          :label="`Введите логин «${targetLogin}» для подтверждения`"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
        />
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-2">{{ error }}</v-alert>
      </div>

      <template #footer>
        <div class="ft">
          <v-btn variant="text" :disabled="busy" @click="close">Отмена</v-btn>
          <v-spacer />
          <v-btn
            v-if="mode === 'create'"
            color="primary"
            :loading="busy"
            :disabled="!canCreate"
            @click="doCreate"
          >Создать</v-btn>
          <v-btn
            v-else
            color="error"
            :loading="busy"
            :disabled="!canDelete"
            @click="doDelete"
          >Удалить безвозвратно</v-btn>
        </div>
      </template>
    </AppleCard>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import AppleCard from '@/components/Apple/AppleCard.vue';
import { geliosService } from '@/services/geliosService';

const props = defineProps<{
  modelValue: boolean;
  mode: 'create' | 'delete';
  connId: number | null;
  user: any | null; // UnifiedUser (для delete)
}>();

const emit = defineEmits<{
  'update:modelValue': [v: boolean];
  saved: [];
}>();

const show = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
});

const busy = ref(false);
const error = ref('');
const loadingCreators = ref(false);
const creators = ref<{ gelios_id: number; login: string }[]>([]);
const confirmLogin = ref('');

const form = ref({
  creator_id: null as number | null,
  login: '',
  password: '',
  email: '',
  phone: '',
  legal_name: '',
  is_admin: false,
});

// Каноничный GELIOS-логин (username). НЕ fallback на name/legalName:
// удаление уходит по external_id, подтверждать надо именно логин (Codex #1).
const targetLogin = computed<string>(() => String(props.user?.username || ''));

const canCreate = computed(
  () =>
    !busy.value &&
    !!form.value.creator_id &&
    form.value.login.length >= 3 &&
    form.value.password.length >= 5,
);
const canDelete = computed(
  () => !busy.value && !!targetLogin.value && confirmLogin.value === targetLogin.value,
);

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return;
    error.value = '';
    confirmLogin.value = '';
    form.value = {
      creator_id: null,
      login: '',
      password: '',
      email: '',
      phone: '',
      legal_name: '',
      is_admin: false,
    };
    if (props.mode === 'create' && props.connId) {
      loadingCreators.value = true;
      try {
        creators.value = await geliosService.listCreators(props.connId);
      } catch (e: any) {
        error.value = e?.response?.data?.error || 'Не удалось загрузить список создателей';
      } finally {
        loadingCreators.value = false;
      }
    }
  },
);

async function doCreate() {
  if (busy.value || !props.connId || !canCreate.value) return;
  busy.value = true;
  error.value = '';
  try {
    await geliosService.createUser(props.connId, {
      login: form.value.login,
      password: form.value.password,
      creator_id: form.value.creator_id as number,
      is_admin: form.value.is_admin,
      email: form.value.email || undefined,
      phone: form.value.phone || undefined,
      legal_name: form.value.legal_name || undefined,
    });
    emit('saved');
    show.value = false;
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Ошибка создания (проверьте логин/пароль/создателя)';
  } finally {
    busy.value = false;
  }
}

async function doDelete() {
  if (busy.value || !canDelete.value) return;
  const connId = props.user?.connectionId ?? props.user?.connection_id ?? props.connId;
  const gid = props.user?.externalId ?? props.user?.external_id;
  if (!connId || Number.isNaN(Number(connId)) || !gid) {
    error.value = 'Нет connection_id/идентификатора GELIOS у записи — удаление невозможно';
    return;
  }
  busy.value = true;
  error.value = '';
  try {
    await geliosService.deleteUser(Number(connId), String(gid));
    emit('saved');
    show.value = false;
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Ошибка удаления';
  } finally {
    busy.value = false;
  }
}

function close() {
  if (busy.value) return;
  show.value = false;
}
</script>

<style scoped>
.hd { display: flex; align-items: center; }
.body { display: flex; flex-direction: column; gap: 12px; padding: 4px 2px; }
.ft { display: flex; align-items: center; width: 100%; }
.confirm-text { font-size: 13px; color: #555; margin: 4px 0; }
</style>
