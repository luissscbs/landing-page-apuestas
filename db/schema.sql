-- P50 Sports · Esquema pipeline de datos (sports-data-pipeline)
-- Postgres 15+. Idempotente: seguro re-ejecutar con psql -f db/schema.sql

CREATE TABLE IF NOT EXISTS team_aliases (
    id SERIAL PRIMARY KEY,
    canonical_name VARCHAR(100) NOT NULL,
    alias VARCHAR(100) UNIQUE NOT NULL,
    sport VARCHAR(50) NOT NULL DEFAULT 'football'
);

CREATE TABLE IF NOT EXISTS matches (
    id VARCHAR(64) PRIMARY KEY,
    league VARCHAR(50) NOT NULL,
    season VARCHAR(10) NOT NULL,
    match_date TIMESTAMPTZ NOT NULL,
    home_team_id VARCHAR(50) NOT NULL,
    away_team_id VARCHAR(50) NOT NULL,
    home_score INT,
    away_score INT,
    status VARCHAR(20) DEFAULT 'SCHEDULED' -- SCHEDULED, LIVE, FINISHED
);

CREATE TABLE IF NOT EXISTS odds_snapshots (
    id BIGSERIAL PRIMARY KEY,
    match_id VARCHAR(64) REFERENCES matches(id) ON DELETE CASCADE,
    bookmaker VARCHAR(50) NOT NULL,
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    odds_home NUMERIC(6,3) NOT NULL,
    odds_draw NUMERIC(6,3),
    odds_away NUMERIC(6,3) NOT NULL,
    is_closing_line BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS ml_predictions (
    id BIGSERIAL PRIMARY KEY,
    match_id VARCHAR(64) REFERENCES matches(id) ON DELETE CASCADE,
    model_version VARCHAR(50) NOT NULL,
    predicted_at TIMESTAMPTZ DEFAULT NOW(),
    prob_home NUMERIC(5,4) NOT NULL,
    prob_draw NUMERIC(5,4),
    prob_away NUMERIC(5,4) NOT NULL,
    best_ev_selection VARCHAR(10),
    expected_value_pct NUMERIC(6,2),
    recommended_stake_pct NUMERIC(5,2)
);

-- Índices para ingesta y serving (TTL / live)
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches (match_date DESC);
CREATE INDEX IF NOT EXISTS idx_matches_league_season ON matches (league, season);
CREATE INDEX IF NOT EXISTS idx_odds_match_captured ON odds_snapshots (match_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_odds_closing ON odds_snapshots (match_id) WHERE is_closing_line = TRUE;
CREATE INDEX IF NOT EXISTS idx_ml_match ON ml_predictions (match_id, predicted_at DESC);
CREATE INDEX IF NOT EXISTS idx_alias_canonical ON team_aliases (canonical_name);

-- Seeds: canónicos usados en lib/p50.ts FALLBACK_ODDS → alias inicial
INSERT INTO team_aliases (canonical_name, alias, sport) VALUES
  ('Real Madrid', 'Real Madrid', 'football'),
  ('Real Madrid', 'Real Madrid CF', 'football'),
  ('FC Barcelona', 'FC Barcelona', 'football'),
  ('FC Barcelona', 'Barcelona', 'football'),
  ('FC Barcelona', 'Barca', 'football'),
  ('Atletico Madrid', 'Atlético', 'football'),
  ('Atletico Madrid', 'Atletico Madrid', 'football'),
  ('Atletico Madrid', 'Club Atlético de Madrid', 'football'),
  ('Sevilla', 'Sevilla', 'football'),
  ('Sevilla FC', 'Sevilla', 'football'),
  ('Manchester City', 'Man. City', 'football'),
  ('Manchester City', 'Man City', 'football'),
  ('Arsenal', 'Arsenal', 'football'),
  ('Boca Juniors', 'Boca Juniors', 'football'),
  ('River Plate', 'River Plate', 'football'),
  ('Club America', 'América', 'football'),
  ('Club America', 'America', 'football'),
  ('Guadalajara Chivas', 'Chivas', 'football'),
  ('Guadalajara Chivas', 'Chivas Guadalajara', 'football'),
  ('Atletico Nacional', 'Atl. Nacional', 'football'),
  ('Atletico Nacional', 'Atletico Nacional', 'football'),
  ('Millonarios', 'Millonarios', 'football')
ON CONFLICT (alias) DO NOTHING;
