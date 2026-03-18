# Архитектура проекта

Краткий обзор архитектуры и организации кода для KartFreedom Race League.

## Технологии

- Next.js (App Router) + TypeScript
- Node.js (серверные API-роуты в `app/api`)
- MongoDB + Mongoose (подключение в `lib/mongodb.ts`)
- Серверная аутентификация админов — cookie-сессии, CSRF token (`lib/auth.ts`)
- Telegram-интеграция для нотификаций (`lib/telegram.ts`)

## Структура репозитория (ключевые каталоги)

- `app/` — UI routes, страницы и компоненты приложения (App Router). Содержит `admin/` разделы.
- `app/api/` — HTTP-эндпоинты (route.ts) — основная публичная/админ API поверхность.
- `lib/` — вспомогательная логика: модели Mongoose (`lib/models`), подключение к БД, утилиты, Telegram, аутентификация.
- `components/`, `store/`, `types/` — UI-компоненты и клиентское состояние.

## Модель данных (основные сущности)

- `Championship` — чемпионат (name, type, status, startedAt, endedAt, regulations, prizes, fastestLapBonusEnabled).
- `Pilot` — соло-участник (name, surname, number, phone, avatar, league, championshipId).
- `Team` — командный участник (name, number, phone, isSolo, drivers[], championshipId).
- `Stage` — этап чемпионата (number, name, date, results[], isCompleted, swsLinks, championshipId).
- `SprintGroup` — группы для спринтов (stageId, groupNumber, pilotIds).
- `AdminUser` — админ-пользователь (username, passwordHash, role, isActive).
- `AuditLog` — журнал действий админов (action, entityType, entityId, before, after, adminUsername).
- `LeagueSettings` — настройки лиги, соцссылки, preseason news.

Файлы моделей находятся в `lib/models/` (например [lib/models/Championship.ts](lib/models/Championship.ts)).

## Зоны ответственности

- UI (в `app/`): регистрация, просмотр чемпионатов, админ-панель.
- API (в `app/api/*/route.ts`): операции CRUD для чемпионатов, пилотов, команд, этапов, результатов, а также вспомогательные эндпоинты (metrics, health, telegram hooks).
- Utilities (в `lib/`): подключение к БД, подсчёт таблиц лидеров (`lib/utils/championship.ts`), валидация телефон/имени и др.

## Безопасность и авторизация

- Админская аутентификация реализована через подписанные cookie-сессии (`ADMIN_SESSION_SECRET`).
- CSRF token выставляется в куки (`kartfreedom_csrf_token`) и ожидается в заголовке `x-csrf-token` для защищённых действий.
- Роли: `organizer` (полные права), `marshal`, `editor`. Контроль прав реализован в API (проверка сессии и роли).

## Интеграция с Telegram

- Переменные: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — используются в `lib/telegram.ts`.
- Используется для рассылки сообщений о старте/финише чемпионата, добавлении этапа и публикации результатов.

## Производительность и индексирование

- Подключение к MongoDB синхронизирует индексы при старте (`lib/mongodb.ts`).

## Где смотреть код расчёта турнирной таблицы

- Функции подсчёта очков и таблицы лидеров находятся в `lib/utils/championship.ts`.
