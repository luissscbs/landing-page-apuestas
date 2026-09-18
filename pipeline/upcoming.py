"""Upcoming desde partidos REALES (The Odds API) + modelo histórico.

Fixtures: pipeline/live_odds.py (The Odds API: commence_time real y
triple mediano entre casas europeas). Aquí NO se genera ningún cruce:
sin eventos en vivo, la respuesta es vacía (el frontend cae a
FALLBACK_ODDS por diseño).

Modelo: Elos walk-forward + forma + fatiga del histórico data/
(features.py sobre Football-Data.co.uk) -> Dixon-Coles -> shrinkage
72/28 con la implícita del mercado -> fair odds -> EV/Kelly, más
mercados derivados BTTS/OU2.5/DC (ml_probability.py).

Solo stdlib.
"""
from __future__ import annotations

import csv
import glob
import hashlib
import os
import re
import unicodedata

from . import features as feat
from . import live_odds
from . import ml_probability as mlp
from .teams import canonical

# ── Ligas (display/categoría espejan live_odds.SPORTS) ─────────────

LEAGUES: dict[str, dict[str, str]] = {
    v["league_code"]: {"display": v["display"], "category": v["category"]}
    for v in live_odds.SPORTS.values()
}

# ── Presentación por equipo (display, short, colores) ─────────────
# Clave = nombre canónico del histórico (teams.canonical) o nombre Odds
# API si no hay histórico (Serie A/Bundesliga). Resto: fallback.

_TEAM_META: dict[str, dict[str, str]] = {
    "Real Madrid": {"short": "RMA", "color": "#3b82f6"},
    "FC Barcelona": {"short": "FCB", "color": "#ef4444"},
    "Ath Madrid": {"display": "Atlético Madrid", "short": "ATM", "color": "#ef4444"},
    "Sevilla": {"display": "Sevilla FC", "short": "SEV", "color": "#cbd5e1"},
    "Manchester City": {"display": "Man. City", "short": "MCI", "color": "#0ea5e9"},
    "Arsenal": {"short": "ARS", "color": "#dc2626"},
    "Liverpool": {"short": "LIV", "color": "#b91c1c"},
    "Man United": {"display": "Man. United", "short": "MUN", "color": "#b91c1c"},
    "Chelsea": {"display": "Chelsea", "short": "CHE", "color": "#2563eb"},
    "Tottenham": {"short": "TOT", "color": "#e2e8f0"},
    "Newcastle": {"short": "NEW", "color": "#64748b"},
    "Ath Bilbao": {"display": "Athletic Club", "short": "ATH", "color": "#dc2626"},
    "Betis": {"display": "Real Betis", "short": "BET", "color": "#22c55e"},
    "Villarreal": {"short": "VIL", "color": "#facc15"},
    "Sociedad": {"display": "Real Sociedad", "short": "RSO", "color": "#38bdf8"},
    "Valencia": {"short": "VAL", "color": "#f97316"},
    "Girona": {"short": "GIR", "color": "#ef4444"},
    "Celta": {"display": "Celta Vigo", "short": "CEL", "color": "#38bdf8"},
    "Osasuna": {"short": "OSA", "color": "#dc2626"},
    "Getafe": {"short": "GET", "color": "#2563eb"},
    "Vallecano": {"display": "Rayo Vallecano", "short": "RAY", "color": "#ef4444"},
    "Mallorca": {"short": "MAL", "color": "#dc2626"},
    "Alaves": {"display": "Alavés", "short": "ALA", "color": "#2563eb"},
    "Espanol": {"display": "Espanyol", "short": "ESP", "color": "#38bdf8"},
    "Elche": {"short": "ELC", "color": "#22c55e"},
    "Santander": {"display": "R. Santander", "short": "RAC", "color": "#22c55e"},
    "Bournemouth": {"short": "BOU", "color": "#dc2626"},
    "Brighton": {"short": "BHA", "color": "#38bdf8"},
    "Everton": {"display": "Everton", "short": "EVE", "color": "#2563eb"},
    "West Ham": {"short": "WHU", "color": "#7c2d12"},
    "Crystal Palace": {"short": "CRY", "color": "#dc2626"},
    "Fulham": {"short": "FUL", "color": "#e2e8f0"},
    "Wolves": {"short": "WOL", "color": "#f97316"},
    "Aston Villa": {"short": "AVL", "color": "#38bdf8"},
    "Brentford": {"short": "BRE", "color": "#ef4444"},
    "Nott'm Forest": {"display": "Nott'm Forest", "short": "NFO", "color": "#dc2626"},
    "Ipswich": {"short": "IPS", "color": "#38bdf8"},
    "Hull": {"short": "HUL", "color": "#f97316"},
    "Coventry": {"short": "COV", "color": "#38bdf8"},
    # Serie A / Bundesliga (sin histórico: solo presentación)
    "Inter Milan": {"display": "Inter", "short": "INT", "color": "#2563eb"},
    "AC Milan": {"display": "Milan", "short": "MIL", "color": "#dc2626"},
    "Juventus": {"display": "Juventus", "short": "JUV", "color": "#e2e8f0"},
    "Napoli": {"display": "Napoli", "short": "NAP", "color": "#38bdf8"},
    "AS Roma": {"display": "Roma", "short": "ROM", "color": "#facc15"},
    "Lazio": {"display": "Lazio", "short": "LAZ", "color": "#38bdf8"},
    "Atalanta": {"display": "Atalanta", "short": "ATA", "color": "#2563eb"},
    "Bayern Munich": {"display": "Bayern", "short": "BAY", "color": "#dc2626"},
    "Borussia Dortmund": {"display": "Dortmund", "short": "BVB", "color": "#facc15"},
    "Bayer Leverkusen": {"display": "Leverkusen", "short": "LEV", "color": "#ef4444"},
    "RB Leipzig": {"display": "RB Leipzig", "short": "RBL", "color": "#e2e8f0"},
    "VfB Stuttgart": {"display": "Stuttgart", "short": "VFB", "color": "#ef4444"},
}

