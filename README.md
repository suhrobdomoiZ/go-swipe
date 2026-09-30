# GoSwipe

Мини-апп для мессенджера MAX: персональная лента мероприятий в формате свайпов.
Лайк или скип карточки меняет веса интересов пользователя, а лента сортируется
по этим весам. Понравившиеся события попадают в избранное, где их можно
подтвердить («точно иду») и получить напоминание от бота за 3 часа до начала.
Пользователи могут создавать и редактировать собственные мероприятия.

Контракт API — [`openapi.yaml`](openapi.yaml).

## Состав и архитектура решения

Всё поднимается одной командой из `docker-compose.yaml` в корне репозитория.
Три сервиса:

| Сервис   | Что внутри | Откуда берётся |
|----------|------------|----------------|
| `caddy`  | Caddy 2 + собранный фронтенд (React 19, Vite) | Образ собирается из `client/Dockerfile`: стадия `node:20-alpine` выполняет `npm ci && npm run build`, стадия `caddy:2-alpine` забирает `dist` в `/srv/goswipe`. Отдельного volume для статики нет — фронт запечён в образ. |
| `server` | Бэкенд на Go 1.26 (Echo v5, pgx) | Образ собирается из `server/Dockerfile`. В образ кладутся бинарник и `golang-migrate`; при старте контейнер сначала применяет миграции из `server/migrations/`, затем запускает сервер. |
| `db`     | PostgreSQL 18 (`postgres:18-alpine`) | Готовый образ. Схема использует `uuidv7()`, поэтому нужна именно версия 18+. |

Как идёт трафик. Caddy слушает `DOMAIN` по HTTPS (сертификат выпускает сам) и по
[`client/Caddyfile`](client/Caddyfile):

- `/api/*` и `/uploads/*` проксирует на `server:$PORT`;
- `/assets/*` отдаёт из `/srv/goswipe` с долгим кэшем;
- всё остальное — `index.html` (SPA) без кэширования.

Фронт и API живут на одном origin, поэтому CORS в проде не участвует.

Бэкенд (`server/`, модуль `github.com/suhrobdomoiZ/go-swipe/server`):

```
cmd/api              точка входа сервера
cmd/gen-initdata     утилита для локальной отладки (см. ниже), в образ не входит
config/              чтение переменных окружения
internal/handlers    HTTP-слой (Echo)
internal/services    бизнес-логика: скоринг ленты, свайпы, профиль, напоминания
internal/repository  SQL (pgx)
internal/maxclient   клиент MAX Bot API
migrations/          golang-migrate: схема (0001, 0002) и демо-события (0003)
```

Вход — по `initData` от MAX Bridge: бэкенд проверяет подпись по токену бота
(`POST /api/auth/max`) и выдаёт JWT. Напоминания отправляет фоновая горутина
внутри сервера, раз в минуту: она находит подтверждённые события с наступившим
`remind_at` и пишет пользователю от имени бота.

Данные хранятся в docker-volume: `db-data` (Postgres), `uploads-data` (загруженные
обложки), `caddy-data` и `caddy-config` (сертификаты и конфиг Caddy).

## Используемые порты

| Порт | Кто слушает | Доступ |
|------|-------------|--------|
| 80, 443 | `caddy` | Публикуются на хост. Единственная точка входа для пользователей. |
| `PORT` (по умолчанию 8080) | `server` | Только внутри docker-сети (`expose`), на хост не публикуется. |
| `POSTGRES_PORT` (по умолчанию 5432) | `db` | Публикуется на хост в том же номере (`ports` в compose). Закройте его файрволом на боевом сервере. |
| 5173 | Vite dev-server | Только при `npm run dev` в `client/`, к docker-compose отношения не имеет. |

## Необходимые параметры окружения

Все переменные лежат в `.env` в корне репозитория; шаблон — [`.env.example`](.env.example)
(скопируйте в `.env` и заполните). Для `docker compose` нужны все:

| Переменная | Назначение | Пример |
|------------|------------|--------|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE` | Учётные данные и имя БД, создаются при первом старте `db` | — |
| `POSTGRES_HOST` | Хост БД для сервера: имя сервиса в compose | `db` |
| `POSTGRES_PORT` | Порт Postgres | `5432` |
| `POSTGRES_SSL_MODE` | `sslmode` для подключения бэкенда | `disable` |
| `SECRET_KEY` | Ключ подписи JWT. Если пусто — сервер берёт публичный дефолт `secret-key`, поэтому задавайте свой | длинная случайная строка |
| `MAX_BOT_TOKEN` | Токен бота MAX: проверка `initData` и отправка напоминаний | — |
| `PORT` | Внутренний порт бэкенда; его же использует Caddy для проксирования | `8080` |
| `LOG_LEVEL` | Уровень логов (`slog`): `debug`, `info`, `warn`, `error` | `info` |
| `JWT_TTL` | Срок жизни JWT, формат `time.ParseDuration` | `24h` |
| `CORS_ORIGINS` | Разрешённые Origin через запятую | `http://localhost:5173` |
| `DOMAIN` | Домен, на который Caddy выпускает сертификат; читает только `caddy` | `203-0-113-10.sslip.io` |

