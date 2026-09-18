"""CBS Sports · Backend de cuotas (FastAPI).

Expone los partidos procesados por el pipeline real:
  data/ (Football-Data.co.uk via ingest_football_data.py)
    -> features.py (Elo walk-forward + rolling + fatiga)
    -> upcoming.py (fixtures + triples Bet365 reales del histórico)
    -> ml_probability.py (Dixon-Coles + shrinkage + EV/Kelly)

en el contrato JSON que espera el frontend (lib/cbs.ts -> MatchOdds,
camelCase).

Endpoints:
  GET /health
  GET /api/v1/odds/upcoming?sport=futbol&limit=8&category=laliga
  GET /api/v1/predictions/value?min_ev_pct=5.0

Arranque:
  python -m uvicorn backend.main:app --port 8000 --reload
"""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Permite `from pipeline.ml_probability import ...` tanto con
# `uvicorn backend.main:app` como con `python -m uvicorn ...` desde la raíz.
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from pipeline.upcoming import get_state, get_upcoming_cards  # noqa: E402

DATA_DIR = str(ROOT / "data")

# ── Modelos Pydantic (contrato lib/cbs.ts, camelCase) ──────────────

Category = Literal["all", "laliga", "premier", "seriea", "bundesliga", "champions", "latam", "live"]


class Odds1X2(BaseModel):
    home: float
    draw: float
    away: float


class Probabilities(BaseModel):
    home: float
    draw: float
    away: float


class FairOdds(BaseModel):
    home: float
    draw: float
    away: float


class ValueBet(BaseModel):
    selection: Literal["home", "draw", "away"]
    expectedValuePct: float
    confidence: Literal["alta", "media", "moderada"]
    recommendedKellyStakePct: float


class MlPrediction(BaseModel):
    probabilities: Probabilities
    fairOdds: FairOdds
    valueBet: ValueBet | None = None
    warning: str | None = None


class Movement(BaseModel):
    home: Literal["up", "down", "flat"]
    draw: Literal["up", "down", "flat"]
    away: Literal["up", "down", "flat"]


class LiveScore(BaseModel):
    minute: int
    homeScore: int
    awayScore: int


class MarketSelection(BaseModel):
    odds: float
    prob: float
    fairOdds: float
    ev: float
    kelly: float


class BttsMarkets(BaseModel):
    yes: MarketSelection
    no: MarketSelection


class OverUnder25Markets(BaseModel):
    over: MarketSelection
    under: MarketSelection


class DoubleChanceMarkets(BaseModel):
    x1: MarketSelection = Field(alias="1X")
    x12: MarketSelection = Field(alias="12")
    x2: MarketSelection = Field(alias="X2")

    class Config:
        populate_by_name = True


class Markets(BaseModel):
    btts: BttsMarkets
    overUnder25: OverUnder25Markets
    doubleChance: DoubleChanceMarkets


class XgProjection(BaseModel):
    home: float
    away: float


class BacktestBet(BaseModel):
    id: str
    date: str
    match: str
    league: str
    selection: str
    odds: float
    prob: float
    ev: float
    result: str
    profit: float
    stake_kelly: float | None = None
    profit_kelly: float | None = None
    warned: bool | None = None
    clv: float | None = None


class StrategySummary(BaseModel):
    total_bets: int
    won: int
    lost: int
    win_rate_pct: float
    win_rate_expected_pct: float
    total_staked: float
    net_profit: float
    roi_pct: float
    avg_odds: float
    max_drawdown_pct: float


class BacktestResponse(BaseModel):
    params: dict
    summary: StrategySummary
    kelly: StrategySummary
    production: dict
    clv_mean_pct: float | None = None
    clv_n: int = 0
    by_league: dict[str, StrategySummary]
    by_odds: dict[str, StrategySummary]
    recent_bets: list[BacktestBet]
    equity: list[float] = []


