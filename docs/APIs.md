# API Reference (краткий реестр)

Ниже — обзор доступных HTTP-эндпоинтов. Для каждого указан путь, HTTP-методы, краткое описание и требования по авторизации.

Примечание: все эндпоинты находятся под префиксом `/api` (Next.js App Router `app/api/*/route.ts`).

## Общие

- `GET /api/health` — статус сервиса. Публичный.

## Чемпионаты

- `GET /api/championships` — список активных/архивных чемпионатов и настройки лиги.
- `POST /api/championships` — создать новый чемпионат. (администратор через cookie)
- `GET /api/championships/[id]` — получить чемпионат, участников, этапы, таблицу.
- `PUT /api/championships/[id]` — обновить (призы, fastestLap и т.д.). (admin)
- `DELETE /api/championships/[id]` — удалить (только неактивный). (admin)
- `POST /api/championships/[id]/finish` — завершить чемпионат (перевести в archived). (admin)
- `POST /api/championships/[id]/restore` — восстановить архивный чемпионат. (admin)
- `GET /api/championships/[id]/regulations` — получить регламент чемпионата.
- `PUT /api/championships/[id]/regulations` — обновить регламент. (organizer)

## Текущий чемпионат / регламенты

- `GET /api/championships/current/regulations` — регламент для активного чемпионата.
- `PUT /api/championships/current/regulations` — обновить регламент текущего чемпионата. (organizer)
- `GET /api/championship` — получить текущую таблицу/статистику (параметр `?championship=<id>`) — публичный.

## Регистрация участников

- `POST /api/pilot-registration` — универсальная регистрация участника/команды (публичная форма).
- `GET /api/pilots` — список пилотов/команд для текущего чемпионата. (ограничения по полям если не admin)
- `POST /api/pilots` — добавить пилота (admin / регистрация через UI).
- `GET /api/pilots/[id]` — получить профиль пилота (телефон скрывается для не-admin).
- `PUT /api/pilots/[id]` — обновить пилота. (admin)
- `DELETE /api/pilots/[id]` — удалить пилота. (admin)

## Команды

- `GET /api/teams` — список команд (для `teams` чемпионата).
- `POST /api/teams` — создать команду.
- `PUT /api/teams/[id]` — редактировать команду.
- `DELETE /api/teams/[id]` — удалить команду.

## Этапы и результаты

- `GET /api/stages` — список этапов текущего чемпионата.
- `POST /api/stages` — создать этап. (admin)
- `GET /api/stages/[id]` — детали этапа.
- `PUT /api/stages/[id]` — обновить этап (включая редактирование результатов вручную). (admin)
- `DELETE /api/stages/[id]` — удалить этап. (admin)
- `POST /api/stages/[id]/results` — опубликовать результаты этапа (массовая загрузка результатов). Считает очки, применяет штрафы и fastest lap. (admin)
- `GET /api/stages/[id]/sprint-groups` — список групп для этапа.

## Работа с группами (sprint)

- `POST /api/admin/sprint-groups` — создать случайные группы по списку пилотов; пометка DNS. (admin)
- `DELETE /api/admin/sprint-groups` — удалить группы для этапа, опционально сбросить DNS.

## Telegram интеграция

- `POST /api/telegram/championship/start` — отправить сообщение о старте чемпионата (используется админом).
- `POST /api/telegram/championship/finish` — отправить сообщение о завершении чемпионата.
- `POST /api/telegram/stages/new` — уведомление о добавлении этапа.
- `POST /api/telegram/stages/[id]/results` — отправка результатов этапа в Telegram.

## Администрирование и аудит

- `POST /api/auth/login` — вход администратора (обмен на cookie-сессию). Возвращает роль.
- `POST /api/auth/logout` — выход (очистка cookie).
- `GET /api/auth/session` — проверить, авторизован ли админ.
- `GET /api/admin-users` — список админов (organizer только).
- `POST /api/admin-users` — создать admin user (organizer только).
- `PATCH /api/admin-users/[id]` — изменить роль/активность/пароль (organizer only).
- `GET /api/audit` — получить журнал событий (organizer only) с фильтрами `page`, `limit`, `action`, `entityType`, `adminUsername`, `from`, `to`.
- `DELETE /api/audit` — удалить записи аудита по scope (organizer only).

## Настройки / метрики

- `GET /api/settings` — получить alertChatId и socialLinks (organizer).
- `PATCH /api/settings` — обновить alertChatId / socialLinks (organizer).
- `PUT /api/league-settings` — (часть `championships` endpoints) — обновление превью/новостей.
- `GET /api/metrics` — внутренняя страница метрик (organizer).

## Регламенты

- `GET /api/regulations` — получить регламент доступный (активный чемпионат).
- `PUT /api/regulations` — обновить регламент (organizer).

## Статистика

- `GET /api/stats` — агрегированная статистика по пилотам/этапам (публично доступна).

---

Подробнее об использовании каждого эндпоинта и примеры запросов смотрите в [EXAMPLES.md](EXAMPLES.md).
