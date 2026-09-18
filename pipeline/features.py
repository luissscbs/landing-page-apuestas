"""Feature engineering anti-leakage (solo pasado -> presente).

- Elo dinámico: R_new = R_old + K*G*(W-We), K=20, ventaja local +65.
  G = 1 (gana x1), 1.5 (x2), 1.75 (x3+). We logística base 400.
- Rolling últimos N (default 5): gf_for/against, puntos, wins. Split local/visita.
- Fatiga: days_since_last_match (por equipo, min home/away), has_midweek (<4 días).

Entrada: lista matches ordenada asc por match_date (como sale de ingest).
Salida: misma lista + campo 'features' por partido. Puro stdlib.
"""
from __future__ import annotations

from collections import defaultdict, deque
from datetime import datetime

K = 20.0
HOME_ADV = 65.0


def _dt(iso: str) -> datetime:
    return datetime.fromisoformat(iso.replace("Z", "+00:00"))


def expected_home(elo_home: float, elo_away: float) -> float:
    dr = (elo_home + HOME_ADV) - elo_away
    return 1.0 / (10 ** (-dr / 400.0) + 1.0)


def g_mult(gdiff: int) -> float:
    a = abs(gdiff)
    if a >= 3:
        return 1.75
    if a == 2:
        return 1.5
    return 1.0


def enrich(matches: list[dict], window: int = 5) -> list[dict]:
    elos: dict[str, float] = defaultdict(lambda: 1500.0)
    # historial por equipo: deque de (gf, ga, pts)
    hist: dict[str, deque] = defaultdict(lambda: deque(maxlen=window))
    hist_home: dict[str, deque] = defaultdict(lambda: deque(maxlen=window))
    hist_away: dict[str, deque] = defaultdict(lambda: deque(maxlen=window))
    last_date: dict[str, datetime] = {}

    out: list[dict] = []
    for m in sorted(matches, key=lambda x: x["match_date"]):
        h, a = m["home_team_id"], m["away_team_id"]
        dt = _dt(m["match_date"])
        eh, ea = elos[h], elos[a]

        def avg(d: deque, idx: int) -> float | None:
            if not d:
                return None
            return round(sum(r[idx] for r in d) / len(d), 3)

        def days_since(team: str) -> int | None:
            if team not in last_date:
                return None
            return max(0, (dt - last_date[team]).days)

        dh, da = days_since(h), days_since(a)
        feats = {
            "elo_home": round(eh, 1),
            "elo_away": round(ea, 1),
            "elo_prob_home": round(expected_home(eh, ea), 4),
            "roll_h_gf": avg(hist[h], 0),
            "roll_h_ga": avg(hist[h], 1),
            "roll_h_pts": avg(hist[h], 2),
            "roll_a_gf": avg(hist[a], 0),
            "roll_a_ga": avg(hist[a], 1),
            "roll_a_pts": avg(hist[a], 2),
            "roll_h_home_pts": avg(hist_home[h], 2),
            "roll_a_away_pts": avg(hist_away[a], 2),
            "days_since_home": dh,
            "days_since_away": da,
            "has_midweek_home": dh is not None and dh < 4,
            "has_midweek_away": da is not None and da < 4,
            "games_played_home": len(hist[h]),
            "games_played_away": len(hist[a]),
        }
        m2 = {**m, "features": feats}
        out.append(m2)

        # Actualizar estado SOLO con resultado conocido (FINISHED)
        hs, aws = m.get("home_score"), m.get("away_score")
        if hs is not None and aws is not None:
            if hs > aws:
                wh, pts_h, pts_a = 1.0, 3, 0
            elif hs < aws:
                wh, pts_h, pts_a = 0.0, 0, 3
            else:
                wh, pts_h, pts_a = 0.5, 1, 1
            we = expected_home(eh, ea)
            g = g_mult(hs - aws)
            elos[h] = eh + K * g * (wh - we)
            elos[a] = ea + K * g * ((1 - wh) - (1 - we))
            hist[h].append((hs, aws, pts_h))
            hist[a].append((aws, hs, pts_a))
            hist_home[h].append((hs, aws, pts_h))
            hist_away[a].append((aws, hs, pts_a))
            last_date[h] = dt
            last_date[a] = dt
    return out


def elo_table(matches: list[dict]) -> dict[str, float]:
    """Ratings finales tras procesar en orden (útil para sembrar ML)."""
    enriched = enrich(matches)
    table: dict[str, float] = {}
    for m in enriched:
        table[m["home_team_id"]] = m["features"]["elo_home"]
        table[m["away_team_id"]] = m["features"]["elo_away"]
    # Re-procesar no basta para final; recalculamos iterando estados:
    elos: dict[str, float] = defaultdict(lambda: 1500.0)
    for m in sorted(matches, key=lambda x: x["match_date"]):
        h, a = m["home_team_id"], m["away_team_id"]
        hs, aws = m.get("home_score"), m.get("away_score")
        if hs is None or aws is None:
            continue
        wh = 1.0 if hs > aws else (0.0 if hs < aws else 0.5)
        we = expected_home(elos[h], elos[a])
        g = g_mult(hs - aws)
        elos[h] = elos[h] + K * g * (wh - we)
        elos[a] = elos[a] + K * g * ((1 - wh) - (1 - we))
    return {k: round(v, 1) for k, v in elos.items()}
