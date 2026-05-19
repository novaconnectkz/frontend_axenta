<template>
  <div class="cp-wrap">
    <form class="cp-card" @submit.prevent="submit">
      <h1>ACRM · Control-plane</h1>
      <p class="cp-sub">Панель монетизации (оператор)</p>
      <input v-model="username" placeholder="Логин оператора" autocomplete="username" />
      <input v-model="password" type="password" placeholder="Пароль" autocomplete="current-password" />
      <button :disabled="loading || !username || !password">
        {{ loading ? "Вход…" : "Войти" }}
      </button>
      <div v-if="err" class="cp-err">{{ err }}</div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { operatorLogin } from "./operatorClient";

const router = useRouter();
const username = ref("");
const password = ref("");
const loading = ref(false);
const err = ref("");

const submit = async () => {
  loading.value = true;
  err.value = "";
  try {
    await operatorLogin(username.value.trim(), password.value);
    router.push("/control-plane");
  } catch (e: any) {
    err.value = e?.response?.data?.error || e?.message || "Ошибка входа";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.cp-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f1115; }
.cp-card { width: 340px; padding: 32px; background: #1a1d24; border-radius: 14px; display: flex; flex-direction: column; gap: 12px; }
.cp-card h1 { color: #fff; font-size: 20px; margin: 0; }
.cp-sub { color: #8a8f99; font-size: 13px; margin: 0 0 8px; }
.cp-card input { padding: 11px 12px; border-radius: 8px; border: 1px solid #2c313c; background: #11141a; color: #fff; }
.cp-card button { padding: 11px; border: 0; border-radius: 8px; background: #3b82f6; color: #fff; font-weight: 600; cursor: pointer; }
.cp-card button:disabled { opacity: .5; cursor: default; }
.cp-err { color: #f87171; font-size: 13px; }
</style>
