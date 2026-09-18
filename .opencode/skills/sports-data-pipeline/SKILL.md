---
name: sports-data-pipeline
description: Use when designing ETL pipelines, ingesting sports data and live bookmaker odds, and engineering features for sports prediction models.
---

# Sports Data Ingestion & Feature Pipeline

Guía para construir pipelines de extracción, transformación, almacenamiento (ETL) y feature engineering para modelos de apuestas deportivas.

---

## 1. Proveedores y Fuentes de Datos

- **Cuotas en Tiempo Real y Cierre:**
  - *The Odds API:* Cobertura global de cuotas pre-match y en directo de múltiples casas (Pinnacle, Bet365, Betfair).
  - *Sportradar / Betradar:* Nivel profesional / enterprise.
- **Estadísticas Detalladas y Resultados:**
  - *API-Football (API-Sports):* Alineaciones, tiros a puerta, posesión, tarjetas y lesiones.
  - *Football-Data.co.uk:* Archivos CSV históricos gratuitos con cuotas y resultados desde 2000.
  - *Understat / FBRef:* Métricas avanzadas de goles esperados ($xG$) y asistencias esperadas ($xA$).

---

## 2. Feature Engineering Específico para Apuestas

El rendimiento del modelo ML depende de la calidad de sus variables predictivas:

### A. Métricas Rodantes (Rolling Metrics)
Calcular promedios móviles exponenciales (EMA) o rodantes de las últimas 3, 5 y 10 fechas:
- `rolling_xg_for_last5`: Goles esperados generados en los últimos 5 partidos.
- `rolling_xg_against_last5`: Goles esperados concedidos.
- `rolling_shots_on_target_ratio`: Porcentaje de tiros a puerta concedidos vs ejecutados.
- **División Local/Visitante:** Calcular métricas separadas cuando el equipo juega de local y cuando juega de visitante.

### B. Rating Dinámico Elo de Equipos
Actualizar la puntuación Elo después de cada jornada considerando el margen de victoria:
$$R_{\text{nuevo}} = R_{\text{anterior}} + K \times G \times (W - W_e)$$
- $K = 20$ (factor de ajuste).
- $G$: Multiplicador por diferencia de goles (ej. $1.5$ si gana por 2 goles, $1.75$ por 3 o más).
- $W_e$: Probabilidad esperada según la diferencia de ratings + ventaja de campo ($+65$ puntos para el local).

### C. Variables de Fatiga y Calendario
- `days_since_last_match`: Días transcurridos desde el último compromiso oficial.
- `has_midweek_continental`: Booleano si jugó Champions League o torneo continental entre semana.

---

## 3. Mapeo y Normalización de Entidades

Cada proveedor nombra los equipos de manera distinta (ej. "Real Madrid", "Real Madrid CF", "RMA").
- Mantener una tabla centralizada de alias en PostgreSQL:
```sql
CREATE TABLE team_aliases (
    id SERIAL PRIMARY KEY,
    canonical_name VARCHAR(100) NOT NULL,
    alias VARCHAR(100) UNIQUE NOT NULL,
    sport VARCHAR(50) NOT NULL
);

-- Ejemplos de mapeo
INSERT INTO team_aliases (canonical_name, alias, sport) VALUES
('Real Madrid', 'Real Madrid CF', 'football'),
('Real Madrid', 'Real Madrid', 'football'),
('Atlético Madrid', 'Club Atlético de Madrid', 'football'),
('Atlético Madrid', 'Atletico Madrid', 'football');
```

---

## 4. Esquema Relacional de Base de Datos (PostgreSQL)

```sql
CREATE TABLE matches (
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

CREATE TABLE odds_snapshots (
    id BIGSERIAL PRIMARY KEY,
    match_id VARCHAR(64) REFERENCES matches(id),
    bookmaker VARCHAR(50) NOT NULL,
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    odds_home NUMERIC(6,3) NOT NULL,
    odds_draw NUMERIC(6,3),
    odds_away NUMERIC(6,3) NOT NULL,
    is_closing_line BOOLEAN DEFAULT FALSE
);

CREATE TABLE ml_predictions (
    id BIGSERIAL PRIMARY KEY,
    match_id VARCHAR(64) REFERENCES matches(id),
    model_version VARCHAR(50) NOT NULL,
    predicted_at TIMESTAMPTZ DEFAULT NOW(),
    prob_home NUMERIC(5,4) NOT NULL,
    prob_draw NUMERIC(5,4),
    prob_away NUMERIC(5,4) NOT NULL,
    best_ev_selection VARCHAR(10),
    expected_value_pct NUMERIC(6,2),
    recommended_stake_pct NUMERIC(5,2)
);
```