Переменные фронтенда (`VITE_API_URL`, `VITE_DEV_INIT_DATA`) в корневой `.env` не
нужны: для продакшен-сборки `VITE_API_URL=/api` уже задан в `client/.env.production`,
для разработки см. `client/.env.example`.

## Запуск

```bash
cp .env.example .env        # заполнить значения
docker compose up -d --build
docker compose logs -f server   # убедиться, что миграции применились и сервер стартовал
```

Образы `server` и `caddy` собираются локально, поэтому `docker compose pull`
нужен разве что для `postgres`. Повторный запуск после изменений кода — та же
команда с `--build`; миграции накатываются автоматически, только новые.
`docker compose down -v` удаляет тома вместе с данными.

Для запуска на своей машине задайте `DOMAIN=localhost`: Caddy выпустит локальный
сертификат, запросы делайте с `curl -k https://localhost/...`. Настоящий вход
через MAX требует боевого домена с валидным сертификатом.

## Примеры ожидаемого поведения

Дальше `BASE` — адрес приложения, например `BASE=https://localhost` (с `-k`) или
`BASE=https://<DOMAIN>`. Все ручки, кроме `/api/auth/max`, требуют заголовок
`Authorization: Bearer <token>`. Ошибки всегда приходят как
`{"code": "...", "message": "..."}`.

Без токена:

```bash
curl -sk $BASE/api/events
# 401 {"code":"UNAUTHORIZED","message":"jwt middleware error"}
```

Лента для пользователя из Москвы после онбординга (в миграции `0003` есть 23
демо-события в Москве и 5 в Санкт-Петербурге):

```bash
curl -sk "$BASE/api/events?limit=2" -H "Authorization: Bearer $TOKEN"
# 200 {"items":[{"id":"…","title":"…","category":"music","tags":[…],"city":"Москва",
#   "starts_at":"…","ends_at":"…","price":1500,"age_limit":12,"status":"active",
#   "source":"other","is_synthetic":false,"created_by":null, …}, …],"total":23}
```

Повторный свайп того же события:

```bash
curl -sk -X POST $BASE/api/events/$EVENT_ID/swipe -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"action":"like"}'
# первый раз: 200 {"id":"…","event_id":"…","action":"like","confirmed":false,"created_at":"…"}
# второй раз: 409 {"code":"CONFLICT","message":"swipe.Create: event already swiped"}
```

Чужое мероприятие редактировать нельзя:

```bash
curl -sk -X PATCH $BASE/api/events/$SOMEONES_EVENT_ID -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d "$BODY"
# 403 {"code":"FORBIDDEN","message":"events.Update: only the author can edit an event"}
```

Тело `PATCH /api/profile` — все поля необязательны:

```json
{
  "city": "Москва",
  "birth_date": "2000-01-01",
  "interests": [{"tag": "music", "weight": 5}],
  "remove_interests": ["theatre"]
}
```

`interests` — upsert по тегу: перечисленные теги получают указанный вес, остальные
не трогаются (пустой массив ничего не меняет). Убрать интерес можно только через
`remove_interests`.

## Пошаговый сценарий проверки

Понадобятся `curl`, `jq` и Go (для утилиты `gen-initdata`). Стек уже запущен
(см. «Запуск»); `MAX_BOT_TOKEN` берём из `.env`.

**1. Вход.** Утилита `server/cmd/gen-initdata` подписывает `initData` токеном
бота так же, как это делает MAX; в образ и HTTP-ручки она не входит.

```bash
set -a; source .env; set +a
INIT=$(cd server && go run ./cmd/gen-initdata -token "$MAX_BOT_TOKEN" -user 100500 -first-name Тест)
curl -sk $BASE/api/auth/max -H 'Content-Type: application/json' \
  -d "{\"init_data\":\"$INIT\"}" | tee /tmp/login.json
TOKEN=$(jq -r .token /tmp/login.json)
# 200 {"token":"…","need_onboarding":true,"user":{"id":"…","name":"Тест","city":null,…}}
```

**2. Онбординг** (без него `GET /api/events` вернёт 400):

```bash
curl -sk -X POST $BASE/api/auth/onboarding -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"city":"Москва","birth_date":"2003-05-14","categories":["music","theatre"],"onboarding_text":"люблю живую музыку"}'
# 200 {"id":"…","city":"Москва","birth_date":"2003-05-14",…}
```

**3. Лента.** События из миграции `0003` должны быть видны:

```bash
curl -sk "$BASE/api/events?limit=5" -H "Authorization: Bearer $TOKEN" | tee /tmp/feed.json | jq '.total, .items[].title'
EVENT_ID=$(jq -r '.items[0].id' /tmp/feed.json)
```

**4. Свайп и избранное:**

