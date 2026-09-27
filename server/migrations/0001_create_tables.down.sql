BEGIN;

DROP INDEX IF EXISTS idx_swipes_remind;
DROP INDEX IF EXISTS idx_swipes_user;

DROP INDEX IF EXISTS idx_events_created_by;
DROP INDEX IF EXISTS idx_events_tags_gin;
DROP INDEX IF EXISTS idx_events_category;
DROP INDEX IF EXISTS idx_events_city_start;

DROP TABLE IF EXISTS swipes CASCADE;
DROP TABLE IF EXISTS user_interests CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS swipe_action;
DROP TYPE IF EXISTS event_source;
DROP TYPE IF EXISTS event_category;

COMMIT;