_PALETTE = ["#3b82f6", "#22c55e", "#facc15", "#f97316", "#38bdf8", "#e2e8f0"]


def team_display(name: str) -> str:
    return _TEAM_META.get(name, {}).get("display", name)


def team_short(name: str) -> str:
    if name in _TEAM_META and "short" in _TEAM_META[name]:
        return _TEAM_META[name]["short"]
    letters = re.sub(r"[^A-Za-z]", "", name).upper()
    return (letters[:3] or "XXX").ljust(3, "X")


def team_color(name: str) -> str:
    if name in _TEAM_META and "color" in _TEAM_META[name]:
        return _TEAM_META[name]["color"]
    h = int(hashlib.md5(name.encode()).hexdigest(), 16)
    return _PALETTE[h % len(_PALETTE)]


def _slug(s: str) -> str:
    s = "".join(
        c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn"
    )
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:32]


# ── Estado del histórico (lado modelo: Elo + forma + fatiga) ──────

def _fint(v: str | None) -> int | None:
    try:
        if v is None or str(v).strip() == "":
            return None
        return int(float(str(v).strip()))
    except ValueError:
        return None


def load_history(data_dir: str = "data") -> list[dict]:
    matches: list[dict] = []
    for path in sorted(glob.glob(os.path.join(data_dir, "matches_*.csv"))):
        with open(path, encoding="utf-8", newline="") as f:
            for m in csv.DictReader(f):
                matches.append(
                    {
                        "id": m["id"],
                        "league": m["league"],
                        "season": m["season"],
                        "match_date": m["match_date"],
                        "home_team_id": m["home_team_id"],
                        "away_team_id": m["away_team_id"],
                        "home_score": _fint(m.get("home_score")),
                        "away_score": _fint(m.get("away_score")),
                        "status": m.get("status") or "FINISHED",
                    }
                )
    matches.sort(key=lambda m: m["match_date"])
    return matches


class DatasetState:
    """Elos walk-forward + última forma/fatiga por equipo (lado modelo)."""

    def __init__(self, matches: list[dict]):
        self.matches = matches
        self.enriched = feat.enrich(matches) if matches else []
        self.elos = feat.elo_table(matches) if matches else {}
        self.last_feats: dict[str, dict] = {}
        self.last_date: dict[str, str] = {}
        for m in self.enriched:
            f = m["features"]
            self.last_feats[m["home_team_id"]] = f
            self.last_feats[m["away_team_id"]] = f
            if m.get("home_score") is not None:
                self.last_date[m["home_team_id"]] = m["match_date"]
                self.last_date[m["away_team_id"]] = m["match_date"]
        seasons = sorted({m["season"] for m in matches})
        self.provenance = {
            "matches": len(matches),
            "seasons": seasons,
            "leagues": sorted({m["league"] for m in matches}),
            "last_match_date": matches[-1]["match_date"] if matches else None,
        }


_STATE_CACHE: dict[str, tuple[float, DatasetState]] = {}
_STATE_TTL_S = 300.0