class MatchOdds(BaseModel):
    id: str
    league: str
    category: Category
    home: str
    away: str
    homeShort: str
    awayShort: str
    homeColor: str | None = None
    awayColor: str | None = None
    startsAt: str
    live: LiveScore | None = None
    odds: Odds1X2
    movement: Movement | None = None
    ml: MlPrediction | None = None
    markets: Markets | None = None
    xg: XgProjection | None = None


class PaperBet(BaseModel):
    id: str
    match: str
    selection: str
    odds: float
    stake: float
    potential_profit: float | None = None
    starts_at: str | None = None
    status: str
    profit: float | None = None
    ev_pct: float | None = None
    confidence: str | None = None


class PaperSummary(BaseModel):
    bankroll: float
    initial_bankroll: float
    profit_net: float
    roi_pct: float
    total_bets: int
    won: int
    lost: int
    pending: int
    active_bets: list[dict]
    history: list[dict]


# ── App + CORS ─────────────────────────────────────────────────────

app = FastAPI(
    title="CBS Sports Odds API",
    version="0.1.0",
    description="Cuotas 1X2 + predicciones ML (pipeline/ml_probability.py) para la landing Next.js.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://app.p50sports.com",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ── Fuente viva: partidos REALES (The Odds API) + modelo histórico ──
# Sin fixtures estáticos ni cruces generados: cada request (con caché de
# 30s) se sirve de pipeline/upcoming.py, que combina los eventos reales
# de Hoy/Mañana (live_odds.py) con Elos walk-forward + forma + fatiga
# (features.py sobre data/).

# ── Caché en memoria (TTL 30s, como indica la skill para <2h) ──────
# TODO producción: migrar a Redis cache-aside con ex=30 (ver skill
# betting-backend-api §2: upcoming 300s/30s, live 3-5s, ML 60s).
# La fuente viva tiene su propio TTL largo (ODDS_TTL_S, default 6h) para
# cuidar la cuota gratuita de The Odds API (500 créd/mes).
_CACHE: dict[str, tuple[float, list[dict]]] = {}
_CACHE_PROV: dict = {}
CACHE_TTL_S = 30.0


def _all_processed() -> list[dict]:
    """Cards de partidos REALES (pipeline/upcoming.py + live_odds.py)."""
    now = time.monotonic()
    hit = _CACHE.get("upcoming")
    if hit and (now - hit[0]) < CACHE_TTL_S:
        return hit[1]
    cards, prov = get_upcoming_cards(data_dir=DATA_DIR, limit=50)
    _CACHE["upcoming"] = (now, cards)
    _CACHE_PROV.clear()
    _CACHE_PROV.update(prov)
    return cards


def _provenance() -> dict:
    if not _CACHE_PROV:
        _all_processed()
    return {"data_dir": DATA_DIR, **_CACHE_PROV}


# ── Endpoints ──────────────────────────────────────────────────────

@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "cbs-odds-api", **_provenance()}


@app.get("/")
def root() -> dict:
    return {
        "service": "cbs-odds-api",
        "docs": "/docs",
        "upcoming": "/api/v1/odds/upcoming?sport=futbol&limit=8",
    }


@app.get("/api/v1/odds/upcoming", response_model=list[MatchOdds])
def get_upcoming_odds(
    sport: str = Query(default="futbol", description="Deporte (solo futbol por ahora)"),
    limit: int = Query(default=8, ge=1, le=50),
    category: str | None = Query(default=None, description="all|laliga|premier|seriea|bundesliga"),
) -> list[dict]:
    """Partidos destacados con cuota 1X2 + análisis ML (EV/Kelly).

    `sport` se acepta por compatibilidad con el frontend
    (`/odds/upcoming?sport=futbol&limit=8`) y hoy solo sirve fútbol.
    """
    _ = sport  # reservado para multideporte futuro
    data = _all_processed()
    if category and category != "all":
        data = [m for m in data if m.get("category") == category]
    return data[:limit]


