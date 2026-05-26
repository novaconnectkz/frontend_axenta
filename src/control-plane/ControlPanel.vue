<template>
  <div class="cp">
    <header>
      <b>ACRM Control-plane</b>
      <span class="who">{{ me?.name || me?.username }}</span>
      <nav>
        <a v-for="t in tabs" :key="t" :class="{ on: tab === t }" @click="tab = t">{{ t }}</a>
      </nav>
      <button class="lo" @click="logout">Выйти</button>
    </header>

    <main>
      <!-- ПАКЕТЫ -->
      <section v-if="tab === 'Пакеты'">
        <form class="row" @submit.prevent="createPlan">
          <input v-model="np.code" placeholder="code" />
          <input v-model="np.name" placeholder="Название" />
          <input v-model.number="np.price_minor" type="number" placeholder="цена, коп." />
          <button>+ пакет</button>
        </form>
        <table>
          <tr><th>id</th><th>code</th><th>Название</th><th>цена</th><th>akt</th><th>фичи</th></tr>
          <tr v-for="p in plans" :key="p.id">
            <td>{{ p.id }}</td><td>{{ p.code }}</td><td>{{ p.name }}</td>
            <td>{{ (p.price_minor / 100).toFixed(2) }} {{ p.currency }}</td>
            <td>{{ p.is_active ? "✓" : "—" }}</td>
            <td>
              <span v-for="f in planFeat[p.id] || []" :key="f.feature_code" class="chip">{{ f.feature_code }}</span>
              <select @change="attachFeat(p.id, ($event.target as any).value)">
                <option value="">+ фича…</option>
                <option v-for="f in features" :key="f.code" :value="f.code">{{ f.code }}</option>
              </select>
            </td>
          </tr>
        </table>
      </section>

      <!-- ФИЧИ -->
      <section v-if="tab === 'Фичи'">
        <form class="row" @submit.prevent="createFeature">
          <input v-model="nf.code" placeholder="code" />
          <input v-model="nf.name" placeholder="Название" />
          <button>+ фича</button>
        </form>
        <table>
          <tr><th>id</th><th>code</th><th>Название</th><th>akt</th></tr>
          <tr v-for="f in features" :key="f.id">
            <td>{{ f.id }}</td><td>{{ f.code }}</td><td>{{ f.name }}</td><td>{{ f.is_active ? "✓" : "—" }}</td>
          </tr>
        </table>
      </section>

      <!-- КОМПАНИИ -->
      <section v-if="tab === 'Компании'">
        <table>
          <tr><th>id</th><th>Компания</th><th>тип</th><th>подписка / фичи</th></tr>
          <tr v-for="c in companies" :key="c.id">
            <td>{{ c.id }}</td><td>{{ c.name }}</td><td>{{ c.company_type }}</td>
            <td>
              <select v-model="subSel[c.id]">
                <option value="">— план —</option>
                <option v-for="p in plans" :key="p.id" :value="p.id">{{ p.code }}</option>
              </select>
              <button @click="assignSub(c.id)">назначить</button>
              <button @click="loadEff(c.id)">фичи</button>
              <div v-if="eff[c.id]" class="eff">
                <span v-for="(e, code) in eff[c.id]" :key="code" class="chip" :class="{ off: !e.Enabled }">
                  {{ code }}{{ e.Enabled ? "" : "✕" }}
                  <a @click="toggleOverride(c.id, String(code), !e.Enabled)">{{ e.Enabled ? "выкл" : "вкл" }}</a>
                </span>
              </div>
            </td>
          </tr>
        </table>
      </section>

      <!-- PROVISION -->
      <section v-if="tab === 'Provision'">
        <form class="col" @submit.prevent="provision">
          <input v-model="pv.company_name" placeholder="Название компании" />
          <input v-model="pv.admin_username" placeholder="Логин админа" />
          <input v-model="pv.admin_email" placeholder="Email админа" />
          <input v-model="pv.admin_password" type="password" placeholder="Пароль (≥10)" />
          <select v-model="pv.plan_id">
            <option :value="0">— без пакета —</option>
            <option v-for="p in plans" :key="p.id" :value="p.id">{{ p.code }}</option>
          </select>
          <button>Создать tenant</button>
        </form>
        <div v-if="pvMsg" class="ok">{{ pvMsg }}</div>
      </section>

      <!-- SMTP -->
      <section v-if="tab === 'SMTP'">
        <p class="hint">
          Глобальный SMTP-сервер ACRM (control-plane). Используется для системных
          email'ов: восстановление пароля, приглашения пользователей, нотификации
          оператору. Пароль хранится зашифрованным (AES-256-GCM).
        </p>
        <form class="form-grid" @submit.prevent="saveSmtp">
          <label>Host
            <input v-model="smtp.host" placeholder="smtp.acrm.su" />
          </label>
          <label>Port
            <input v-model.number="smtp.port" type="number" placeholder="587" />
          </label>
          <label>Username
            <input v-model="smtp.username" placeholder="noreply@acrm.su" />
          </label>
          <label>Password
            <input
              v-model="smtpPassword"
              type="password"
              :placeholder="smtp.has_password ? 'не менять (оставить как есть)' : 'установить пароль'"
              autocomplete="new-password"
            />
            <small v-if="smtp.has_password">Пароль уже сохранён. Пустое поле = не менять. Введите новый чтобы перезаписать.</small>
          </label>
          <label>From email
            <input v-model="smtp.from_email" placeholder="noreply@acrm.su" />
          </label>
          <label>From name
            <input v-model="smtp.from_name" placeholder="ACRM Платформа" />
          </label>
          <label class="checkbox">
            <input v-model="smtp.use_tls" type="checkbox" />
            TLS/STARTTLS (рекомендуется)
          </label>
          <div class="row">
            <button type="submit">Сохранить</button>
            <button type="button" @click="testSmtp" :disabled="!smtp.host || !smtp.from_email">Тест отправки</button>
          </div>
        </form>

        <div v-if="smtpTestDialog" class="dialog">
          <h4>Тест SMTP</h4>
          <p>Введите email-получателя:</p>
          <input v-model="smtpTestTo" type="email" placeholder="you@example.com" />
          <div class="row">
            <button @click="runSmtpTest" :disabled="!smtpTestTo">Отправить</button>
            <button @click="smtpTestDialog = false">Отмена</button>
          </div>
        </div>

        <div v-if="smtpMsg" :class="smtpMsgKind === 'ok' ? 'ok' : 'cp-err'">{{ smtpMsg }}</div>
      </section>

      <div v-if="err" class="cp-err">{{ err }}</div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { op, operatorLogout, isOperatorAuthed } from "./operatorClient";

