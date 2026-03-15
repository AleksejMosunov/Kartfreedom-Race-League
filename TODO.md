# TODO

Короткий, практичный план для небольшого проекта (без избыточного энтерпрайза).

## Security

- [ ] Добавить refresh token flow для админки (ротация refresh-токена + хранение хеша в БД + endpoint обновления access/session).
- [ ] Вынести rate limit из in-memory в Redis/Upstash для корректной работы при нескольких инстансах.
- [ ] Защитить публичную регистрацию `/api/pilot-registration` от ботов (Cloudflare Turnstile или hCaptcha).
- [ ] Логировать причины 403 по безопасности (origin/csrf mismatch) в audit для мониторинга атак.
- [ ] Ввести короткий lockout после серии неудачных логинов (например, 5-10 минут на пользователя/IP).

## Reliability

- [ ] Добавить smoke-тесты на критичный auth-поток: login -> защищенный POST -> logout.
- [ ] Добавить e2e-проверку CSRF: запрос без заголовка должен возвращать 403.
- [x] Добавить health endpoint и простой uptime мониторинг (например, UptimeRobot).

## Ops

- [ ] Проверить и зафиксировать обязательные production env-переменные в README.
- [ ] Настроить ежемесячный dependency update (Renovate/Dependabot) для security-патчей.

## Nice to have (позже)

- [ ] Опциональный forced logout всех админ-сессий из админ-панели.
- [ ] Простая страница Security Notes с текущей моделью защиты API.