@app.get("/api/v1/predictions/value", response_model=list[MatchOdds])
def get_value_picks(
    min_ev_pct: float = Query(default=5.0, description="EV mínimo en %"),
    limit: int = Query(default=10, ge=1, le=50),
) -> list[dict]:
    """Solo oportunidades con EV > umbral en las próximas 48h (skill §3)."""
    picks = [
        m
        for m in _all_processed()
        if (m.get("ml") or {}).get("valueBet", {}).get("expectedValuePct", 0) >= min_ev_pct
    ]
    picks.sort(
        key=lambda m: m["ml"]["valueBet"]["expectedValuePct"],
        reverse=True,
    )
    return picks[:limit]


_BACKTEST_CACHE: dict = {}


def _load_backtest() -> dict:
    import json as _json

    path = f"{DATA_DIR}/backtest_results.json"
    mtime = os.path.getmtime(path)
    if _BACKTEST_CACHE.get("mtime") != mtime:
        with open(path, encoding="utf-8") as f:
            _BACKTEST_CACHE.clear()
            _BACKTEST_CACHE.update({"mtime": mtime, "data": _json.load(f)})
    return _BACKTEST_CACHE["data"]


@app.get("/api/v1/backtest/performance", response_model=BacktestResponse)
def backtest_performance() -> dict:
    """Track record walk-forward del modelo (apuestas Bet365, auditoría Pinnacle).

    Generar con: python -m pipeline.backtest --min-ev 3.0 --stake 100
    """
    try:
        res = _load_backtest()
    except OSError:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Sin backtest: ejecuta python -m pipeline.backtest")
    equity: list[float] = []
    run = 0.0
    for b in res.get("all_bets", []):
        run = round(run + b["profit"], 2)
        equity.append(run)
    return {**res, "equity": equity}


# ── Paper trading (simulación ficticia, sin dinero real) ─────────
# Cuenta virtual de 1000 USD en data/paper_trading.json. Flujo diario:
#   POST /paper-trading/place  -> simula apuestas de valor (PENDING)
#   POST /paper-trading/settle -> liquida con marcadores reales y
#      reinyecta partidos en data/ + refit Dixon-Coles (aprendizaje).


@app.get("/api/v1/paper-trading/summary", response_model=PaperSummary)
def paper_trading_summary() -> dict:
    """Estado de la simulación ficticia (bankroll virtual, P&L, pendientes)."""
    from pipeline.paper_trading import get_summary, load_state

    return get_summary(load_state(DATA_DIR))


@app.post("/api/v1/paper-trading/place")
def paper_trading_place(
    stake: float = Query(default=50.0, ge=1.0, le=500.0, description="Stake plano ficticio (USD virtuales)"),
    kelly: bool = Query(default=False, description="Usar Quarter-Kelly en vez de stake plano"),
    min_ev_pct: float = Query(default=3.0, description="EV mínimo en %"),
    max_bets: int = Query(default=5, ge=1, le=20),
    min_odds: float = Query(default=1.5, ge=1.01, description="Cuota mínima (evita megafavoritos sin valor)"),
    max_odds: float = Query(default=5.0, ge=1.5, description="Cuota máxima (evita loterías)"),
) -> dict:
    """Coloca las apuestas ficticias del día (solo saldo virtual)."""
    from pipeline.paper_trading import place_daily_bets

    return place_daily_bets(
        DATA_DIR,
        flat_stake=stake,
        stake_mode="kelly" if kelly else "flat",
        min_ev_pct=min_ev_pct,
        max_bets=max_bets,
        min_odds=min_odds,
        max_odds=max_odds,
    )


@app.post("/api/v1/paper-trading/settle")
def paper_trading_settle(
    days_from: int = Query(default=7, ge=1, le=14, description="Ventana de marcadores (días atrás)"),
) -> dict:
    """Liquida pendientes con marcadores reales y recalibra el modelo."""
    from pipeline.paper_trading import settle_and_learn

    return settle_and_learn(DATA_DIR, days_from=days_from)
