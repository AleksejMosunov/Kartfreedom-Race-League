# Примеры запросов и сценарии

Ниже — примеры `curl` для типичных сценариев: вход администратора, создание чемпионата, регистрация пилота, публикация результатов.

> Замечание: админские эндпоинты используют cookie-сессию. В примерах используется файл cookie `cookies.txt`.

## Вход администратора

```bash
curl -c cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@example.com","password":"StrongPassword123!"}' \
  http://localhost:3000/api/auth/login
```

После успешного логина в `cookies.txt` появится `kartfreedom_admin_session`.

## Проверить сессию

```bash
curl -b cookies.txt http://localhost:3000/api/auth/session
```

## Создать чемпионат (admin)

```bash
curl -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Spring Cup","championshipType":"solo","fastestLapBonusEnabled":true}' \
  http://localhost:3000/api/championships
```

## Зарегистрировать пилота (публичная регистрация)

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Ivan","surname":"Petrov","number":7,"phone":"+380501234567","league":"pro"}' \
  http://localhost:3000/api/pilot-registration
```

## Получить таблицу чемпионата

```bash
curl "http://localhost:3000/api/championship?championship=<CHAMP_ID>"
```

## Опубликовать результаты этапа (admin)

Пример тела `results` — массив объектов:

```json
{
  "results": [
    { "pilotId": "<pilotId1>", "position": 1, "bestLap": true },
    { "pilotId": "<pilotId2>", "position": 2 }
  ]
}
```

Команда curl:

```bash
curl -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{"results":[{"pilotId":"PID1","position":1,"bestLap":true},{"pilotId":"PID2","position":2}]}' \
  http://localhost:3000/api/stages/<STAGE_ID>/results
```

## Отправить уведомление в Telegram (admin)

```bash
curl -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{"championshipId":"<CHAMP_ID>"}' \
  http://localhost:3000/api/telegram/championship/start
```

## Очистка cookie (logout)

```bash
curl -b cookies.txt -X POST http://localhost:3000/api/auth/logout
rm cookies.txt
```

---

Для более продвинутых сценариев (генерация sprint-групп, массовые удаление аудита, управление admin-users) смотрите [APIs.md](APIs.md) и соответствующие `route.ts` файлы в `app/api`.

## Быстрый обзор полезных примеров

1. Получить список чемпионатов

```bash
curl http://localhost:3000/api/championships
```

Ожидаемый ответ (сокращённо):

```json
[
  {
    "_id": "619...",
    "name": "Spring Cup",
    "status": "active",
    "championshipType": "solo",
    "startedAt": "2026-04-01T00:00:00.000Z"
  }
]
```

2. Получить агрегированную таблицу (standings) по id чемпионата

```bash
curl "http://localhost:3000/api/championship?championship=<CHAMP_ID>"
```

Пример элемента ответа:

```json
{
  "pilot": { "_id": "p1", "name": "Ivan", "surname": "Petrov", "number": 7 },
  "totalPoints": 125,
  "positions": { "1": 3, "2": 1, "3": 0 },
  "bestLapCount": 2,
  "penalties": 0
}
```

3. Получить детали этапа включая `races` и `results`

```bash
curl http://localhost:3000/api/stages/<STAGE_ID>
```

Пример ключевой структуры:

```json
{
  "_id": "s1",
  "name": "Stage 1",
  "races": [
    {
      "name": "Race A",
      "results": [
        {
          "pilotId": "p1",
          "position": 1,
          "time": "00:05:12.345",
          "bestLap": true
        },
        { "pilotId": "p2", "position": 2 }
      ]
    }
  ]
}
```

4. Опубликовать результаты этапа (формат — массив результатов по гонкам/раундам)

Если ваша модель использует `stage.races[].results`, можно отправлять структуру для конкретной гонки. Пример простого запроса:

```bash
curl -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{"results":[{"pilotId":"PID1","position":1,"bestLap":true},{"pilotId":"PID2","position":2}]}' \
  http://localhost:3000/api/stages/<STAGE_ID>/results
```

После публикации сервер:

- сохраняет `race.results` в `stage`/`race`,
- запускает перерасчёт таблицы лидеров,
- создает запись в `AuditLog`,
- (опционально) отправляет нотификацию в Telegram.

5. Генерация sprint-групп (admin)

```bash
curl -b cookies.txt -X POST -H "Content-Type: application/json" -d '{"stageId":"<STAGE_ID>","groupSize":6}' http://localhost:3000/api/admin/sprint-groups
```

6. Пример получения метрик/статистики

```bash
curl http://localhost:3000/api/stats
```

---

Если нужно, я могу сгенерировать готовые примерные JSON-файлы ответов и поместить их в `docs/examples/responses/`.

## Примеры ответов (файлы)

Ниже — готовые примерные JSON-ответы, сохранённые в `docs/examples/responses/`:

- Health: [docs/examples/responses/health.json](docs/examples/responses/health.json)
- Championships list: [docs/examples/responses/championships.json](docs/examples/responses/championships.json)
- Championship standings: [docs/examples/responses/championship-standings.json](docs/examples/responses/championship-standings.json)
- Stage details (races + results): [docs/examples/responses/stage-details.json](docs/examples/responses/stage-details.json)
- Publish results response: [docs/examples/responses/publish-results-response.json](docs/examples/responses/publish-results-response.json)

Эти файлы находятся в репозитории и предназначены для примеров в документации или для тестов/моков при разработке.
