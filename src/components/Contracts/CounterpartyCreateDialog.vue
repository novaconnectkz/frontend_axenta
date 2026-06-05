<template>
  <!--
    Phase C-хвост: переиспользуемый диалог создания контрагента (полные реквизиты).
    Используется и на странице Контрагенты (FAB), и inline из формы договора —
    чтобы не уходить со страницы создания договора. На @created родитель ставит
    counterparty_id; CounterpartySelector сам подхватит cp по watch(modelValue).
  -->
  <v-dialog :model-value="modelValue" max-width="820" scrollable @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">{{ isEdit ? 'mdi-account-edit' : 'mdi-account-plus' }}</v-icon>{{ isEdit ? 'Редактировать контрагента' : 'Новый контрагент' }}
        <v-chip v-if="isEdit && props.editCounterparty?.kind === 'partner'" size="x-small" color="purple" variant="tonal" class="ml-2">партнёр</v-chip>
      </v-card-title>
      <v-card-text style="max-height: 70vh">
        <!-- Роль контрагента (клиент / партнёр) -->
        <v-row dense class="mb-1">
          <v-col cols="12" sm="4">
            <v-select
              v-model="createForm.kind"
              :items="[{ title: 'Клиент', value: 'client' }, { title: 'Партнёр', value: 'partner' }]"
              label="Роль *"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
        </v-row>
        <div class="text-subtitle-2 text-primary mb-2"><v-icon size="18" class="mr-1">mdi-account</v-icon>Информация о клиенте</div>
        <v-row dense>
          <v-col cols="12" sm="4"><v-select v-model="createForm.client_type" :items="clientTypeItems" label="Тип клиента *" variant="outlined" density="comfortable" hide-details /></v-col>
          <v-col cols="12" sm="4"><v-text-field v-model="createForm.name" label="Полное наименование *" variant="outlined" density="comfortable" hide-details /></v-col>
          <v-col cols="12" sm="4"><v-text-field v-model="createForm.short_name" label="Сокращённое название с ОПФ" variant="outlined" density="comfortable" hide-details /></v-col>
        </v-row>
        <v-row dense>
          <v-col cols="12" sm="3"><v-select v-model="createForm.id_type" :items="idTypeItems" label="Тип ИД" variant="outlined" density="comfortable" hide-details /></v-col>
          <v-col cols="12" sm="3">
            <v-text-field
              v-model="createForm.tax_id"
              label="ИНН / БИН / ИИН"
              variant="outlined"
              density="comfortable"
              :hint="dadataHint"
              persistent-hint
              :loading="dadataLoading"
              @keyup.enter="lookupByInn"
            >
              <template #append-inner>
                <v-tooltip text="Заполнить по ИНН (DaData)" location="top">
                  <template #activator="{ props: tp }">
                    <v-icon
                      v-bind="tp"
                      :icon="dadataLoading ? 'mdi-loading mdi-spin' : 'mdi-cloud-search-outline'"
                      :color="canLookup ? 'primary' : undefined"
                      :class="{ 'cursor-pointer': canLookup }"
                      @click="lookupByInn"
                    />
                  </template>
                </v-tooltip>
              </template>
            </v-text-field>
          </v-col>
          <v-col cols="12" sm="3"><v-text-field v-model="createForm.kpp" label="КПП" variant="outlined" density="comfortable" hide-details /></v-col>
          <v-col cols="12" sm="3"><v-text-field v-model="createForm.ogrn" label="ОГРН" variant="outlined" density="comfortable" hide-details /></v-col>
        </v-row>
        <v-row dense>
          <v-col cols="12" sm="4"><v-text-field v-model="createForm.email" label="Email" variant="outlined" density="comfortable" hide-details /></v-col>
          <v-col cols="12" sm="4"><v-text-field v-model="createForm.phone" label="Телефон" variant="outlined" density="comfortable" hide-details /></v-col>
          <v-col cols="12" sm="4"><v-text-field v-model="createForm.website" label="Сайт" variant="outlined" density="comfortable" hide-details /></v-col>
        </v-row>
        <v-row dense>
          <v-col cols="12" sm="6"><v-textarea v-model="createForm.legal_address" label="Юридический адрес" rows="2" variant="outlined" density="comfortable" hide-details /></v-col>
          <v-col cols="12" sm="6"><v-textarea v-model="createForm.postal_address" label="Почтовый адрес" rows="2" variant="outlined" density="comfortable" hide-details /></v-col>
        </v-row>

        <!-- Руководство -->
        <div class="text-subtitle-2 mt-4 mb-2"><v-icon size="18" class="mr-1">mdi-account-tie</v-icon>Руководство</div>
        <v-row dense>
          <v-col cols="12" sm="6"><v-text-field v-model="createForm.director" label="Генеральный директор / Руководитель" variant="outlined" density="comfortable" hide-details /></v-col>
          <v-col cols="12" sm="6"><v-text-field v-model="createForm.based_on" label="Действует на основании" variant="outlined" density="comfortable" hide-details /></v-col>
        </v-row>

        <!-- Банк -->
        <div class="text-subtitle-2 mt-4 mb-2"><v-icon size="18" class="mr-1">mdi-bank</v-icon>Банковские реквизиты</div>
        <v-row dense>
          <v-col cols="12" sm="3"><v-text-field v-model="createForm.bank_bik" label="БИК" variant="outlined" density="comfortable" hide-details /></v-col>
          <v-col cols="12" sm="3"><v-text-field v-model="createForm.bank_account" label="Расчётный счёт" variant="outlined" density="comfortable" hide-details /></v-col>
          <v-col cols="12" sm="3"><v-text-field v-model="createForm.bank_correspondent_account" label="Корр. счёт" variant="outlined" density="comfortable" hide-details /></v-col>
          <v-col cols="12" sm="3"><v-text-field v-model="createForm.bank_name" label="Банк" variant="outlined" density="comfortable" hide-details /></v-col>
        </v-row>

        <!-- Биллинг -->
        <div class="text-subtitle-2 mt-4 mb-2"><v-icon size="18" class="mr-1">mdi-cash</v-icon>Биллинг</div>
        <v-row dense>
          <v-col cols="12" sm="6"><v-select v-model="createForm.billing_mode" :items="billingModeItems" label="Режим оплаты" variant="outlined" density="comfortable" hide-details /></v-col>
          <v-col cols="12" sm="6"><v-text-field v-model="createForm.credit_limit" label="Кредит-лимит" type="number" variant="outlined" density="comfortable" hide-details /></v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Отмена</v-btn>
        <v-btn color="primary" variant="flat" :loading="creating" :disabled="!createForm.name.trim()" @click="submitCreate">{{ isEdit ? 'Сохранить' : 'Создать' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import counterpartiesService, { type Counterparty } from "@/services/counterpartiesService";
import dadataService from "@/services/dadataService";

const props = defineProps<{
  modelValue: boolean;
  // Передан → диалог в режиме редактирования (префилл + PUT). Иначе — создание.
  editCounterparty?: Counterparty | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "created", cp: Counterparty): void;
  (e: "updated", cp: Counterparty): void;
  (e: "error", message: string): void;
}>();

const isEdit = computed(() => !!props.editCounterparty);

// Префилл формы из существующего контрагента (режим редактирования).
function formFromCounterparty(cp: Counterparty) {
  return {
    kind: (cp.kind || "client") as "client" | "partner",
    client_type: cp.client_type || "organization",
    name: cp.name || "",
    short_name: cp.short_name || "",
    id_type: (cp.id_type || "inn") as "inn" | "bin" | "iin" | "passport" | "other",
    tax_id: cp.tax_id || "",
    kpp: cp.kpp || "",
    ogrn: cp.ogrn || "",
    email: cp.email || "",
    phone: cp.phone || "",
    website: cp.website || "",
    legal_address: cp.legal_address || "",
    postal_address: cp.postal_address || "",
    director: cp.director || "",
    based_on: cp.based_on || "",
    bank_bik: cp.bank_bik || "",
    bank_account: cp.bank_account || "",
    bank_correspondent_account: cp.bank_correspondent_account || "",
    bank_name: cp.bank_name || "",
    billing_mode: cp.billing_mode || "prepaid",
    credit_limit: cp.credit_limit || "0",
  };
}

function emptyCreateForm() {
  return {
    kind: "client" as "client" | "partner",
    client_type: "organization",
    name: "",
    short_name: "",
    id_type: "inn" as "inn" | "bin" | "iin" | "passport" | "other",
    tax_id: "",
    kpp: "",
    ogrn: "",
    email: "",
    phone: "",
    website: "",
    legal_address: "",
    postal_address: "",
    director: "",
    based_on: "",
    bank_bik: "",
    bank_account: "",
    bank_correspondent_account: "",
    bank_name: "",
    billing_mode: "prepaid",
    credit_limit: "0",
  };
}

const createForm = ref(emptyCreateForm());
const creating = ref(false);

const clientTypeItems = [
  { title: "Организация", value: "organization" },
  { title: "ИП", value: "individual_entrepreneur" },
  { title: "Физлицо", value: "physical_person" },
];
const idTypeItems = [
  { title: "ИНН", value: "inn" },
  { title: "БИН", value: "bin" },
  { title: "ИИН", value: "iin" },
  { title: "Паспорт", value: "passport" },
  { title: "Другое", value: "other" },
];
const billingModeItems = [
  { title: "Предоплата", value: "prepaid" },
  { title: "Постоплата", value: "postpaid" },
];

// DaData-автозаполнение по ИНН (только id_type=inn, валидная длина 10/12 цифр).
const dadataLoading = ref(false);
const dadataHint = ref("");
const canLookup = computed(() => {
  const v = (createForm.value.tax_id || "").trim();
  return createForm.value.id_type === "inn" && /^\d{10}(\d{2})?$/.test(v);
});

async function lookupByInn() {
  if (!canLookup.value || dadataLoading.value) return;
  dadataLoading.value = true;
  dadataHint.value = "";
  try {
    const org = await dadataService.findOrganizationById(createForm.value.tax_id.trim());
    if (!org) {
      dadataHint.value = "Организация по ИНН не найдена";
      return;
    }
    const d = dadataService.extractOrganizationData(org);
    const f = createForm.value;
    // Заполняем только пустые поля (не затираем уже введённое вручную).
    const fill = (key: keyof typeof f, val?: string) => {
      if (val && !String(f[key]).trim()) (f[key] as string) = val;
    };
    fill("name", d.client_name);
    fill("short_name", d.client_short_name);
    fill("kpp", d.client_kpp);
    fill("ogrn", d.client_ogrn);
    fill("email", d.client_email);
    fill("phone", d.client_phone);
    fill("website", d.client_website);
    fill("legal_address", d.client_legal_address);
    fill("postal_address", d.client_postal_address);
    fill("director", d.client_director);
    fill("based_on", d.client_based_on);
    // Тип клиента по длине ИНН: 12 цифр = ИП/физлицо, 10 = организация (если ещё дефолт).
    if (createForm.value.tax_id.trim().length === 12 && f.client_type === "organization") {
      f.client_type = "individual_entrepreneur";
    }
    dadataHint.value = "Заполнено из DaData — проверьте и дополните";
  } catch (e: any) {
    dadataHint.value = "Ошибка запроса DaData";
  } finally {
    dadataLoading.value = false;
  }
}

// При открытии: edit → префилл из контрагента; create → чистая форма.
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      createForm.value = props.editCounterparty
        ? formFromCounterparty(props.editCounterparty)
        : emptyCreateForm();
      dadataHint.value = "";
    }
  }
);

