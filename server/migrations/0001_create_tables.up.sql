CREATE TYPE event_category AS ENUM (
    'music','theatre','exhibition','cinema','sport','outdoor',
    'party','food','education','volunteering','other'
);

CREATE TYPE event_source AS ENUM (
    'user', 'synthetic', 'afisha.yandex.ru', 'vk.ru', 'www.culture.ru', 'max', 'bilet.mos.ru', 'other'
);

CREATE TABLE users (
    id          UUID        PRIMARY KEY DEFAULT uuidv7(),
    max_user_id BIGINT      NOT NULL UNIQUE,  -- id из initData MAX
    name        VARCHAR(64) CHECK (name IS NULL OR name != ''),
    city        VARCHAR(64) CHECK (city IS NULL OR city != ''),
    birth_date  DATE        CHECK (birth_date IS NULL OR
                                    EXTRACT(YEAR FROM AGE(birth_date))::int BETWEEN 10 AND 110),
    info        VARCHAR(1024) CHECK (info IS NULL OR info != ''),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE events (
    id          UUID           PRIMARY KEY DEFAULT uuidv7(),
    title       VARCHAR(128)   NOT NULL CHECK (title != ''),
    description VARCHAR(2048)  NOT NULL CHECK (description != ''),
    category    event_category NOT NULL,
    tags        JSONB          NOT NULL DEFAULT '[]', -- разметка LLM, напр. ['много людей','старше 20','рок']
    city        VARCHAR(64)    NOT NULL CHECK (city != ''),
    venue       VARCHAR(256),
    starts_at   TIMESTAMPTZ    NOT NULL CHECK (starts_at > now()),
    ends_at     TIMESTAMPTZ    NOT NULL CHECK (ends_at > starts_at),
    price       INTEGER        NOT NULL DEFAULT 0,
    age_limit   SMALLINT       NOT NULL DEFAULT 0,
    url         VARCHAR(512),
    image_url   VARCHAR(512),
    source      event_source   NOT NULL,-- 'synthetic' = тестовые данные (README)
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,-- заполнено при source='user'
    fetched_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_city_start  ON events (city, starts_at);
CREATE INDEX idx_events_category    ON events (category);
CREATE INDEX idx_events_tags_gin    ON events USING GIN (tags);
CREATE INDEX idx_events_created_by  ON events (created_by);


CREATE TABLE user_interests (
    user_id UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tag     VARCHAR(128) NOT NULL, -- от LLM или категория
    weight  REAL         NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, tag)
);

CREATE TYPE swipe_action AS ENUM ('like', 'skip');

CREATE TABLE swipes (
    id         UUID         PRIMARY KEY DEFAULT uuidv7(),
    user_id    UUID         NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    event_id   UUID         NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    action     swipe_action NOT NULL,
    confirmed  BOOLEAN      NOT NULL DEFAULT false,
    remind_at  TIMESTAMPTZ,
    reminded   BOOLEAN      NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (user_id, event_id)
);

CREATE INDEX idx_swipes_user   ON swipes (user_id, action);
CREATE INDEX idx_swipes_remind ON swipes (remind_at) WHERE reminded = false AND remind_at IS NOT NULL;
