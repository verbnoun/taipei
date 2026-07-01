-- Taipei Field Notes — source of truth

CREATE TABLE IF NOT EXISTS neighborhoods (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  zh          TEXT,
  lat         REAL,
  lng         REAL,
  tokyo       TEXT,
  mrt         TEXT,
  known_for   TEXT
);

CREATE TABLE IF NOT EXISTS spots (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  zh            TEXT,
  category      TEXT NOT NULL,
  neighborhood  TEXT REFERENCES neighborhoods(id),
  lat           REAL,
  lng           REAL,
  no_map        INTEGER DEFAULT 0,
  about         TEXT,
  status        TEXT,
  url           TEXT,
  -- Apple Maps compatible address (NULL = venue varies / unverified)
  address_apple TEXT,
  address_verified INTEGER DEFAULT 0,
  -- review gate: 0 = staged (invisible to app), 1 = live
  published     INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS spot_details (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  spot_id  TEXT NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  key      TEXT NOT NULL,
  value    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  -- display location (shown in card and ICS LOCATION)
  location        TEXT,
  -- Apple Maps compatible address for ICS geo-linking
  location_apple  TEXT,
  date            TEXT,   -- ISO YYYY-MM-DD; NULL for floating recurring
  start_time      TEXT,   -- HH:MM or NULL (all-day)
  end_time        TEXT,
  all_day         INTEGER DEFAULT 0,
  rrule           TEXT,   -- iCal RRULE string for recurring
  cadence_label   TEXT,   -- human label shown in card (e.g. "Fri & Sat nights")
  category        TEXT,
  description     TEXT,
  status          TEXT DEFAULT 'unknown',  -- confirmed / tentative / unknown
  url             TEXT,
  spot_id         TEXT REFERENCES spots(id),
  -- review gate: 0 = staged (invisible to app + calendar), 1 = live
  published       INTEGER DEFAULT 1
);

-- Leads: people / communities / makers / scenes worth meeting or exploring.
-- Deliberately loose — discovery that doesn't fit an event or a place.
CREATE TABLE IF NOT EXISTS leads (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  kind       TEXT,          -- person / community / maker / shop / scene / other
  handle_url TEXT,          -- IG / site / wherever to find them
  note       TEXT,          -- why relevant + how to connect
  category   TEXT,          -- freeform label, nullable ("who cares")
  certainty  TEXT DEFAULT 'lead',
  source_url TEXT,
  published  INTEGER DEFAULT 0,
  met        INTEGER DEFAULT 0   -- checked off once Jackson has met/connected
);

-- Sources: a crawlable URL that can provide event or spot info
CREATE TABLE IF NOT EXISTS sources (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT,
  url             TEXT NOT NULL,
  type            TEXT,  -- website / instagram / ra / kktix / meetup / facebook
  last_checked_at TEXT   -- ISO datetime
);

-- Many-to-many: events ↔ sources
CREATE TABLE IF NOT EXISTS event_sources (
  event_id    TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  source_id   INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  scraped_at  TEXT,
  confidence  TEXT DEFAULT 'confirmed',  -- confirmed / inferred
  PRIMARY KEY (event_id, source_id)
);

-- Many-to-many: spots ↔ sources
CREATE TABLE IF NOT EXISTS spot_sources (
  spot_id     TEXT NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  source_id   INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  scraped_at  TEXT,
  confidence  TEXT DEFAULT 'confirmed',
  PRIMARY KEY (spot_id, source_id)
);

-- Gap-finding views

CREATE VIEW IF NOT EXISTS events_no_source AS
SELECT e.id, e.title, e.category, e.date, e.status
FROM events e
LEFT JOIN event_sources es ON es.event_id = e.id
WHERE es.event_id IS NULL
ORDER BY e.date;

CREATE VIEW IF NOT EXISTS spots_no_source AS
SELECT s.id, s.name, s.category, s.address_verified
FROM spots s
LEFT JOIN spot_sources ss ON ss.spot_id = s.id
WHERE ss.spot_id IS NULL
ORDER BY s.category, s.name;

CREATE VIEW IF NOT EXISTS events_by_gap AS
SELECT
  category,
  COUNT(*) AS total,
  SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
  SUM(CASE WHEN status = 'tentative' THEN 1 ELSE 0 END) AS tentative,
  SUM(CASE WHEN status = 'unknown'   THEN 1 ELSE 0 END) AS unknown,
  SUM(CASE WHEN (SELECT count(*) FROM event_sources WHERE event_id = id) = 0 THEN 1 ELSE 0 END) AS no_source
FROM events
GROUP BY category
ORDER BY no_source DESC, total DESC;
