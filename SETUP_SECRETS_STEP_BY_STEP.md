# 🔧 Пошаговая настройка GitHub Secrets

## ❌ Текущая проблема
```
Error: missing server host
```

**Причина**: GitHub Secrets не настроены в репозитории.

## 🎯 Решение за 5 минут

### Шаг 1: Откройте настройки репозитория
1. Перейдите по ссылке: https://github.com/novaconnectkz/frontend_axenta
2. Нажмите на вкладку **"Settings"** (в правом верхнем углу)

### Шаг 2: Найдите раздел Secrets
1. В левом меню найдите **"Secrets and variables"**
2. Нажмите на **"Actions"**

### Шаг 3: Добавьте секреты
Нажмите **"New repository secret"** и добавьте каждый из следующих секретов:

#### 🖥️ HOST
- **Name**: `HOST`
- **Secret**: IP адрес или домен вашего сервера
- **Пример**: `192.168.1.100` или `myserver.com`

#### 👤 USERNAME  
- **Name**: `USERNAME`
- **Secret**: имя пользователя для SSH
- **Пример**: `root`, `ubuntu`, `deploy`

#### 🔑 PRIVATE_KEY
- **Name**: `PRIVATE_KEY`
- **Secret**: содержимое приватного SSH ключа
- **Формат**:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAFwAAAAdzc2gtcn
[много строк с ключом]
-----END OPENSSH PRIVATE KEY-----
```

#### 🔌 PORT (опционально)
- **Name**: `PORT`
- **Secret**: `22` (или другой порт SSH)

### Шаг 4: Проверьте настройки
После добавления всех секретов у вас должно быть:
- ✅ HOST
- ✅ USERNAME  
- ✅ PRIVATE_KEY
- ✅ PORT (опционально)

### Шаг 5: Включите автоматическое развертывание
После настройки секретов нужно включить автоматическое развертывание:

1. Откройте файл `.github/workflows/main.yml`
2. Раскомментируйте строки:
```yaml
on:
  push:
    branches: ["main"]
  workflow_dispatch:
```

### Шаг 6: Протестируйте
1. Перейдите в **Actions** в репозитории
2. Запустите workflow **"Test SSH Connection"** вручную
3. Проверьте, что подключение работает

## 🚨 Если у вас нет SSH ключей

### Создание SSH ключей:
```bash
# На вашем компьютере
ssh-keygen -t ed25519 -C "deploy@frontend-axenta"

# Скопируйте публичный ключ
cat ~/.ssh/id_ed25519.pub
```

### Добавление на сервер:
```bash
# На сервере
mkdir -p ~/.ssh
echo "ваш_публичный_ключ" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Получение приватного ключа:
```bash
# На вашем компьютере
cat ~/.ssh/id_ed25519
```
Скопируйте весь вывод (включая заголовки) в секрет PRIVATE_KEY.

## 🔍 Проверка подключения локально
```bash
ssh -i ~/.ssh/id_ed25519 username@your-server-host
```

## ❓ Частые проблемы

### "Permission denied"
- Проверьте права на SSH ключи
- Убедитесь, что публичный ключ добавлен на сервер

### "Host key verification failed"
- Добавьте сервер в known_hosts:
```bash
ssh-keyscan -H your-server-host >> ~/.ssh/known_hosts
```

### "Connection refused"
- Проверьте, что SSH сервис запущен на сервере
- Проверьте правильность порта (обычно 22)

## 📞 Нужна помощь?

1. **Проверьте секреты**: запустите workflow "Debug Secrets Configuration"
2. **Протестируйте подключение**: запустите workflow "Test SSH Connection"
3. **Посмотрите логи**: в разделе Actions → выберите неудачный запуск

## ✅ Чек-лист готовности

- [ ] HOST секрет добавлен
- [ ] USERNAME секрет добавлен  
- [ ] PRIVATE_KEY секрет добавлен
- [ ] PORT секрет добавлен (если нужен)
- [ ] SSH подключение работает локально
- [ ] Workflow "Test SSH Connection" прошел успешно
- [ ] Автоматическое развертывание включено

После выполнения всех пунктов развертывание будет работать! 🎉
