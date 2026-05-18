<template>
  <v-dialog v-model="show" max-width="520" persistent>
    <AppleCard>
      <template #header>
        <div class="hd">
          <h3>{{ mode === 'create' ? 'Создать GELIOS-пользователя' : mode === 'edit' ? 'Редактировать GELIOS-пользователя' : 'Удалить GELIOS-пользователя' }}</h3>
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

      <!-- EDIT (PATCH partial; пароль пустой = не менять) -->
      <div v-else-if="mode === 'edit'" class="body">
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
          label="Новый пароль (пусто — не менять)"
          type="password"
          variant="outlined"
          density="comfortable"
          :rules="[(v) => !v || v.length >= 5 || 'минимум 5 символов']"
          hide-details="auto"
        />
        <v-text-field v-model.trim="form.email" label="Email" type="email" variant="outlined" density="comfortable" hide-details="auto" />
        <v-text-field v-model.trim="form.phone" label="Телефон" variant="outlined" density="comfortable" hide-details="auto" />
        <v-text-field v-model.trim="form.legal_name" label="Юр. лицо" variant="outlined" density="comfortable" hide-details="auto" />
        <v-checkbox v-model="form.is_admin" label="Администратор (дилер-узел)" hide-details="auto" />
        <v-checkbox v-model="form.is_block" label="Заблокирован" hide-details="auto" />
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
            v-else-if="mode === 'edit'"
            color="primary"
            :loading="busy"
            :disabled="!canUpdate"
            @click="doUpdate"
          >Сохранить</v-btn>
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
  mode: 'create' | 'edit' | 'delete';
  connId: number | null;
  user: any | null; // UnifiedUser (для edit/delete)
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
// Снимок префилла для edit: PATCH partial — шлём ТОЛЬКО изменённые поля.
// Иначе вслепую перезаписали бы (напр. legalName, которого нет в unified
// user → префилл '' → затирание в GELIOS). Codex High.
const initial = ref<Record<string, any>>({});

const form = ref({
  creator_id: null as number | null,
  login: '',
  password: '',
  email: '',
  phone: '',
  legal_name: '',
  is_admin: false,
  is_block: false,
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
const canUpdate = computed(
  () =>
    !busy.value &&
    form.value.login.length >= 3 &&
    (!form.value.password || form.value.password.length >= 5),
);

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return;
    error.value = '';
    confirmLogin.value = '';
    const u = props.user || {};
    form.value = {
      creator_id: null,
      // edit: префилл из UnifiedUser; create/delete: пусто
      login: props.mode === 'edit' ? String(u.username || '') : '',
      password: '',
      email: props.mode === 'edit' ? String(u.email || '') : '',
      phone: props.mode === 'edit' ? String(u.phone || '') : '',
      legal_name: props.mode === 'edit' ? String(u.legalName || u.legal_name || '') : '',
      is_admin: props.mode === 'edit' ? !!(u.dealerRights ?? u.dealer_rights) : false,
      is_block: props.mode === 'edit' ? u.is_active === false : false,
    };
    // Снимок: всё что НЕ менял юзер → не уйдёт в PATCH (partial).
    // legal_name намеренно НЕ в unified user → останется '' и не
    // отправится если юзер его не трогал (защита от затирания).
    initial.value = { ...form.value };
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

async function doUpdate() {
  if (busy.value || !canUpdate.value) return;
  const connId = props.user?.connectionId ?? props.user?.connection_id ?? props.connId;
  const gid = props.user?.externalId ?? props.user?.external_id;
  if (!connId || Number.isNaN(Number(connId)) || !gid) {
    error.value = 'Нет connection_id/идентификатора GELIOS у записи — изменение невозможно';
    return;
  }
  // Partial: только изменённые поля (Codex High — иначе затрём legalName
  // и пр. вслепую). login шлём всегда (идентичность, prefill точен из
  // username). password — только если введён.
  const payload: Record<string, any> = { login: form.value.login };
  const init = initial.value;
  if (form.value.email !== init.email) payload.email = form.value.email;
  if (form.value.phone !== init.phone) payload.phone = form.value.phone;
  if (form.value.legal_name !== init.legal_name) payload.legal_name = form.value.legal_name;
  if (form.value.is_admin !== init.is_admin) payload.is_admin = form.value.is_admin;
  if (form.value.is_block !== init.is_block) payload.is_block = form.value.is_block;
  if (form.value.password) payload.password = form.value.password;
  busy.value = true;
  error.value = '';
  try {
    await geliosService.updateUser(Number(connId), String(gid), payload);
    emit('saved');
    show.value = false;
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Ошибка изменения';
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
