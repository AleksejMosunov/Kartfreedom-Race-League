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