const router = useRouter();
const tabs = ["Пакеты", "Фичи", "Компании", "Provision", "SMTP"];
const tab = ref("Пакеты");
const me = ref<any>(null);
const err = ref("");

const plans = ref<any[]>([]);
const features = ref<any[]>([]);
const companies = ref<any[]>([]);
const planFeat = ref<Record<number, any[]>>({});
const eff = ref<Record<number, any>>({});
const subSel = ref<Record<number, any>>({});

const np = ref({ code: "", name: "", price_minor: 0 });
const nf = ref({ code: "", name: "" });
const pv = ref({ company_name: "", admin_username: "", admin_email: "", admin_password: "", plan_id: 0 });
const pvMsg = ref("");

function fail(e: any) {
  err.value = e?.response?.data?.error || e?.message || "Ошибка";
}

async function loadAll() {
  err.value = "";
  try {
    const [p, f, c] = await Promise.all([
      op.get("/plans"), op.get("/features"), op.get("/companies"),
    ]);
    plans.value = p.data.data || [];
    features.value = f.data.data || [];
    companies.value = c.data.data || [];
    for (const pl of plans.value) {
      const r = await op.get(`/plans/${pl.id}/features`);
      planFeat.value[pl.id] = r.data.data || [];
    }
  } catch (e) { fail(e); }
}