def get_state(data_dir: str = "data") -> DatasetState:
    import time

    now = time.monotonic()
    hit = _STATE_CACHE.get(data_dir)
    if hit and (now - hit[0]) < _STATE_TTL_S:
        return hit[1]
    st = DatasetState(load_history(data_dir))
    _STATE_CACHE[data_dir] = (now, st)
    return st


# ── Pricing ML sobre eventos reales ───────────────────────────────

# Shrinkage validado (data/calibration.json: Brier mercado 0.5906,
# w=0.15 -> 0.5901). Si falta el artefacto se usa este default.
DEFAULT_W_MODEL = 0.15
# Discrepancia modelo-mercado: por encima se refuerza el shrinkage,
# se topa la confianza y se marca aviso (nunca pick "seguro").
GAP_WARN = 0.08

_RATINGS_CACHE: dict[str, dict | None] = {}
_CAL_CACHE: dict[str, dict] = {}


def get_ratings(data_dir: str = "data") -> dict | None:
    """team_ratings.json (tolerante: None -> modo market-trust)."""
    if data_dir not in _RATINGS_CACHE:
        try:
            from .xg_ratings import load_ratings

            _RATINGS_CACHE[data_dir] = load_ratings(data_dir)
        except (OSError, ValueError):
            _RATINGS_CACHE[data_dir] = None
    return _RATINGS_CACHE[data_dir]


def get_w_model(data_dir: str = "data") -> float:
    """Peso del modelo desde calibration.json (tolerante)."""
    if data_dir not in _CAL_CACHE:
        try:
            import json as _json

            with open(os.path.join(data_dir, "calibration.json"), encoding="utf-8") as f:
                _CAL_CACHE[data_dir] = _json.load(f)
        except (OSError, ValueError):
            _CAL_CACHE[data_dir] = {}
    try:
        return float(_CAL_CACHE[data_dir]["shrinkage"]["w_model"])
    except (KeyError, TypeError, ValueError):
        return DEFAULT_W_MODEL


