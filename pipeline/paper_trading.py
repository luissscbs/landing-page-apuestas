"""Paper trading: simulación ficticia en vivo con aprendizaje continuo.

Fase de 1 semana SIN dinero real. Saldo virtual en
``data/paper_trading.json``:

  - ``place_daily_bets``: toma los partidos reales de Hoy/Mañana
    (``upcoming.get_upcoming_cards`` = The Odds API + modelo
    Dixon-Coles MLE + shrinkage validado) y simula apuestas de valor
    (stake plano $50 o Quarter-Kelly) con estado ``PENDING``.
  - ``settle_and_learn``: consulta los marcadores finales reales
    (The Odds API scores), liquida ``WON``/``LOST``, ajusta el bankroll
    virtual y reinyecta cada partido en el histórico ``data/`` para
    recalibrar ratings con ``xg_ratings.fit_all`` (el modelo aprende de
    lo que acaba de suceder).

Solo stdlib. La clave de The Odds API nunca se loguea.

Uso:
  python -m pipeline.paper_trading --place [--stake 50] [--kelly]
  python -m pipeline.paper_trading --settle
  python -m pipeline.paper_trading --summary
  python -m pipeline.paper_trading --reset  # reinicia la cuenta virtual
"""
from __future__ import annotations

import argparse
import csv
import glob
import json
import os
from datetime import datetime, timezone

STATE_NAME = "paper_trading.json"
INITIAL_BANKROLL = 1000.0
CURRENCY = "USD"
DEFAULT_FLAT_STAKE = 50.0
DEFAULT_MIN_EV_PCT = 3.0
DEFAULT_MAX_BETS = 5
DEFAULT_MIN_ODDS = 1.50
DEFAULT_MAX_ODDS = 5.0

DISCLAIMER = (
    "Simulación ficticia con saldo virtual. Sin dinero real. "
    "Solo mayores de 18 años. Juego responsable."
)

_CONF_RANK = {"alta": 3, "media": 2, "moderada": 1}


# ── Estado ───────────────────────────────────────────────────────

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _state_path(data_dir: str) -> str:
    return os.path.join(data_dir, STATE_NAME)


def fresh_state() -> dict:
    return {
        "initial_bankroll": INITIAL_BANKROLL,
        "current_bankroll": INITIAL_BANKROLL,
        "currency": CURRENCY,
        "mode": "paper",
        "disclaimer": DISCLAIMER,
        "updated_at": _now_iso(),
        "active_bets": [],
        "settled_bets": [],
    }


def load_state(data_dir: str = "data") -> dict:
    """Carga la cuenta virtual; la inicializa con 1000 USD si no existe."""
    try:
        with open(_state_path(data_dir), encoding="utf-8") as f:
            st = json.load(f)
    except (OSError, ValueError):
        st = fresh_state()
        save_state(data_dir, st)
        return st
    st.setdefault("initial_bankroll", INITIAL_BANKROLL)
    st.setdefault("current_bankroll", INITIAL_BANKROLL)
    st.setdefault("active_bets", [])
    st.setdefault("settled_bets", [])
    st.setdefault("currency", CURRENCY)
    st.setdefault("mode", "paper")
    st.setdefault("disclaimer", DISCLAIMER)
    return st


def save_state(data_dir: str, state: dict) -> None:
    os.makedirs(data_dir, exist_ok=True)
    state["updated_at"] = _now_iso()
    tmp = _state_path(data_dir) + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)
    os.replace(tmp, _state_path(data_dir))


def reset_state(data_dir: str = "data") -> dict:
    st = fresh_state()
    save_state(data_dir, st)
    return st


# ── Resumen ──────────────────────────────────────────────────────

def get_summary(state: dict) -> dict:
    settled = state.get("settled_bets", [])
    active = state.get("active_bets", [])
    initial = float(state.get("initial_bankroll", INITIAL_BANKROLL))
    bankroll = float(state.get("current_bankroll", initial))
    won = sum(1 for b in settled if b.get("status") == "WON")
    lost = sum(1 for b in settled if b.get("status") == "LOST")
    total_staked = round(sum(float(b.get("stake", 0) or 0) for b in settled), 2)
    profit_net = round(bankroll - initial, 2)
    roi_pct = round(profit_net / total_staked * 100, 2) if total_staked > 0 else 0.0
    return {
        "bankroll": round(bankroll, 2),
        "initial_bankroll": round(initial, 2),
        "profit_net": profit_net,
        "roi_pct": roi_pct,
        "total_bets": len(settled),
        "won": won,
        "lost": lost,
        "pending": len(active),
        "total_staked": total_staked,
        "currency": state.get("currency", CURRENCY),
        "mode": "paper",
        "disclaimer": state.get("disclaimer", DISCLAIMER),
        "updated_at": state.get("updated_at"),
        "active_bets": active,
        "history": list(reversed(settled)),
    }


