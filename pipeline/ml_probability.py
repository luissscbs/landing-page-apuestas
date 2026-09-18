"""sports-ml-probability: vig removal + Dixon-Coles baseline + EV/Kelly.

Puro stdlib (math). Sin sklearn/LightGBM aquí: este módulo es el baseline
probabilístico que alimenta el contrato JSON del frontend (lib/cbs.ts).

Contrato frontend (MatchOdds.ml):
  ml: {
    probabilities: {home, draw, away},   # suman 1.0
    fairOdds: {home, draw, away},        # 1/p redondeado 2 dec
    valueBet?: {selection, expectedValuePct, confidence, recommendedKellyStakePct}
  }
confidence: "alta" | "media" | "moderada" (ver confidence_for()).
"""
from __future__ import annotations

import argparse
import json
import math

# ── 1. Vig removal ──────────────────────────────────────────

def overround(odds: dict[str, float]) -> float:
    return sum(1.0 / o for o in odds.values() if o and o > 0)


def remove_vig_proportional(odds: dict[str, float]) -> dict[str, float]:
    inv = {k: 1.0 / v for k, v in odds.items()}
    tot = sum(inv.values())
    return {k: v / tot for k, v in inv.items()}


def remove_vig_power(odds: dict[str, float], tol: float = 1e-9) -> dict[str, float]:
    """Power method: resolver k tal que sum((1/odds)^k) = 1. Recomendado por defecto."""
    inv = {k: 1.0 / v for k, v in odds.items()}
    if sum(inv.values()) <= 1.0:
        return remove_vig_proportional(odds)
    lo, hi = 1.0, 10.0
    for _ in range(100):
        mid = (lo + hi) / 2
        s = sum(v**mid for v in inv.values())
        if abs(s - 1.0) < tol:
            break
        if s > 1.0:
            lo = mid
        else:
            hi = mid
    k = (lo + hi) / 2
    powered = {kk: vv**k for kk, vv in inv.items()}
    tot = sum(powered.values())
    return {kk: vv / tot for kk, vv in powered.items()}


def _shin_probs(inv: dict[str, float], z: float) -> dict[str, float]:
    s = sum(inv.values())
    out: dict[str, float] = {}
    for kk, pi in inv.items():
        num = math.sqrt(z * z + 4 * (1 - z) * (pi * pi / s)) - z
        out[kk] = num / (2 * (1 - z)) if z < 1 else pi / s
    return out


def remove_vig_shin(odds: dict[str, float]) -> dict[str, float]:
    """Método Shin: estima z (fracción insider) por bisección sobre sum(p)=1."""
    inv = {k: 1.0 / v for k, v in odds.items()}
    if sum(inv.values()) <= 1.0:
        return remove_vig_proportional(odds)
    lo, hi = 0.0, 0.99
    for _ in range(60):
        mid = (lo + hi) / 2
        s = sum(_shin_probs(inv, mid).values())
        # a mayor z, menor suma típicamente → buscar s≈1
        if s > 1.0:
            lo = mid
        else:
            hi = mid
    probs = _shin_probs(inv, (lo + hi) / 2)
    tot = sum(probs.values())
    return {k: v / tot for k, v in probs.items()}


def remove_vig(odds: dict[str, float], method: str = "power") -> dict[str, float]:
    m = method.lower()
    if m in ("proportional", "basic"):
        return remove_vig_proportional(odds)
    if m == "shin":
        return remove_vig_shin(odds)
    return remove_vig_power(odds)


# ── 2. Dixon-Coles baseline ─────────────────────────────────

def poisson_pmf(lam: float, k: int) -> float:
    return math.exp(-lam) * (lam**k) / math.factorial(k)


def tau_correction(lam: float, mu: float, rho: float, x: int, y: int) -> float:
    if x == 0 and y == 0:
        return 1 - lam * mu * rho
    if x == 0 and y == 1:
        return 1 + lam * rho
    if x == 1 and y == 0:
        return 1 + mu * rho
    if x == 1 and y == 1:
        return 1 - rho
    return 1.0


def predict_1x2(
    lambda_home: float, lambda_away: float, rho: float = -0.12, max_goals: int = 10
) -> dict[str, float]:
    """Matriz Poisson 0..max_goals con ajuste tau en marcadores bajos."""
    ph = [poisson_pmf(lambda_home, i) for i in range(max_goals + 1)]
    pa = [poisson_pmf(lambda_away, j) for j in range(max_goals + 1)]
    home = draw = away = 0.0
    for x in range(max_goals + 1):
        for y in range(max_goals + 1):
            p = ph[x] * pa[y] * tau_correction(lambda_home, lambda_away, rho, x, y)
            if x > y:
                home += p
            elif x == y:
                draw += p
            else:
                away += p
    tot = home + draw + away
    return {"home": home / tot, "draw": draw / tot, "away": away / tot}


def lambdas_from_elo(
    elo_home: float,
    elo_away: float,
    base_home: float = 1.45,
    base_away: float = 1.15,
) -> tuple[float, float]:
    """Convierte diferencia Elo (+65 local) en supremacía de goles.

    100 pts ≈ 0.5 goles. Recorta a [0.2, 4.0] para Poisson estable.
    """
    diff = (elo_home + 65.0) - elo_away
    supremacy = diff / 200.0
    lh = min(4.0, max(0.2, base_home + supremacy / 2))
    la = min(4.0, max(0.2, base_away - supremacy / 2))
    return (round(lh, 3), round(la, 3))


