<template>
  <div class="hub-login">
    <!-- Левая колонка: форма входа -->
    <div class="hub-left">
      <div class="hub-card">
        <div class="hub-brand">
          <div class="hub-brand-logo">A</div>
          <div class="hub-brand-name">ACRM <span>Hub</span></div>
        </div>

        <h2 class="hub-title">Войдите в CRM-аккаунт</h2>
        <p class="hub-sub">Источники мониторинга подключаются в настройках после входа.</p>

        <form @submit.prevent="handleLogin" class="hub-form">
          <div class="hub-field">
            <label>Логин</label>
            <div class="hub-input-wrap">
              <input
                v-model="form.username"
                type="text"
                placeholder="Ваш логин"
                class="hub-input"
                :class="{ 'has-error': fieldErrors.username }"
                @input="clearFieldError('username')"
                required
              />
            </div>
            <div v-if="fieldErrors.username" class="hub-err">{{ fieldErrors.username }}</div>
          </div>

          <div class="hub-field">
            <label>Пароль</label>
            <div class="hub-input-wrap">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="hub-input"
                :class="{ 'has-error': fieldErrors.password }"
                @input="clearFieldError('password')"
                required
              />
              <button type="button" class="hub-pass-toggle" @click="showPassword = !showPassword" tabindex="-1">
                <svg v-if="showPassword" width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                </svg>
                <svg v-else width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/>
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                </svg>
              </button>
            </div>
            <div v-if="fieldErrors.password" class="hub-err">{{ fieldErrors.password }}</div>
          </div>

          <div class="hub-row hub-row-between">
            <label class="hub-remember">
              <input v-model="rememberMe" type="checkbox">
              <span class="hub-chk"></span>
              <span>Запомнить меня</span>
            </label>
            <a class="hub-forgot" @click.prevent="forgotOpen = true" href="#">Забыли пароль?</a>
          </div>

          <button type="submit" class="hub-btn" :disabled="isLoading || !isFormValid">
            <span v-if="!isLoading">Войти →</span>
            <span v-else class="hub-spinner"></span>
          </button>
        </form>

        <div v-if="error" class="hub-alert">
          <span>{{ error }}</span>
          <button @click="clearError" class="hub-alert-close" aria-label="Закрыть">×</button>
        </div>

        <!-- Диалог "Забыли пароль?" -->
        <div v-if="forgotOpen" class="hub-modal-backdrop" @click.self="forgotOpen = false">
          <div class="hub-modal">
            <div class="hub-modal-title">Сброс пароля</div>
            <p class="hub-modal-sub">Введите email учётной записи. Если он зарегистрирован — придёт письмо со ссылкой для сброса (действует 1 час).</p>
            <input
              v-model="forgotEmail"
              type="email"
              placeholder="you@example.com"
              class="hub-modal-input"
              @keyup.enter="submitForgot"
              autofocus
            />
            <div v-if="forgotMsg" :class="forgotKind === 'ok' ? 'hub-modal-ok' : 'hub-modal-err'">{{ forgotMsg }}</div>
            <div class="hub-modal-actions">
              <button class="hub-btn-sec" @click="forgotOpen = false">Отмена</button>
              <button class="hub-btn" :disabled="!forgotEmail || forgotSubmitting" @click="submitForgot">
                <span v-if="!forgotSubmitting">Отправить</span>
                <span v-else class="hub-spinner"></span>
              </button>
            </div>
          </div>
        </div>

        <div class="hub-foot">Защищённый вход · Единый ACRM-аккаунт</div>
      </div>
    </div>

    <!-- Правая колонка: hero + orbit -->
    <div class="hub-right">
      <svg class="hub-map" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs><pattern id="hubgrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="currentColor" stroke-width="1"/></pattern></defs>
        <rect width="600" height="600" fill="url(#hubgrid)"/>
        <path d="M60 480 Q200 380 320 420 T560 300" fill="none" stroke="var(--hub-route-a)" stroke-width="2" stroke-dasharray="6 6"/>
        <path d="M80 120 Q220 200 360 150 T540 220" fill="none" stroke="var(--hub-route-b)" stroke-width="2" stroke-dasharray="6 6"/>
        <circle cx="60" cy="480" r="6" fill="#007AFF"/><circle cx="560" cy="300" r="6" fill="#34C759"/>
        <circle cx="80" cy="120" r="6" fill="#FF9500"/><circle cx="540" cy="220" r="6" fill="#AF52DE"/>
      </svg>

      <div class="hub-hero">
        <span class="hub-hero-badge">● Центр управления GPS-платформами</span>
        <h1>Один <span class="hub-grad">Hub</span> —<br>все системы</h1>
        <p>ACRM Hub объединяет Axenta, Wialon, GELIOS, SKIF и любые новые платформы в единый центр. Клиенты, договоры и биллинг — из одной точки входа.</p>
      </div>

      <div class="hub-orbit" aria-hidden="true">
        <svg class="hub-orbit-svg" viewBox="0 0 440 320">
          <circle cx="218" cy="168" r="118" fill="none" stroke="var(--hub-ring-a)" stroke-width="1.5" stroke-dasharray="4 5"/>
          <circle cx="218" cy="168" r="168" fill="none" stroke="var(--hub-ring-b)" stroke-width="1.5" stroke-dasharray="4 5"/>
          <g stroke="url(#hubbeam)" stroke-width="2">
            <line x1="218" y1="168" x2="32" y2="40"/>
            <line x1="218" y1="168" x2="400" y2="32"/>
            <line x1="218" y1="168" x2="50" y2="280"/>
            <line x1="218" y1="168" x2="384" y2="264"/>
            <line x1="218" y1="168" x2="227" y2="21" stroke-dasharray="3 4"/>
          </g>
          <defs><linearGradient id="hubbeam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="var(--hub-beam-0)"/><stop offset="1" stop-color="var(--hub-beam-1)"/>
          </linearGradient></defs>
        </svg>
        <div class="hub-core"><b>ACRM</b><small>Hub</small></div>
        <div class="hub-node n1"><img :src="logos.axenta" alt="Axenta"><span class="hub-node-lbl">Axenta</span></div>
        <div class="hub-node n2"><img :src="logos.wialon" alt="Wialon"><span class="hub-node-lbl">Wialon</span></div>
        <div class="hub-node n3"><img :src="logos.gelios" alt="GELIOS"><span class="hub-node-lbl">GELIOS</span></div>
        <div class="hub-node n4"><img :src="logos.skif" alt="SKIF"><span class="hub-node-lbl">SKIF</span></div>
        <div class="hub-ghost">+<span class="hub-node-lbl">и другие</span></div>
      </div>

      <div class="hub-note"><b>Единый центр управления.</b> Все платформы сходятся в один ACRM Hub — новые системы добавляются без миграции данных.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth, type LoginForm } from '@/context/auth';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { config } from '@/config/env';