# ── Colocación diaria ────────────────────────────────────────────

def _stake_for(prob: float, odds: float, bankroll: float,
               stake_mode: str, flat_stake: float) -> float:
    from . import ml_probability as mlp

    if stake_mode == "kelly":
        frac = mlp.kelly_stake(prob, odds)  # Quarter-Kelly, tope 3%
        if frac <= 0:
            return 0.0
        return round(min(frac * bankroll, bankroll), 2)
    return round(min(float(flat_stake), bankroll), 2)


def place_daily_bets(
    data_dir: str = "data",
    flat_stake: float = DEFAULT_FLAT_STAKE,
    stake_mode: str = "flat",
    min_ev_pct: float = DEFAULT_MIN_EV_PCT,
    max_bets: int = DEFAULT_MAX_BETS,
    min_odds: float = DEFAULT_MIN_ODDS,
    max_odds: float = DEFAULT_MAX_ODDS,
    limit: int = 50,
    allow_fallback: bool = True,
) -> dict:
    """Simula las apuestas ficticias del día sobre eventos reales.

    Estrategia de valor: solo cards con ``ml.valueBet`` y EV >= umbral,
    ordenadas por confianza (alta>media>moderada) y EV; se descartan
    cuotas extremas (>max_odds) y partidos ya apostados (activos o
    liquidados). Stake plano ($50/$100) o Quarter-Kelly sobre el
    bankroll virtual. No mueve el bankroll al colocar: el P&L se
    realiza en ``settle_and_learn``.

    El blend productivo vive pegado al consenso y muchos días no hay
    +EV (así debe ser). Con ``allow_fallback=True`` esos días se simula
    igualmente la mejor oportunidad disponible (mayor confianza /
    cuota moderada-favorita) marcada con ``fallback=True`` para que la
    fase de 1 semana tenga actividad diaria auditable.
    """
    from . import ml_probability as mlp
    from .upcoming import get_upcoming_cards

    state = load_state(data_dir)
    bankroll = float(state.get("current_bankroll", INITIAL_BANKROLL))
    if bankroll <= 0:
        return {"new_bets": [], "skipped": "bankroll agotado", "summary": get_summary(state)}

    known_ids = {b.get("card_id") for b in state["active_bets"]} | {
        b.get("card_id") for b in state["settled_bets"]
    }
    cards, prov = get_upcoming_cards(data_dir=data_dir, limit=limit)

    cands: list[dict] = []
    fallback_used = False
    for c in cards:
        ml = c.get("ml") or {}
        vb = ml.get("valueBet")
        if not vb:
            continue
        if vb.get("expectedValuePct", 0) < min_ev_pct:
            continue
        if c.get("id") in known_ids:
            continue
        sel = vb.get("selection")
        try:
            odds = float(c["odds"][sel])
        except (KeyError, TypeError, ValueError):
            continue
        if odds < min_odds or odds > max_odds:
            continue
        probs = ml.get("probabilities", {})
        try:
            prob = float(probs[sel])
        except (KeyError, TypeError, ValueError):
            continue
        cands.append((c, {"selection": sel,
                          "expectedValuePct": vb.get("expectedValuePct"),
                          "confidence": vb.get("confidence", "moderada"),
                          "recommendedKellyStakePct": vb.get("recommendedKellyStakePct")},
                      sel, odds, prob, False))

    # Fallback: mejor confianza disponible aunque no haya +EV sobre el umbral.
    if not cands and allow_fallback:
        fb: list[tuple] = []
        for c in cards:
            if c.get("id") in known_ids:
                continue
            ml = c.get("ml") or {}
            probs = ml.get("probabilities") or {}
            if not all(k in probs for k in ("home", "draw", "away")):
                continue
            # Selección de mayor probabilidad (favorita/confianza) con cuota moderada.
            sel = max(("home", "draw", "away"), key=lambda k: float(probs[k] or 0))
            try:
                odds = float(c["odds"][sel])
                prob = float(probs[sel])
            except (KeyError, TypeError, ValueError):
                continue
            if odds < min_odds or odds > max_odds:
                continue
            ev_pct = round((prob * odds - 1.0) * 100, 2)
            fb.append((c, {"selection": sel, "expectedValuePct": ev_pct,
                           "confidence": mlp.confidence_for(prob, ev_pct),
                           "recommendedKellyStakePct": round(
                               mlp.kelly_stake(prob, odds) * 100, 2)},
                       sel, odds, prob, True))
        fb.sort(key=lambda t: (bool((t[0].get("ml") or {}).get("warning")),
                               -_CONF_RANK.get(t[1]["confidence"], 1), -t[4]))
        cands = fb
        fallback_used = bool(fb)

    # Confianza primero, EV después; avisos de discrepancia al fondo.
    def _key(t: tuple) -> tuple:
        c, vb, _sel, _odds, _prob, _fb = t
        warned = bool((c.get("ml") or {}).get("warning"))
        return (warned, -_CONF_RANK.get(vb.get("confidence", "moderada"), 1),
                -vb.get("expectedValuePct", 0))

    cands.sort(key=_key)

    today = _now_iso()[:10]
    new_bets: list[dict] = []
    for c, vb, sel, odds, prob, is_fb in cands[:max(0, max_bets)]:
        stake = _stake_for(prob, odds, bankroll, stake_mode, flat_stake)
        if stake < 1.0:
            continue
        from .teams import canonical

        home_d, away_d = c.get("home", "?"), c.get("away", "?")
        bet = {
            "id": f"paper-{today}-{c.get('id', 'evt')}",
            "card_id": c.get("id"),
            "match": f"{home_d} vs {away_d}",
            "league": c.get("league"),
            "league_code": _league_code_hint(c),
            "home": home_d,
            "away": away_d,
            "home_canonical": canonical(home_d),
            "away_canonical": canonical(away_d),
            "selection": sel,
            "odds": round(odds, 2),
            "prob": round(prob, 3),
            "ev_pct": vb.get("expectedValuePct"),
            "confidence": vb.get("confidence"),
            "fair_odds": (ml_fair(c, sel)),
            "stake": stake,
            "stake_mode": stake_mode,
            "fallback": bool(is_fb),
            "potential_profit": round(stake * (odds - 1.0), 2),
            "starts_at": c.get("startsAt"),
            "placed_at": _now_iso(),
            "status": "PENDING",
        }
        state["active_bets"].append(bet)
        known_ids.add(c.get("id"))
        new_bets.append(bet)

    save_state(data_dir, state)
    out = {"new_bets": new_bets, "fallback_used": fallback_used,
           "summary": get_summary(state),
           "provenance": {k: prov.get(k) for k in
                          ("data_mode", "fixture_source", "fixture_window") if k in prov}}
    return out


