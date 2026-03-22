# API Reference — полное руководство

Этот документ описывает HTTP-эндпоинты сервиса KartFreedom Race League, их назначение, ожидаемые параметры и примеры. Все эндпоинты доступны под префиксом `/api` (реализованы в `app/api/*/route.ts`).

Структура раздела: обзор по подсистемам, ключевые параметры и советы по авторизации.

## Общие

- `GET /api/health` — статус сервиса. Публичный. Возвращает `{ status: 'ok' }`.

## Чемпионаты (`/api/championships`, `/api/championship`)

- `GET /api/championships` — список чемпионатов и базовые метаданные (статус, даты, type). Публичный.
- `POST /api/championships` — создать чемпионат. Требуется admin cookie (см. `POST /api/auth/login`). Тело JSON: `{ name, championshipType, startedAt?, regulations?, fastestLapBonusEnabled? }`.
- `GET /api/championships/[id]` — подробный объект чемпионата: stages, participants, points rules.
- `PUT /api/championships/[id]` — обновление (admin).
- `DELETE /api/championships/[id]` — удаление (только для неактивных).
- `POST /api/championships/[id]/finish` — пометить чемпионат завершённым (admin).
- `POST /api/championships/[id]/restore` — восстановить архивный чемпионат (admin).
- `GET /api/championships/[id]/regulations` — получить регламент.
- `PUT /api/championships/[id]/regulations` — обновить регламент (organizer).

- `GET /api/championship` — агрегированная таблица/статистика. Параметр опционален: `?championship=<id>`. Публичный. Возвращает массив записей вида `{ pilot: {...}, totalPoints, positions: {1: count, 2: count}, bestLapCount, penalties }`.

## Регистрация участников и пилоты

- `POST /api/pilot-registration` — публичная регистрация/заявка. Тело: `{ name, surname, number, phone, league, teamId? }`.
- `GET /api/pilots` — список пилотов (фильтруется по championship или query). Для не-admin возвращается ограниченный набор полей (без телефона).
- `POST /api/pilots` — создать пилота (admin).
- `GET /api/pilots/[id]` — профиль пилота (phone скрыт если не-admin).
- `PUT /api/pilots/[id]` — обновление (admin).
- `DELETE /api/pilots/[id]` — удаление (admin).

## Команды

- `GET /api/teams` — список команд.
- `POST /api/teams` — создать команду.
- `PUT /api/teams/[id]` — редактировать команду.
- `DELETE /api/teams/[id]` — удалить команду.

## Этапы и результаты

- `GET /api/stages` — список этапов текущего/всех чемпионатов.
- `POST /api/stages` — создать этап (admin). Тело: `{ championshipId, name, date, type, races? }`.
- `GET /api/stages/[id]` — детали этапа, включая `races` и `results` (в текущей модели результаты хранятся в каждой гонке `race.results`).
- `PUT /api/stages/[id]` — обновить этап или править результаты вручную (admin).
- `DELETE /api/stages/[id]` — удалить этап (admin).
- `POST /api/stages/[id]/results` — опубликовать результаты этапа (admin). Тело: `{ results: [ { pilotId, position, bestLap?, time?, penalties?: number } ], publishedBy }` — сервер применяет подсчёт очков, fastest lap, штрафы.
- `GET /api/stages/[id]/sprint-groups` — сгенерированные группы/результаты для спринта.

## Админ-механики и вспомогательные

- `POST /api/admin/sprint-groups` — сгенерировать sprint-группы по списку пилотов (admin).
- `GET /api/admin/stages/[id]/participants` — получить список участников для админ-операций.

## Telegram интеграция

- `POST /api/telegram/championship/start` — отправить сообщение о старте чемпионата (admin). Тело: `{ championshipId }`.
- `POST /api/telegram/championship/finish` — отправка сообщений по завершении.
- `POST /api/telegram/stages/new` — нотификация о добавлении этапа.
- `POST /api/telegram/stages/[id]/results` — отправка результатов этапа.

## Аутентификация и аудит

- `POST /api/auth/login` — логин admin. Тело: `{ username, password }`. В ответе устанавливается cookie `kartfreedom_admin_session`.
- `POST /api/auth/logout` — выход и удаление сессии-cookie.
- `GET /api/auth/session` — проверка статуса сессии.
- `GET /api/admin-users`, `POST /api/admin-users`, `PATCH /api/admin-users/[id]` — управление админ-пользователями (organizer only).
- `GET /api/audit` — получить журнал аудита с фильтрами `page`, `limit`, `action`, `entityType`, `adminUsername`, `from`, `to`.
- `DELETE /api/audit` — удалить записи аудита по scope (organizer only).

## Настройки, метрики и регламенты

- `GET /api/settings` / `PATCH /api/settings` — глобальные настройки лиги и соцссылки (organizer).
- `PUT /api/league-settings` — обновление превью/новостей лиги.
- `GET /api/metrics` — внутренние метрики приложения (organizer).
- `GET /api/regulations` / `PUT /api/regulations` — получать/обновлять регламент для активного чемпионата.

## Статистика

- `GET /api/stats` — агрегированная статистика по пилотам/этапам (публична).

---

См. также: практические примеры использования в [EXAMPLES.md](EXAMPLES.md) и конкретные реализации эндпоинтов в `app/api/*/route.ts`.