const createPlan = async () => {
  try { await op.post("/plans", np.value); np.value = { code: "", name: "", price_minor: 0 }; loadAll(); }
  catch (e) { fail(e); }
};
const createFeature = async () => {
  try { await op.post("/features", nf.value); nf.value = { code: "", name: "" }; loadAll(); }
  catch (e) { fail(e); }
};
const attachFeat = async (planId: number, code: string) => {
  if (!code) return;
  try { await op.post(`/plans/${planId}/features`, { feature_code: code }); loadAll(); }
  catch (e) { fail(e); }
};
const assignSub = async (cid: number) => {
  if (!subSel.value[cid]) return;
  try { await op.post(`/companies/${cid}/subscription`, { plan_id: Number(subSel.value[cid]) }); loadEff(cid); }
  catch (e) { fail(e); }
};
const loadEff = async (cid: number) => {
  try { const r = await op.get(`/companies/${cid}/entitlements`); eff.value[cid] = r.data.data || {}; }
  catch (e) { fail(e); }
};
const toggleOverride = async (cid: number, code: string, enable: boolean) => {
  try {
    await op.put(`/companies/${cid}/entitlements/${code}`, { enabled: enable, override_reason: "control-plane" });
    loadEff(cid);
  } catch (e) { fail(e); }
};
const provision = async () => {
  pvMsg.value = "";
  try {
    const r = await op.post("/provision", { ...pv.value, plan_id: Number(pv.value.plan_id) });
    pvMsg.value = `OK: company #${r.data.data.company_id}, schema ${r.data.data.schema}`;
    pv.value = { company_name: "", admin_username: "", admin_email: "", admin_password: "", plan_id: 0 };
    loadAll();
  } catch (e) { fail(e); }
};
const logout = async () => {
  await operatorLogout();
  router.push("/control-plane/login");
};

// === SMTP control-plane ===
const smtp = ref<any>({
  host: "", port: 587, username: "", use_tls: true,
  from_email: "", from_name: "", has_password: false,
});
const smtpPassword = ref(""); // отдельно, чтобы пустая строка = не менять
const smtpMsg = ref("");
const smtpMsgKind = ref<"ok" | "err">("ok");
const smtpTestDialog = ref(false);
const smtpTestTo = ref("");

async function loadSmtp() {
  try {
    const r = await op.get("/smtp");
    smtp.value = r.data?.data || smtp.value;
    smtpPassword.value = "";
  } catch (e: any) {
    smtpMsgKind.value = "err";
    smtpMsg.value = e.response?.data?.error || "Ошибка загрузки SMTP";
  }
}

async function saveSmtp() {
  smtpMsg.value = "";
  try {
    const payload: any = {
      host: smtp.value.host,
      port: smtp.value.port,
      username: smtp.value.username,
      use_tls: smtp.value.use_tls,
      from_email: smtp.value.from_email,
      from_name: smtp.value.from_name,
    };
    // password: null/undefined = не менять; явный string = установить.
    if (smtpPassword.value !== "") payload.password = smtpPassword.value;
    const r = await op.put("/smtp", payload);
    smtp.value = r.data?.data || smtp.value;
    smtpPassword.value = "";
    smtpMsgKind.value = "ok";
    smtpMsg.value = "Сохранено";
  } catch (e: any) {
    smtpMsgKind.value = "err";
    smtpMsg.value = e.response?.data?.error || "Ошибка сохранения";
  }
}

function testSmtp() {
  smtpTestTo.value = "";
  smtpTestDialog.value = true;
  smtpMsg.value = "";
}