def price_fixture(fix: dict, st: DatasetState, ratings: dict | None = None, w_model: float = DEFAULT_W_MODEL) -> dict:
    """fix: evento real (home/away ya canónicos) + triple mediano real.

    λ = xG proyectado por Dixon-Coles MLE (xg_ratings); sin ratings el
    mercado manda (sin +EV falsos). Shrinkage validado + guardia de
    discrepancia >8pp.
    """
    from .xg_ratings import project

    implied = mlp.remove_vig(fix["market_odds"], method="power")
    lg_r = (ratings or {}).get("leagues", {}).get(fix["league_code"], {})
    rho = lg_r.get("rho", -0.12)
    has_ratings = bool(
        ratings and fix["home"] in lg_r.get("teams", {}) and fix["away"] in lg_r.get("teams", {})
    )
    if has_ratings:
        lh, la, _ = project(fix["home"], fix["away"], fix["league_code"], ratings)
    else:
        # Sin ratings (Serie A/Bundesliga o artefacto ausente): el mercado
        # manda. Inventar fuerzas fabricaría +EV falsos en extremos.
        lh, la = mlp.fit_market_lambdas(implied)

    # Ajuste de forma: diferencial de puntos rolling (últimos 5).
    lf = st.last_feats.get(fix["home"], {})
    af = st.last_feats.get(fix["away"], {})
    rh = lf.get("roll_h_pts", lf.get("roll_h_home_pts"))
    ra = af.get("roll_a_pts", af.get("roll_a_away_pts"))
    if rh is not None and ra is not None:
        adj = max(-0.12, min(0.12, (rh - ra) / 3.0 * 0.08))
        lh = max(0.2, min(4.0, lh * (1 + adj)))
        la = max(0.2, min(4.0, la * (1 - adj)))

    # Ajuste de fatiga: -3% gol esperado si jugó hace <4 días.
    if lf.get("has_midweek_home"):
        lh *= 0.97
    if af.get("has_midweek_away"):
        la *= 0.97

    probs_model = mlp.predict_1x2(round(lh, 3), round(la, 3), rho)
    implied = mlp.remove_vig(fix["market_odds"], method="power")

    # Shrinkage validado + guardia de discrepancia: si el modelo se despega
    # >8pp del consenso (mercado Pinnacle/Bet365), no es pick seguro.
    gap = max(abs(probs_model[k] - implied[k]) for k in ("home", "draw", "away"))
    w = w_model
    warning = None
    if has_ratings and gap > GAP_WARN:
        w = w_model * 0.5
        warning = (
            f"Discrepancia modelo-mercado de {gap * 100:.1f}pp: "
            "shrinkage reforzado hacia el consenso; revisar antes de apostar."
        )
    blended = {k: w * probs_model[k] + (1 - w) * implied[k] for k in ("home", "draw", "away")}
    tot = sum(blended.values())
    blended = {k: v / tot for k, v in blended.items()}

    # Mercados derivados con la MISMA disciplina: se mezclan hacia el
    # mercado con el mismo peso w (total anclado al modelo).
    lh_r, la_r = round(lh, 3), round(la, 3)
    model_matrix = mlp.scoreline_matrix(lh_r, la_r, rho)
    mkt_lh, mkt_la = mlp.fit_market_lambdas(implied, rho, total=round(lh_r + la_r, 3))
    market_matrix = mlp.scoreline_matrix(mkt_lh, mkt_la, rho)
    margin = max(1.02, min(1.12, mlp.overround(fix["market_odds"])))
    dm, dk = mlp.derive_markets(model_matrix), mlp.derive_markets(market_matrix)
    derived = {
        mkt: {s: w * p + (1 - w) * dk[mkt][s] for s, p in sels.items()}
        for mkt, sels in dm.items()
    }
    tot_d = {m: sum(v.values()) for m, v in derived.items()}
    derived = {m: {s: v / tot_d[m] for s, v in sels.items()} for m, sels in derived.items()}
    markets = mlp.build_markets(derived, dk, margin)

    league = LEAGUES[fix["league_code"]]
    card = mlp.build_ml_card(
        id=f"live-{fix['league_code'].lower()}-{fix['starts_at'][:10]}-{_slug(fix['home'])}-vs-{_slug(fix['away'])}",
        league=league["display"],
        home=team_display(fix["home"]),
        away=team_display(fix["away"]),
        starts_at=fix["starts_at"],
        market_odds=fix["market_odds"],
        probs_model=blended,
        movement=fix["movement"],
        category=league["category"],
        home_short=team_short(fix["home"]),
        away_short=team_short(fix["away"]),
    )
    card["homeColor"] = team_color(fix["home"])
    card["awayColor"] = team_color(fix["away"])
    card["markets"] = markets
    # xG proyectado del partido (las λ de Dixon-Coles SON goles esperados).
    card["xg"] = {"home": round(lh, 2), "away": round(la, 2)}
    if warning:
        card["ml"]["warning"] = warning
        vb = card["ml"].get("valueBet")
        if vb and vb.get("confidence") == "alta":
            vb["confidence"] = "moderada"
    return card


def get_upcoming_cards(
    data_dir: str = "data", limit: int = 50, category: str | None = None
) -> tuple[list[dict], dict]:
    """Partidos REALES de Hoy/Mañana + pricing ML. Cards en contrato lib/cbs.ts.

    Sin eventos en vivo (ni caché): cards = [] con provenance.error.
    Jamás se inventan cruces.
    """
    st = get_state(data_dir)
    ratings = get_ratings(data_dir)
    w_model = get_w_model(data_dir)
    events, live_info = live_odds.get_live_events(data_dir=data_dir)
    if category and category != "all":
        events = [e for e in events if e["category"] == category]
    cards: list[dict] = []
    for e in events[:limit]:
        fix = {
            "league_code": e["league_code"],
            "home": canonical(e["home"]),
            "away": canonical(e["away"]),
            "starts_at": e["starts_at"],
            "market_odds": e["market_odds"],
            "market_odds_source": (
                f"the-odds-api mediana {e['book_count']} casas: "
                + ", ".join(e["books"][:6])
            ),
            "movement": e["movement"],
            "book_count": e["book_count"],
        }
        cards.append(price_fixture(fix, st, ratings, w_model))
    prov = {
        **st.provenance,
        "data_mode": "live",
        "fixture_source": live_info.get("source"),
        "fixture_window": live_info.get("window"),
        "quota_remaining": live_info.get("quota_remaining"),
        "model": f"dixon-coles-mle(xg-proj)+shrinkage{w_model}+gap-guard{GAP_WARN}",
        "ratings_fitted_at": (ratings or {}).get("fitted_at"),
        "discrepancy_warnings": sum(1 for c in cards if (c.get("ml") or {}).get("warning")),
        "note": "Fixtures y triples 1X2 reales (The Odds API, mediana entre casas). "
        "Sin eventos: cards=[].",
    }
    if live_info.get("error"):
        prov["live_error"] = live_info["error"]
    return cards, prov
