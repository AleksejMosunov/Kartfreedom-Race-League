# Инструкция по установке и запуску

Ниже — минимальная инструкция для локальной разработки и запуска сервиса.

## Требования

- Node.js 18+ (рекомендуется LTS)
- npm или pnpm
- Запущенная MongoDB (URI в `MONGODB_URI`)

## Переменные окружения

Минимально требуемые переменные:

- `MONGODB_URI` — строка подключения к MongoDB (обязательная)
- `ADMIN_SESSION_SECRET` — секрет для подписи admin-сессий (обязательная)

Опциональные / вспомогательные:

- `ADMIN_USERNAME` и `ADMIN_PASSWORD` — если задать, при первом логине автоматически создаётся bootstrap-организатор.
- `TELEGRAM_BOT_TOKEN` — токен бота Telegram (для нотификаций).
- `TELEGRAM_CHAT_ID` — chat id для отправки сообщений через Telegram.
- `NEXT_PUBLIC_APP_URL` — публичный URL приложения (используется в ссылках в Telegram).
- `NEXT_PUBLIC_SENTRY_DSN` — DSN для Sentry (опционально).
- `NEXT_PUBLIC_SPONSOR_CONTACT_URL` — URL контакта спонсора (опционально).

Пример `.env.local` (локально):

MONGODB_URI=mongodb://localhost:27017/kfrl
ADMIN_SESSION_SECRET=replace_with_random_secret

# Optional bootstrap admin credentials

ADMIN_USERNAME=admin@example.com
ADMIN_PASSWORD=StrongPassword123!
TELEGRAM_BOT_TOKEN=123456:ABC-DEF
TELEGRAM_CHAT_ID=-1001234567890
NEXT_PUBLIC_APP_URL=http://localhost:3000

## Установка и запуск

1. Установите зависимости:

```bash
npm install
```

2. Запустите в режиме разработки:

```bash
npm run dev
```

3. Построить для продакшена и запустить:

```bash
npm run build
npm start
```

## Создание админ-пользователя

1. Либо создайте пользователя через интерфейс админ-панели (organizer может создать других админов).
2. Либо временно установить `ADMIN_USERNAME` и `ADMIN_PASSWORD` в `.env.local`. Первый корректный логин создаст bootstrap-организатора.

## Админ-панель

- Доступ: `app/admin/*` — требуется авторизация через `/api/auth/login`.
- Роли: `organizer` (полные права), `marshal`, `editor`.

## Секция разработчика

- Подключение к MongoDB синхронизирует индексы при первом подключении (`lib/mongodb.ts`).
- Логи аудита пишутся в `AuditLog` и доступны через `/api/audit`.

## Быстрое развёртывание локально (Docker)

Проект содержит `Dockerfile` и `docker-compose.yml`. Для локального запуска через Docker Compose:

```bash
docker compose up --build
```

Docker использует переменные окружения из `.env` или `docker-compose.yml`. Убедитесь, что `MONGODB_URI` указывает на контейнер MongoDB или внешний кластер.

## Полный список важных env-переменных

- `MONGODB_URI` — строка подключения к MongoDB (обязательная)
- `ADMIN_SESSION_SECRET` — секрет подписи admin-сессий (обязательная)
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — опциональны для bootstrap admin
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — для нотификаций
- `NEXT_PUBLIC_APP_URL` — публичный URL приложения (используется в ссылках в Telegram)

## Скрипты (package.json)

- `npm run dev` — старт в режиме разработки (Next.js)
- `npm run build` — сборка для продакшена
- `npm start` — запуск production-сервера
- `npm run lint` — линтинг

## Советы по деплою

- Для production собирайте проект с `npm run build` и запускайте через `npm start` внутри оптимизированного контейнера.
- Настройте `ADMIN_SESSION_SECRET` и защитите секреты (не храните в Git).
- На стороне MongoDB используйте резервное копирование и мониторинг.

---

Если хотите, я могу добавить `docker-compose.override.yml` с примерами env и volume-монтированием MongoDB, или создать `docs/deployment.md` с подробной инструкцией для VPS / cloud-провайдера.
