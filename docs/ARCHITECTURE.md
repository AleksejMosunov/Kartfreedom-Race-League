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

## Детальное описание компонентов и поток данных

- UI (Next.js App Router `app/`): отвечает за страницы и компоненты, SSR/SSG где нужно. Компоненты админки находятся внутри `app/admin`.
- API (Server): каждый `app/api/*/route.ts` экспортирует HTTP-обработчики для CRUD и вспомогательных задач. Авторизация проверяется внутри обработчика через `lib/auth.ts`.
- DB layer: `lib/models/*` — Mongoose-схемы. Соединение и поддержка индексов реализованы в `lib/mongodb.ts`.
- Business logic: `lib/utils/*` — расчёт таблицы, агрегации, общие helpers (например подсчёт очков, применение штрафов, fastest lap).

Поток данных (пример публикации результатов):

1. Админ отправляет `POST /api/stages/:id/results` с `results` (body) или загружает через UI.
2. Роутер API валидирует тело, сохраняет `stage`/`race` и каждый `race.results` (в текущей модели результаты хранятся в каждой гонке `race.results`).
3. Вызывается бизнес-логика расчёта таблицы (`lib/utils/championship.ts`), которая агрегирует результаты по пилотам и обновляет standings/points.
4. При необходимости отправляются нотификации в Telegram (`lib/telegram.ts`) и пишется запись в `AuditLog`.

## Схема данных (кратко)

- Championship: metadata, rules, prizes, links на stages.
- Stage: `races: [{ name, results: [{ pilotId, position, time, bestLap, penalties }] }]` — обратите внимание, что результаты хранятся в каждой гонке/раунде.
- Pilot / Team: базовые сущности, связанные с championshipId.

## Развертывание и производство

- Рекомендовано запускать приложение через Docker (см. Dockerfile, docker-compose.yml).
- Переменные окружения: `MONGODB_URI`, `ADMIN_SESSION_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `NEXT_PUBLIC_APP_URL`.

## Подсказки для разработчиков

- Тестирование логики подсчёта: создавайте фиктивные `stages` с наборами `races[].results` и запускайте локально функцию подсчёта из `lib/utils/championship.ts`.
- Логи аудита: при изменениях счёта или публикации результатов проверяйте таблицу `AuditLog`.
- Производительность: для больших чемпионатов используйте пагинацию в эндпоинтах и индексирование полей `championshipId`, `startedAt`, `status`.

## Диаграмма (упрощённая)

UI -> API routes -> lib/utils (business) -> MongoDB

---

Файлы для быстрого просмотра:

- `lib/utils/championship.ts` — расчёт таблицы
- `app/api/stages/[id]/results/route.ts` и `app/api/stages/[id]/route.ts` — публикация/правка результатов
- `lib/models/Championship.ts`, `lib/models/Stage.ts`, `lib/models/Pilot.ts` — модели