```bash
curl -sk -X POST $BASE/api/events/$EVENT_ID/swipe -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"action":"like"}'
curl -sk "$BASE/api/favorites?confirmed=false" -H "Authorization: Bearer $TOKEN"
curl -sk -X PATCH $BASE/api/favorites/$EVENT_ID -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"confirmed":true}'
# в ответе confirmed=true и remind_at = starts_at − 3 часа
```

**5. Профиль.** Категория `music` получила вес после онбординга и лайка; правим её вручную и убираем `theatre`:

```bash
curl -sk -X PATCH $BASE/api/profile -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"interests":[{"tag":"music","weight":5}],"remove_interests":["theatre"]}'
# в interests есть {"tag":"music","weight":5}, тега theatre нет
```

**6. Своё мероприятие: создание, редактирование, список.**

```bash
STARTS=$(date -u -d '+2 days' +%Y-%m-%dT%H:%M:%SZ)
curl -sk -X POST $BASE/api/events -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"title\":\"Джем в гараже\",\"description\":\"Приносите инструменты\",\"category\":\"music\",\"tags\":[\"джем\"],\"city\":\"Москва\",\"starts_at\":\"$STARTS\",\"ends_at\":null,\"price\":0,\"age_limit\":12}" \
  | tee /tmp/created.json
MY_ID=$(jq -r .id /tmp/created.json)
# 201, "source":"user", "created_by" = ваш id

# PATCH — полная замена полей, тело как у POST
curl -sk -X PATCH $BASE/api/events/$MY_ID -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"title\":\"Джем в гараже (обновлено)\",\"description\":\"Приносите инструменты\",\"category\":\"music\",\"tags\":[\"джем\"],\"city\":\"Москва\",\"starts_at\":\"$STARTS\",\"price\":300,\"age_limit\":12}"
# 200, price=300

curl -sk "$BASE/api/events/mine" -H "Authorization: Bearer $TOKEN" | jq '.total, .items[].title'
```

**7. Обложка** (png, jpeg или webp до 5 МБ):

```bash
curl -sk -X POST $BASE/api/uploads -H "Authorization: Bearer $TOKEN" -F file=@cover.png
# 201 {"url":"/uploads/<uuid>.png"}; файл открывается по $BASE/url без токена
```

**8. Фронтенд.** Откройте `https://<DOMAIN>` в MAX (или в браузере при `npm run dev` с
`VITE_DEV_INIT_DATA` из `gen-initdata`): онбординг, свайпы, «Избранное», «Профиль» →
«Мои мероприятия» → «Редактировать».

## Известные ограничения

- **`SECRET_KEY`.** Если переменная пуста, JWT подписываются публичным дефолтом `secret-key`. Перед публикацией обязательно задайте свой ключ.
- **Порт Postgres опубликован на хост** (`POSTGRES_PORT`). На боевом сервере закройте его файрволом.
- **Демо-данные не помечены как синтетические.** События миграции `0003` — вручную составленные примеры с `source='other'`, поэтому `is_synthetic=false`. Даты в них считаются от момента применения миграции и со временем устареют; при откате `0003` удаляются все события с `source='other'` и пустым `created_by`. Города — только Москва и Санкт-Петербург.
- **Правка и удаление.** Мероприятие можно редактировать только автору и только до начала; удаления мероприятий в API нет. Демо-события не редактируются (у них нет автора). Модерации нет: созданное сразу видно всем.
- **Профиль.** `birth_date` можно заменить, но нельзя очистить (`null` и пустая строка означают «не менять»). `onboarding_text` только сохраняется, в интересы не разбирается. Онбординг можно вызвать повторно, тогда веса выбранных категорий прибавятся ещё раз.
- **Избранное.** `DELETE /api/favorites/{id}` не стирает свайп, а превращает лайк в скип: событие не вернётся в ленту.
- **Лента.** Фильтр по городу — точное совпадение строки с `users.city`. Скоринг считается в памяти по всем подходящим событиям города, пагинация — после сортировки; для MVP это нормально, для большого каталога нет.
- **Напоминания** отправляет один экземпляр сервера раз в минуту; при нескольких репликах сообщения могли бы дублироваться.
- **Обложки** хранятся в docker-volume, отдаются без авторизации и не чистятся, если мероприятие изменено или удалено.
- **Часовой пояс.** Фронт показывает и принимает время событий в `Europe/Moscow`.
- **Служебные ручки** `GET /health` и `GET /test-bot` (без авторизации, отправляет сообщение от имени бота) Caddy наружу не проксирует, они доступны только внутри docker-сети. В `openapi.yaml` описан только `/health`.
- **Сборка образа** требует доступа в интернет: `server/Dockerfile` скачивает бинарник `golang-migrate` с GitHub и корневые сертификаты Минцифры (нужны для запросов к API MAX).
- **`npm run dev`** проксирует `/api` и `/uploads` на боевой домен, заданный в `client/vite.config.js`; для своего стенда поправьте `target`.
- **Автотестов** в репозитории нет.