async function runSmtpTest() {
  try {
    const r = await op.post("/smtp/test", { to: smtpTestTo.value });
    smtpTestDialog.value = false;
    smtpMsgKind.value = "ok";
    smtpMsg.value = `Тест отправлен на ${r.data?.data?.sent_to}`;
  } catch (e: any) {
    smtpMsgKind.value = "err";
    smtpMsg.value = e.response?.data?.error || "Ошибка теста SMTP";
  }
}

onMounted(async () => {
  if (!isOperatorAuthed()) {
    router.replace("/control-plane/login");
    return;
  }
  try {
    me.value = (await op.get("/me")).data.data;
  } catch {
    router.replace("/control-plane/login");
    return;
  }
  loadAll();
  loadSmtp();
});
</script>

<style scoped>
.cp { min-height: 100vh; background: #0f1115; color: #e6e8ec; font: 14px/1.5 system-ui; }
header { display: flex; align-items: center; gap: 16px; padding: 12px 20px; background: #1a1d24; border-bottom: 1px solid #262a33; }
header b { color: #fff; }
.who { color: #8a8f99; font-size: 13px; }
nav { display: flex; gap: 4px; margin-left: 16px; }
nav a { padding: 6px 12px; border-radius: 7px; cursor: pointer; color: #b6bcc7; }
nav a.on { background: #3b82f6; color: #fff; }
.lo { margin-left: auto; background: #2c313c; color: #e6e8ec; border: 0; padding: 7px 12px; border-radius: 7px; cursor: pointer; }
main { padding: 20px; }
table { width: 100%; border-collapse: collapse; margin-top: 12px; }
th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #262a33; font-size: 13px; }
th { color: #8a8f99; font-weight: 600; }
.row, .col { display: flex; gap: 8px; flex-wrap: wrap; }
.col { flex-direction: column; max-width: 360px; }
input, select { padding: 8px 10px; border-radius: 7px; border: 1px solid #2c313c; background: #11141a; color: #fff; }
button { padding: 8px 12px; border: 0; border-radius: 7px; background: #3b82f6; color: #fff; cursor: pointer; }
.chip { display: inline-block; background: #233; color: #9ad; padding: 2px 8px; border-radius: 12px; margin: 2px; font-size: 12px; }
.chip.off { background: #3a2330; color: #f7a7c0; }
.chip a { margin-left: 6px; cursor: pointer; text-decoration: underline; opacity: .8; }
.eff { margin-top: 6px; }
.ok { color: #4ade80; margin-top: 12px; }
.cp-err { color: #f87171; margin-top: 14px; }

.hint { color: #9aa0ac; max-width: 720px; margin-bottom: 18px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 20px; max-width: 720px; }
.form-grid label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #9aa0ac; }
.form-grid label input { background: #14171c; color: #e6e8ec; border: 1px solid #2a2e36; border-radius: 6px; padding: 8px 10px; font-size: 14px; }
.form-grid label.checkbox { flex-direction: row; align-items: center; gap: 8px; color: #e6e8ec; }
.form-grid label small { color: #6b727f; font-size: 11px; }
.form-grid .row { grid-column: span 2; display: flex; gap: 10px; margin-top: 8px; }
.form-grid .row button { background: #1f6feb; color: white; border: 0; border-radius: 6px; padding: 8px 16px; cursor: pointer; }
.form-grid .row button:hover { background: #2a7cf5; }
.form-grid .row button:disabled { background: #444; cursor: not-allowed; }
.dialog { margin-top: 20px; padding: 16px; background: #1a1d23; border: 1px solid #2a2e36; border-radius: 8px; max-width: 480px; }
.dialog h4 { margin: 0 0 10px; color: #e6e8ec; }
.dialog input { width: 100%; background: #14171c; color: #e6e8ec; border: 1px solid #2a2e36; border-radius: 6px; padding: 8px 10px; margin-bottom: 12px; }
.dialog .row { display: flex; gap: 10px; }
.dialog .row button { background: #1f6feb; color: white; border: 0; border-radius: 6px; padding: 8px 16px; cursor: pointer; }
.dialog .row button:last-child { background: #444; }
</style>