async function submitCreate() {
  if (!createForm.value.name.trim()) return;
  creating.value = true;
  try {
    const f = createForm.value;
    // Поля из формы (общие для create и edit).
    const formFields = {
      kind: f.kind,
      client_type: f.client_type,
      name: f.name.trim(),
      short_name: f.short_name.trim() || undefined,
      id_type: f.id_type,
      tax_id: f.tax_id.trim() || undefined,
      kpp: f.kpp.trim() || undefined,
      ogrn: f.ogrn.trim() || undefined,
      email: f.email.trim() || undefined,
      phone: f.phone.trim() || undefined,
      website: f.website.trim() || undefined,
      legal_address: f.legal_address.trim() || undefined,
      postal_address: f.postal_address.trim() || undefined,
      director: f.director.trim() || undefined,
      based_on: f.based_on.trim() || undefined,
      bank_bik: f.bank_bik.trim() || undefined,
      bank_account: f.bank_account.trim() || undefined,
      bank_correspondent_account: f.bank_correspondent_account.trim() || undefined,
      bank_name: f.bank_name.trim() || undefined,
      billing_mode: f.billing_mode,
      credit_limit: f.credit_limit || "0",
    };

    if (props.editCounterparty) {
      // Edit: BE пишет все колонки (Select("*")). Шлём ПОЛНЫЙ объект — существующий
      // контрагент + правки формы — чтобы поля вне формы (address/okpo/паспорт/
      // bank_recipient) не затёрлись. kind BE защищает сам.
      const payload = { ...props.editCounterparty, ...formFields };
      const cp = await counterpartiesService.update(props.editCounterparty.id, payload);
      emit("updated", cp);
    } else {
      const cp = await counterpartiesService.create(formFields);
      emit("created", cp);
    }
    emit("update:modelValue", false);
  } catch (e: any) {
    emit("error", e?.response?.data?.error || (props.editCounterparty ? "Не удалось сохранить контрагента" : "Не удалось создать контрагента"));
  } finally {
    creating.value = false;
  }
}
</script>