import axentaLogo from '@/assets/providers/axenta.png';
import wialonLogo from '@/assets/providers/wialon.svg';
import geliosLogo from '@/assets/providers/gelios.svg';
import skifLogo from '@/assets/providers/skif.png';

const logos = {
  axenta: axentaLogo,
  wialon: wialonLogo,
  gelios: geliosLogo,
  skif: skifLogo,
};

const router = useRouter();

// Получаем auth безопасно - ленивая инициализация
let auth: any = null;

const getAuth = () => {
  if (!auth) {
    try {
      auth = useAuth();
    } catch (e) {
      console.warn('Auth provider не доступен:', e);
      return null;
    }
  }
  return auth;
};

// Форма
const form = ref<LoginForm>({
  username: '',
  password: '',
});

// UI состояние
const showPassword = ref(false);
const rememberMe = ref(true);
const isLoading = ref(false);
const error = ref('');

// Forgot-password диалог
const forgotOpen = ref(false);
const forgotEmail = ref('');
const forgotMsg = ref('');
const forgotKind = ref<'ok' | 'err'>('ok');
const forgotSubmitting = ref(false);

async function submitForgot() {
  if (!forgotEmail.value) return;
  forgotSubmitting.value = true;
  forgotMsg.value = '';
  try {
    const r = await axios.post(
      `${config.apiBaseUrl}/auth/forgot-password`,
      { email: forgotEmail.value },
      { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
    );
    forgotKind.value = 'ok';
    forgotMsg.value = r.data?.message || 'Если email зарегистрирован — письмо отправлено';
  } catch (e: any) {
    // BE anti-enum: 200 даже на ошибках. Сюда попадаем только если сеть/CORS.
    forgotKind.value = 'err';
    forgotMsg.value = e?.response?.data?.error || 'Не удалось отправить запрос';
  } finally {
    forgotSubmitting.value = false;
  }
}

// Ошибки полей
const fieldErrors = ref<Record<string, string>>({
  username: '',
  password: '',
});

// Проверяем, был ли пользователь перенаправлен из-за истечения сессии
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const reason = urlParams.get('reason');
  
  if (reason === 'session_expired') {
    error.value = 'Ваша сессия истекла. Пожалуйста, войдите заново.';
    console.log('🔔 Пользователь перенаправлен на страницу входа: сессия истекла');
    
    // Очищаем параметр из URL для чистоты
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
  }
  
  // Проверяем, есть ли сохраненный путь для редиректа после входа
  const redirectPath = localStorage.getItem('redirect_after_login');
  if (redirectPath) {
    console.log('📍 После входа будет редирект на:', redirectPath);
  }
});