# ── 3. EV + Kelly ───────────────────────────────────────────

def expected_value(prob: float, odds: float) -> float:
    """EV en tanto por uno: p*cuota - 1. >0 implica +EV."""
    return prob * odds - 1.0


def kelly_stake(prob: float, odds: float, fraction: float = 0.25, cap: float = 0.03) -> float:
    """Quarter-Kelly por defecto, tope 3% bankroll. Devuelve fracción 0..cap."""
    b = odds - 1.0
    if b <= 0 or prob <= 0:
        return 0.0
    q = 1.0 - prob
    f_full = (b * prob - q) / b
    if f_full <= 0:
        return 0.0
    return round(min(f_full * fraction, cap), 4)


def confidence_for(prob: float, ev_pct: float) -> str:
    """Mapeo a lib/cbs.ts: 'alta' | 'media' | 'moderada'."""
    if ev_pct >= 7.0 or (ev_pct >= 5.0 and prob >= 0.50):
        return "alta"
    if ev_pct >= 3.0:
        return "media"
    return "moderada"


def best_value(
    probs: dict[str, float], market_odds: dict[str, float]
) -> dict | None:
    """Selección con mayor EV. None si ningún EV > 0."""
    best, best_ev = None, 0.0
    for k in ("home", "draw", "away"):
        if k not in probs or k not in market_odds:
            continue
        ev = expected_value(probs[k], market_odds[k])
        if ev > best_ev:
            best, best_ev = k, ev
    if best is None:
        return None
    ev_pct = round(best_ev * 100, 2)
    return {
        "selection": best,
        "expectedValuePct": ev_pct,
        "confidence": confidence_for(probs[best], ev_pct),
        "recommendedKellyStakePct": round(
            kelly_stake(probs[best], market_odds[best]) * 100, 2
        ),
    }


# ── 4. Contrato JSON para lib/cbs.ts ────────────────────────

def fair_odds(probs: dict[str, float]) -> dict[str, float]:
    return {k: round(1.0 / v, 2) if v > 0 else 0.0 for k, v in probs.items()}


def build_ml_card(
    id: str,
    league: str,
    home: str,
    away: str,
    starts_at: str,
    market_odds: dict[str, float],
    probs_model: dict[str, float] | None = None,
    *,
    lambda_home: float | None = None,
    lambda_away: float | None = None,
    rho: float = -0.12,
    movement: dict[str, str] | None = None,
    category: str = "all",
    home_short: str = "",
    away_short: str = "",
) -> dict:
    """Arma el objeto MatchOdds con ml anidado, listo para getUpcomingOdds()."""
    if probs_model is None:
        if lambda_home is None or lambda_away is None:
            raise ValueError("probs_model o (lambda_home, lambda_away) requerido")
        probs_model = predict_1x2(lambda_home, lambda_away, rho)
    tot = sum(probs_model.values())
    probs = {k: round(v / tot, 3) for k, v in probs_model.items()}
    card: dict = {
        "id": id,
        "league": league,
        "category": category,
        "home": home,
        "away": away,
        "homeShort": home_short or home[:3].upper(),
        "awayShort": away_short or away[:3].upper(),
        "startsAt": starts_at,
        "odds": {k: round(float(market_odds[k]), 2) for k in ("home", "draw", "away")},
        "ml": {
            "probabilities": probs,
            "fairOdds": fair_odds(probs),
        },
    }
    if movement:
        card["movement"] = movement
    vb = best_value(probs, market_odds)
    if vb:
        card["ml"]["valueBet"] = vb
    return card


def demo_rm_bar() -> dict:
    """Ejemplo de alineación: rm-bar con EV ≈ +10% como pide el frontend."""
    probs = {"home": 0.512, "draw": 0.268, "away": 0.220}
    return build_ml_card(
        id="rm-bar",
        league="LaLiga · España",
        home="Real Madrid",
        away="FC Barcelona",
        starts_at="2026-09-20T19:00:00Z",
        market_odds={"home": 2.15, "draw": 3.40, "away": 3.10},
        probs_model=probs,
        movement={"home": "down", "draw": "flat", "away": "up"},
        category="laliga",
        home_short="RMA",
        away_short="FCB",
    )


def main() -> None:
    ap = argparse.ArgumentParser(description="Demo sports-ml-probability")
    ap.add_argument("--demo", action="store_true", help="Imprime card rm-bar")
    ap.add_argument("--method", default="power", help="proportional|power|shin")
    ap.add_argument("--odds-home", type=float, default=2.15)
    ap.add_argument("--odds-draw", type=float, default=3.40)
    ap.add_argument("--odds-away", type=float, default=3.10)
    ap.add_argument("--lambda-home", type=float, default=1.65)
    ap.add_argument("--lambda-away", type=float, default=1.20)
    a = ap.parse_args()

    if a.demo:
        print(json.dumps(demo_rm_bar(), indent=2, ensure_ascii=False))
        return

    odds = {"home": a.odds_home, "draw": a.odds_draw, "away": a.odds_away}
    print(f"overround={overround(odds):.4f}")
    print(json.dumps(remove_vig(odds, a.method), indent=2))
    print(
        json.dumps(
            predict_1x2(a.lambda_home, a.lambda_away), indent=2
        )
    )


if __name__ == "__main__":
    main()