def ml_fair(card: dict, selection: str) -> float | None:
    try:
        return float((card.get("ml") or {}).get("fairOdds", {}).get(selection))
    except (TypeError, ValueError):
        return None


def _league_code_hint(card: dict) -> str | None:
    cat = (card.get("category") or "").lower()
    mapping = {"laliga": "SP1", "premier": "E0", "seriea": "SA", "bundesliga": "GB"}
    if cat in mapping:
        return mapping[cat]
    lid = str(card.get("id") or "")
    for code in ("sp1", "e0", "sa", "gb"):
        if f"-{code}-" in lid.lower():
            return code.upper()
    return None


# ── Liquidación + aprendizaje ────────────────────────────────────

def _season_for_date(dt: datetime) -> str:
    y, m = dt.year, dt.month
    if m >= 8:
        return f"{y % 100:02d}{(y + 1) % 100:02d}"
    return f"{(y - 1) % 100:02d}{y % 100:02d}"


def _parse_dt(iso: str) -> datetime:
    return datetime.fromisoformat(str(iso).replace("Z", "+00:00"))


def fetch_completed_scores(data_dir: str = "data", days_from: int = 7) -> tuple[list[dict], dict]:
    """Marcadores finales reales (The Odds API scores, coste ~1 créd/liga).

    Devuelve (partidos_finalizados, info). Sin clave ni red: ([], info
    con error); las apuestas pendientes quedan pendientes.
    """
    from .config import THE_ODDS_API_KEY
    from .live_odds import SPORTS, _get_json

    info: dict = {"days_from": days_from}
    if not THE_ODDS_API_KEY:
        info["error"] = "Sin THE_ODDS_API_KEY: define la clave en .env.local"
        return [], info
    done: list[dict] = []
    try:
        for sport in SPORTS:
            body, _h = _get_json(
                f"/sports/{sport}/scores",
                {"daysFrom": str(days_from), "dateFormat": "iso"},
                THE_ODDS_API_KEY,
            )
            if not isinstance(body, list):
                continue
            for g in body:
                if not g.get("completed"):
                    continue
                scores = {s.get("name"): s.get("score") for s in g.get("scores") or []}
                hs = scores.get(g.get("home_team"))
                aws = scores.get(g.get("away_team"))
                if hs is None or aws is None:
                    continue
                try:
                    done.append({
                        "sport": sport,
                        "league_code": SPORTS[sport]["league_code"],
                        "home_team": g.get("home_team"),
                        "away_team": g.get("away_team"),
                        "home_score": int(hs),
                        "away_score": int(aws),
                        "commence_time": g.get("commence_time"),
                        "completed": True,
                    })
                except (TypeError, ValueError):
                    continue
    except Exception as e:  # LiveOddsError o red: no inventar resultados
        info["error"] = str(e)
        return done, info
    info["completed"] = len(done)
    return done, info