// Валидация формы
const isFormValid = computed(() => {
  return form.value.username.length >= 3 && form.value.password.length >= 3;
});



// Методы
const clearFieldError = (field: string) => {
  fieldErrors.value[field] = '';
  error.value = '';
};

const clearError = () => {
  error.value = '';
  fieldErrors.value = { username: '', password: '' };
};

const handleLogin = async () => {
  clearError();

  if (!isFormValid.value) {
    error.value = 'Заполните все поля корректно';
    return;
  }

  isLoading.value = true;

  try {
    const authContext = getAuth();
    if (authContext) {
      // Используем auth context если доступен
      await authContext.login({
        username: form.value.username.trim(),
        password: form.value.password,
      });
      
      // Проверяем, есть ли сохраненный путь для редиректа
      const redirectPath = localStorage.getItem('redirect_after_login');
      if (redirectPath) {
        console.log('🔄 Перенаправление на сохраненный путь:', redirectPath);
        localStorage.removeItem('redirect_after_login');
        await router.push(redirectPath);
      } else {
        // Перенаправляем на dashboard
        await router.push('/dashboard');
      }
    } else {
      // Прямой запрос к API если auth context недоступен
      const response = await fetch(`${config.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: form.value.username.trim(),
          password: form.value.password,
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // Сохраняем данные
        localStorage.setItem('axenta_token', data.data.token);
        localStorage.setItem('axenta_user', JSON.stringify(data.data.user));
        
        if (data.data.company) {
          localStorage.setItem('axenta_company', JSON.stringify(data.data.company));
        }

        // Проверяем, есть ли сохраненный путь для редиректа
        const redirectPath = localStorage.getItem('redirect_after_login');
        if (redirectPath) {
          console.log('🔄 Перенаправление на сохраненный путь:', redirectPath);
          localStorage.removeItem('redirect_after_login');
          window.location.href = redirectPath;
        } else {
          // Перенаправляем
          window.location.href = '/dashboard';
        }
      } else {
        error.value = data.error || 'Ошибка авторизации';
      }
    }

  } catch (err: any) {
    console.error('Ошибка входа:', err);
    
    if (err.message.includes('username') || err.message.includes('логин')) {
      fieldErrors.value.username = err.message;
    } else if (err.message.includes('password') || err.message.includes('пароль')) {
      fieldErrors.value.password = err.message;
    } else {
      error.value = err.message || 'Ошибка входа в систему';
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  console.log('🍎 Apple Style Login mounted');
  
  // Если пользователь уже авторизован, перенаправляем
  if (auth?.isAuthenticated?.value) {
    router.push('/dashboard');
  }
});

// Следим за изменениями аутентификации - ленивая инициализация
onMounted(() => {
  const authContext = getAuth();
  if (authContext) {
    watch(
      () => authContext.isAuthenticated.value,
      (isAuth) => {
        if (isAuth) {
          router.push('/dashboard');
        }
      }
    );
  }
});
</script>

<style scoped>
.hub-login{
  --blue:#007AFF; --indigo:#5856D6; --gray:#8E8E93;
  --hub-route-a:rgba(0,122,255,.30); --hub-route-b:rgba(88,86,214,.28);
  --hub-ring-a:rgba(0,122,255,.16); --hub-ring-b:rgba(88,86,214,.12);
  --hub-beam-0:rgba(88,86,214,.55); --hub-beam-1:rgba(0,122,255,.12);
  min-height:100vh; display:flex; position:relative; overflow:hidden;
  background:#F5F7FB;
  font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,sans-serif;
}
.hub-login::before{
  content:""; position:absolute; inset:0; pointer-events:none;
  background:
    radial-gradient(60% 50% at 80% 16%, rgba(0,122,255,.13), transparent 60%),
    radial-gradient(50% 50% at 92% 72%, rgba(88,86,214,.12), transparent 60%);
}

/* LEFT */
.hub-left{ flex:0 0 42%; display:flex; align-items:center; justify-content:center; padding:48px; position:relative; z-index:2; }
.hub-card{
  width:100%; max-width:410px;
  background:rgba(255,255,255,.72); backdrop-filter:blur(28px);
  border:1px solid rgba(255,255,255,.7); border-radius:24px; padding:40px;
  box-shadow:0 24px 70px rgba(20,30,80,.12), 0 2px 8px rgba(0,0,0,.04);
}
.hub-brand{ display:flex; align-items:center; gap:12px; margin-bottom:34px; }
.hub-brand-logo{
  width:46px; height:46px; border-radius:13px;
  background:linear-gradient(135deg,var(--blue),var(--indigo));
  display:flex; align-items:center; justify-content:center;
  color:#fff; font-weight:700; font-size:22px; box-shadow:0 6px 18px rgba(0,122,255,.35);
}
.hub-brand-name{ font-size:20px; font-weight:700; letter-spacing:-.4px; color:#1d1d1f; }
.hub-brand-name span{ color:var(--gray); font-weight:500; }
.hub-title{ font-size:25px; font-weight:700; letter-spacing:-.5px; margin:0 0 6px; color:#1d1d1f; }
.hub-sub{ font-size:14px; color:var(--gray); margin:0 0 28px; line-height:1.45; }

.hub-form{ display:flex; flex-direction:column; }
.hub-field{ margin-bottom:16px; }
.hub-field label{ display:block; font-size:13px; font-weight:600; color:#3a3a3c; margin-bottom:7px; }
.hub-input-wrap{ position:relative; display:flex; align-items:center; }
.hub-input{
  width:100%; height:50px; padding:0 16px; border:1.5px solid #E2E2E7; border-radius:13px;
  font-size:15px; background:rgba(255,255,255,.85); transition:.2s; outline:none; color:#1d1d1f;
  font-family:inherit;
}
.hub-input:focus{ border-color:var(--blue); box-shadow:0 0 0 4px rgba(0,122,255,.12); background:#fff; }
.hub-input.has-error{ border-color:#FF3B30; background:rgba(255,59,48,.05); }
.hub-input::placeholder{ color:#A0A0A6; }
.hub-pass-toggle{
  position:absolute; right:14px; background:none; border:none; color:var(--gray);
  cursor:pointer; padding:4px; display:flex; transition:.2s;
}
.hub-pass-toggle:hover{ color:var(--blue); }
.hub-err{ color:#FF3B30; font-size:13px; margin-top:7px; margin-left:2px; }

.hub-row{ display:flex; align-items:center; justify-content:space-between; margin:8px 0 22px; font-size:13px; }
.hub-remember{ display:flex; align-items:center; gap:8px; color:#3a3a3c; cursor:pointer; user-select:none; }
.hub-remember input{ display:none; }
.hub-chk{ width:18px; height:18px; border-radius:6px; border:1.5px solid #D2D2D7; background:#fff; position:relative; transition:.2s; }
.hub-remember input:checked + .hub-chk{ background:var(--blue); border-color:var(--blue); }
.hub-remember input:checked + .hub-chk::after{
  content:""; position:absolute; left:6px; top:2px; width:5px; height:9px;
  border:solid #fff; border-width:0 2px 2px 0; transform:rotate(45deg);
}

.hub-btn{
  width:100%; height:52px; border:none; border-radius:13px;
  background:var(--blue); color:#fff; font-size:16px; font-weight:600; cursor:pointer;
  transition:.2s; display:flex; align-items:center; justify-content:center; gap:8px;
  box-shadow:0 8px 22px rgba(0,122,255,.32);
}
.hub-btn:hover:not(:disabled){ background:#0066d6; transform:translateY(-1px); }
.hub-btn:disabled{ background:#C7C7CC; cursor:not-allowed; box-shadow:none; }
.hub-spinner{ width:20px; height:20px; border:2px solid rgba(255,255,255,.35); border-radius:50%; border-top-color:#fff; animation:hubspin 1s linear infinite; }
@keyframes hubspin{ to{ transform:rotate(360deg); } }

.hub-alert{
  margin-top:18px; background:rgba(255,59,48,.1); border:1px solid rgba(255,59,48,.22);
  border-radius:12px; padding:13px 16px; display:flex; align-items:center; justify-content:space-between;
  color:#FF3B30; font-size:14px; font-weight:500;
}
.hub-alert-close{ background:none; border:none; color:#FF3B30; font-size:20px; line-height:1; cursor:pointer; padding:0 4px; }

.hub-foot{ margin-top:26px; padding-top:22px; border-top:1px solid rgba(0,0,0,.07); text-align:center; font-size:11.5px; color:var(--gray); }
.hub-row-between{ display:flex; justify-content:space-between; align-items:center; gap:12px; }
.hub-forgot{ color:#1f6feb; font-size:13px; text-decoration:none; cursor:pointer; }
.hub-forgot:hover{ text-decoration:underline; }
.hub-modal-backdrop{ position:fixed; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; }
.hub-modal{ background:var(--card-bg, #fff); border-radius:14px; padding:24px; max-width:420px; width:100%; box-shadow:0 12px 40px rgba(0,0,0,.3); }
.hub-modal-title{ font-size:18px; font-weight:600; margin-bottom:8px; }
.hub-modal-sub{ color:var(--gray); font-size:13.5px; margin-bottom:16px; line-height:1.45; }
.hub-modal-input{ width:100%; padding:11px 13px; border:1px solid rgba(0,0,0,.12); border-radius:8px; font-size:14px; outline:none; background:var(--input-bg, #f5f5f7); color:inherit; }
.hub-modal-input:focus{ border-color:#1f6feb; }
.hub-modal-ok{ color:#22c55e; font-size:13px; margin:10px 0 0; }
.hub-modal-err{ color:#FF3B30; font-size:13px; margin:10px 0 0; }
.hub-modal-actions{ display:flex; gap:10px; justify-content:flex-end; margin-top:18px; }
.hub-btn-sec{ background:transparent; border:1px solid rgba(0,0,0,.12); color:inherit; padding:9px 16px; border-radius:8px; cursor:pointer; font-size:14px; }
.hub-btn-sec:hover{ background:rgba(0,0,0,.04); }

/* RIGHT */
.hub-right{ flex:1; position:relative; display:flex; flex-direction:column; justify-content:center; padding:64px 56px; z-index:1; }
.hub-map{ position:absolute; inset:0; width:100%; height:100%; opacity:.55; pointer-events:none; color:rgba(0,122,255,.08); }
.hub-hero{ position:relative; z-index:3; max-width:540px; }
.hub-hero-badge{
  display:inline-flex; align-items:center; gap:7px; font-size:12.5px; font-weight:600;
  color:var(--indigo); background:rgba(88,86,214,.1); border:1px solid rgba(88,86,214,.2);
  padding:6px 14px; border-radius:20px; margin-bottom:22px;
}
.hub-hero h1{ font-size:48px; line-height:1.07; font-weight:700; letter-spacing:-1.5px; margin-bottom:18px; color:#1d1d1f; }
.hub-grad{ background:linear-gradient(120deg,var(--blue),var(--indigo)); -webkit-background-clip:text; background-clip:text; color:transparent; }
.hub-hero p{ font-size:17px; line-height:1.55; color:#4a4a4f; }

/* ORBIT */
.hub-orbit{ position:relative; z-index:3; margin-top:50px; width:440px; height:320px; }
.hub-orbit-svg{ position:absolute; inset:0; width:100%; height:100%; z-index:1; pointer-events:none; }
.hub-core{
  position:absolute; left:160px; top:110px; width:116px; height:116px; border-radius:30px; z-index:4;
  background:linear-gradient(150deg, rgba(0,122,255,.95), rgba(88,86,214,.95));
  border:1px solid rgba(255,255,255,.5);
  box-shadow:0 0 0 10px rgba(88,86,214,.12), 0 0 60px rgba(88,86,214,.45), 0 18px 50px rgba(20,30,80,.30);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px;
}
.hub-core b{ font-size:24px; font-weight:800; letter-spacing:-.6px; color:#fff; }
.hub-core small{ font-size:10px; color:rgba(255,255,255,.85); text-transform:uppercase; letter-spacing:2px; font-weight:600; }
.hub-node{
  position:absolute; width:64px; height:64px; border-radius:18px; z-index:3;
  background:rgba(255,255,255,.92); backdrop-filter:blur(14px);
  border:1px solid rgba(255,255,255,.85); box-shadow:0 8px 24px rgba(20,30,80,.12);
  display:flex; align-items:center; justify-content:center; transition:.3s;
}
.hub-node img{ max-width:38px; max-height:30px; filter:grayscale(1) opacity(.7); transition:.3s; }
.hub-node:hover{ transform:translateY(-3px); box-shadow:0 12px 30px rgba(20,30,80,.18); }
.hub-node:hover img{ filter:grayscale(0) opacity(1); }
.hub-node-lbl{ position:absolute; bottom:-20px; font-size:10px; font-weight:600; color:var(--gray); white-space:nowrap; }
.hub-node.n1{ left:0; top:8px; } .hub-node.n2{ right:8px; top:0; }
.hub-node.n3{ left:18px; bottom:8px; } .hub-node.n4{ right:24px; bottom:24px; }
.hub-ghost{
  position:absolute; left:200px; top:-6px; width:54px; height:54px; border-radius:16px; z-index:3;
  border:1.5px dashed rgba(0,122,255,.4); background:rgba(0,122,255,.04);
  display:flex; align-items:center; justify-content:center; color:var(--blue); font-size:24px; font-weight:300;
}
.hub-ghost .hub-node-lbl{ color:var(--blue); }

.hub-note{ position:relative; z-index:3; margin-top:42px; font-size:13px; color:var(--gray); max-width:480px; }
.hub-note b{ color:#3a3a3c; font-weight:600; }

/* MOBILE */
@media (max-width:900px){
  .hub-right{ display:none; }
  .hub-left{ flex:1; }
}
@media (max-width:480px){
  .hub-left{ padding:20px; }
  .hub-card{ padding:28px 24px; border-radius:18px; }
  .hub-title{ font-size:22px; }
}

/* DARK */
@media (prefers-color-scheme: dark){
  .hub-login{
    background:#0E1116;
    --hub-route-a:rgba(0,122,255,.5); --hub-route-b:rgba(120,118,235,.45);
    --hub-ring-a:rgba(120,160,255,.2); --hub-ring-b:rgba(120,118,235,.16);
    --hub-beam-0:rgba(120,118,235,.7); --hub-beam-1:rgba(0,122,255,.15);
  }
  .hub-login::before{
    background:
      radial-gradient(60% 50% at 80% 16%, rgba(0,122,255,.20), transparent 60%),
      radial-gradient(50% 50% at 92% 72%, rgba(88,86,214,.20), transparent 60%);
  }
  .hub-map{ color:rgba(120,160,255,.08); }
  .hub-card{ background:rgba(28,30,38,.7); border-color:rgba(255,255,255,.1); box-shadow:0 24px 70px rgba(0,0,0,.5); }
  .hub-brand-name, .hub-title{ color:#F2F2F7; }
  .hub-field label{ color:#c7c7cc; }
  .hub-input{ background:rgba(44,46,54,.8); border-color:#3a3c44; color:#F2F2F7; }
  .hub-input:focus{ background:rgba(44,46,54,1); }
  .hub-remember{ color:#c7c7cc; }
  .hub-chk{ background:rgba(44,46,54,.8); border-color:#48484a; }
  .hub-foot{ border-color:rgba(255,255,255,.1); color:#8e8e93; }
  .hub-hero h1{ color:#F2F2F7; }
  .hub-hero p{ color:#aeaeb2; }
  .hub-node{ background:rgba(255,255,255,.94); border-color:rgba(255,255,255,.2); }
  .hub-note{ color:#8e8e93; } .hub-note b{ color:#e5e5ea; }
}
</style>