def _outcome_of(home_score: int, away_score: int) -> str:
    if home_score > away_score:
        return "home"
    if home_score < away_score:
        return "away"
    return "draw"


def _find_score(bet: dict, scores: list[dict]) -> dict | None:
    """Empareja apuesta con marcador por equipos canónicos + fecha cercana."""
    from .teams import canonical

    bh, ba = canonical(bet.get("home_canonical") or bet.get("home", "")), \
        canonical(bet.get("away_canonical") or bet.get("away", ""))
    best: dict | None = None
    best_gap: float | None = None
    try:
        bt = _parse_dt(bet.get("starts_at"))
    except (TypeError, ValueError):
        bt = None
    for s in scores:
        if canonical(s.get("home_team", "")) != bh or canonical(s.get("away_team", "")) != ba:
            continue
        if bt and s.get("commence_time"):
            try:
                gap = abs((_parse_dt(s["commence_time"]) - bt).total_seconds())
                if gap > 3 * 86400:
                    continue
            except ValueError:
                gap = 0.0
        else:
            gap = 0.0
        if best is None or (best_gap is not None and gap < best_gap):
            best, best_gap = s, gap
    return best


def _append_to_history(data_dir: str, league: str, home_c: str, away_c: str,
                       hs: int, aws: int, commence_iso: str | None) -> dict:
    """Registra el partido recién jugado en data/matches_*.csv (sin duplicar)."""
    from .teams import match_id

    try:
        dt = _parse_dt(commence_iso) if commence_iso else datetime.now(timezone.utc)
    except ValueError:
        dt = datetime.now(timezone.utc)
    season = _season_for_date(dt)
    mid = match_id(league, season, dt.date().isoformat(), home_c, away_c)
    path = os.path.join(data_dir, f"matches_{league}_{season}.csv")
    existing: set[str] = set()
    if os.path.exists(path):
        with open(path, encoding="utf-8", newline="") as f:
            for row in csv.DictReader(f):
                existing.add(row.get("id", ""))
    if mid in existing:
        return {"appended": False, "match_id": mid, "path": path}
    is_new = not os.path.exists(path)
    with open(path, "a", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        if is_new:
            w.writerow(["id", "league", "season", "match_date", "home_team_id",
                        "away_team_id", "home_score", "away_score", "status"])
        w.writerow([mid, league, season, dt.isoformat().replace("+00:00", "Z"),
                    home_c, away_c, hs, aws, "FINISHED"])
    return {"appended": True, "match_id": mid, "path": path}


def settle_and_learn(
    data_dir: str = "data",
    days_from: int = 7,
    scores_override: list[dict] | None = None,
) -> dict:
    """Liquida apuestas pendientes con marcadores reales y recalibra el modelo.

    1. Busca cada apuesta PENDING en los partidos finalizados.
    2. ``WON`` → bankroll += stake*(odds-1); ``LOST`` → bankroll -= stake.
    3. Añade el partido a ``data/matches_*.csv`` (histórico).
    4. Llama a ``xg_ratings.fit_all`` para recalibrar ataques/defensas.
    """
    state = load_state(data_dir)
    active = state.get("active_bets", [])
    if not active:
        return {"settled": [], "still_pending": 0, "learning": None,
                "summary": get_summary(state)}

    if scores_override is not None:
        scores, info = scores_override, {"source": "override"}
    else:
        scores, info = fetch_completed_scores(data_dir, days_from)

    settled_now: list[dict] = []
    learned: list[dict] = []
    remaining: list[dict] = []
    for bet in active:
        sc = _find_score(bet, scores)
        if not sc:
            remaining.append(bet)
            continue
        outcome = _outcome_of(sc["home_score"], sc["away_score"])
        won = outcome == bet.get("selection")
        stake = float(bet.get("stake", 0) or 0)
        odds = float(bet.get("odds", 1) or 1)
        profit = round(stake * (odds - 1.0), 2) if won else round(-stake, 2)
        state["current_bankroll"] = round(float(state["current_bankroll"]) + profit, 2)
        bet.update({
            "status": "WON" if won else "LOST",
            "profit": profit,
            "result_score": f"{sc['home_score']}-{sc['away_score']}",
            "home_score": sc["home_score"],
            "away_score": sc["away_score"],
            "actual_outcome": outcome,
            "settled_at": _now_iso(),
        })
        state["settled_bets"].append(bet)
        settled_now.append(bet)
        lg = bet.get("league_code") or sc.get("league_code")
        if lg:
            try:
                learned.append(_append_to_history(
                    data_dir, lg, bet.get("home_canonical") or sc["home_team"],
                    bet.get("away_canonical") or sc["away_team"],
                    sc["home_score"], sc["away_score"], sc.get("commence_time")))
            except OSError as e:
                learned.append({"appended": False, "error": str(e)})
    state["active_bets"] = remaining

    learning: dict | None = None
    if learned and any(l.get("appended") for l in learned):
        learning = {"history_appends": learned}
        try:
            from .upcoming import _CAL_CACHE, _RATINGS_CACHE, _STATE_CACHE
            from .xg_ratings import fit_all

            fit = fit_all(data_dir)
            _STATE_CACHE.clear()
            _RATINGS_CACHE.clear()
            _CAL_CACHE.clear()
            learning["refit"] = {
                k: {"method": v.get("method"), "n_matches": v.get("n_matches"),
                    "fit_seconds": v.get("fit_seconds")}
                for k, v in fit.get("leagues", {}).items()
            }
            learning["fitted_at"] = fit.get("fitted_at")
        except Exception as e:  # el P&L ya está guardado; el refit es best-effort
            learning["refit_error"] = str(e)
    elif settled_now:
        learning = {"history_appends": learned,
                    "note": "sin partidos nuevos en el histórico; sin refit"}

    save_state(data_dir, state)
    return {"settled": settled_now, "still_pending": len(remaining),
            "scores_info": info, "learning": learning,
            "summary": get_summary(state)}


# ── CLI ──────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser(description="Paper trading ficticio (sin dinero real)")
    ap.add_argument("--data", default="data")
    ap.add_argument("--place", action="store_true", help="colocar apuestas ficticias del día")
    ap.add_argument("--settle", action="store_true", help="liquidar y reaprender")
    ap.add_argument("--summary", action="store_true", help="mostrar resumen")
    ap.add_argument("--reset", action="store_true", help="reiniciar cuenta virtual a $1000")
    ap.add_argument("--stake", type=float, default=DEFAULT_FLAT_STAKE)
    ap.add_argument("--kelly", action="store_true", help="stake Quarter-Kelly en vez de plano")
    ap.add_argument("--min-ev", type=float, default=DEFAULT_MIN_EV_PCT)
    ap.add_argument("--max-bets", type=int, default=DEFAULT_MAX_BETS)
    ap.add_argument("--min-odds", type=float, default=DEFAULT_MIN_ODDS)
    ap.add_argument("--max-odds", type=float, default=DEFAULT_MAX_ODDS)
    a = ap.parse_args()

    if a.reset:
        st = reset_state(a.data)
        print(json.dumps(get_summary(st), indent=2, ensure_ascii=False))
        return
    if a.place:
        out = place_daily_bets(a.data, flat_stake=a.stake,
                               stake_mode="kelly" if a.kelly else "flat",
                               min_ev_pct=a.min_ev, max_bets=a.max_bets,
                               min_odds=a.min_odds, max_odds=a.max_odds)
        print(json.dumps(out, indent=2, ensure_ascii=False))
        return
    if a.settle:
        print(json.dumps(settle_and_learn(a.data), indent=2, ensure_ascii=False))
        return
    # --summary o sin flags
    print(json.dumps(get_summary(load_state(a.data)), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
