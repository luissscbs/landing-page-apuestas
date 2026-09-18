"""Ratings ofensivos/defensivos estilo Dixon-Coles con MLE real (scipy).

Sustituye el heurístico Elo+65: las tasas de gol λ se estiman por máxima
verosimilitud Poisson con corrección tau de Dixon-Coles sobre el
histórico de goles (2379 partidos), con decaimiento temporal
exponencial (half-life 270 días) y ventaja de local AJUSTADA, no fija.

Modelo por liga:
  log λ_h = mu + att[home] + def[away] + home_adv
  log λ_a = mu + att[away] + def[home]
  P(x,y) = Poisson(x|λ_h)·Poisson(y|λ_a)·tau(x,y; rho)

Se guarda en data/team_ratings.json. Sin scipy → fallback a ratios
ponderados (documentado en provenance).
"""
from __future__ import annotations

import json
import math
import os
import time
from datetime import datetime, timezone

RATINGS_NAME = "team_ratings.json"
HALF_LIFE_DAYS = 270.0


def _parse_dt(iso: str) -> datetime:
    return datetime.fromisoformat(iso.replace("Z", "+00:00"))


def _sigmoid_weights(days_ago: "list[float]") -> "list[float]":
    import numpy as np

    d = np.asarray(days_ago, dtype=float)
    return list(np.exp(-math.log(2.0) / HALF_LIFE_DAYS * d))


def _weighted_ratios(matches: list[dict]) -> dict:
    """Fallback sin scipy: ataque/defensa como ratios ponderados."""
    import numpy as np

    teams = sorted({m["home_team_id"] for m in matches} | {m["away_team_id"] for m in matches})
    idx = {t: i for i, t in enumerate(teams)}
    last = max(_parse_dt(m["match_date"]) for m in matches)
    w = np.array(_sigmoid_weights([(last - _parse_dt(m["match_date"])).days for m in matches]))
    scored = {t: [0.0, 0.0] for t in teams}   # [a favor, en contra] ponderado
    weights = {t: [0.0, 0.0] for t in teams}
    lg_h = lg_a = wt = 0.0
    for m, wi in zip(matches, w):
        h, a, hs, aws = m["home_team_id"], m["away_team_id"], m["home_score"], m["away_score"]
        if hs is None:
            continue
        scored[h][0] += wi * hs
        scored[h][1] += wi * aws
        scored[a][0] += wi * aws
        scored[a][1] += wi * hs
        weights[h][0] += wi
        weights[h][1] += wi
        weights[a][0] += wi
        weights[a][1] += wi
        lg_h += wi * hs
        lg_a += wi * aws
        wt += wi
    lg_h /= wt
    lg_a /= wt
    mu = math.log((lg_h + lg_a) / 2)
    home_adv = math.log(lg_h / lg_a) / 2 if lg_a > 0 else 0.25
    out_teams: dict[str, dict[str, float]] = {}
    for t in teams:
        att = (scored[t][0] / weights[t][0] / ((lg_h + lg_a) / 2) - 1.0) if weights[t][0] else 0.0
        dfn = (scored[t][1] / weights[t][1] / ((lg_h + lg_a) / 2) - 1.0) if weights[t][1] else 0.0
        # Misma escala logarítmica que el MLE: exp(mu + att + def + home).
        out_teams[t] = {
            "attack": round(float(math.log(max(0.2, 1.0 + att))), 4),
            "defense": round(float(math.log(max(0.2, 1.0 + dfn))), 4),
        }
    return {
        "mu": round(mu, 4), "home_adv": round(float(home_adv), 4), "rho": -0.12,
        "method": "weighted-ratios", "teams": out_teams,
        "league_avg_home": round(lg_h, 3), "league_avg_away": round(lg_a, 3),
    }


def fit_league(matches: list[dict]) -> dict:
    """MLE Dixon-Coles por liga. matches: FINISHED con home/away scores."""
    import numpy as np
    from scipy.optimize import minimize
    from scipy.special import gammaln

    ms = [m for m in matches if m.get("home_score") is not None and m.get("away_score") is not None]
    teams = sorted({m["home_team_id"] for m in ms} | {m["away_team_id"] for m in ms})
    idx = {t: i for i, t in enumerate(teams)}
    n = len(teams)
    last = max(_parse_dt(m["match_date"]) for m in ms)
    hi = np.array([idx[m["home_team_id"]] for m in ms])
    ai = np.array([idx[m["away_team_id"]] for m in ms])
    hs = np.array([m["home_score"] for m in ms], dtype=float)
    aws = np.array([m["away_score"] for m in ms], dtype=float)
    w = np.array(_sigmoid_weights([(last - _parse_dt(m["match_date"])).days for m in ms]))
    lg_h = float(np.average(hs, weights=w))
    lg_a = float(np.average(aws, weights=w))

    def expand(x: "np.ndarray") -> tuple[float, float, float, "np.ndarray", "np.ndarray"]:
        # Restricción dura mean(att)=mean(dfn)=0 parametrizando n-1 equipos.
        mu, home, rho = float(x[0]), float(x[1]), float(x[2])
        a_free, b_free = x[3:3 + n - 1], x[3 + n - 1:]
        att = np.append(a_free, -np.sum(a_free))
        dfn = np.append(b_free, -np.sum(b_free))
        return mu, home, rho, att, dfn

    def nll(x: "np.ndarray") -> float:
        mu, home, rho, att, dfn = expand(x)
        lh = np.exp(mu + att[hi] + dfn[ai] + home)
        la = np.exp(mu + att[ai] + dfn[hi])
        ll = hs * np.log(lh) - lh - gammaln(hs + 1) + aws * np.log(la) - la - gammaln(aws + 1)
        m00 = (hs == 0) & (aws == 0)
        m01 = (hs == 0) & (aws == 1)
        m10 = (hs == 1) & (aws == 0)
        m11 = (hs == 1) & (aws == 1)
        ll = ll + m00 * np.log(np.maximum(1 - lh * la * rho, 1e-9))
        ll = ll + m01 * np.log(np.maximum(1 + lh * rho, 1e-9))
        ll = ll + m10 * np.log(np.maximum(1 + la * rho, 1e-9))
        ll = ll + m11 * np.log(np.maximum(1 - rho, 1e-9))
        return float(-np.sum(w * ll))

    x0 = np.zeros(3 + 2 * (n - 1))
    x0[0] = math.log((lg_h + lg_a) / 2)
    x0[1] = math.log(lg_h / lg_a) / 2 if lg_a > 0 else 0.25
    x0[2] = -0.10
    bounds = [(None, None), (0.0, 0.8), (-0.3, 0.1)] + [(-1.2, 1.2)] * (2 * (n - 1))
    res = minimize(nll, x0, method="L-BFGS-B", bounds=bounds, options={"maxiter": 800})
    if not res.success:
        fb = _weighted_ratios(ms)
        fb["method"] += f"+mle-fallback({res.message})"
        fb.update({"n_matches": len(ms), "n_teams": n})
        return fb
    mu, home, rho, att, dfn = expand(res.x)
    return {
        "mu": round(mu, 4), "home_adv": round(home, 4), "rho": round(rho, 4),
        "method": "dixon-coles-mle", "n_matches": len(ms), "n_teams": n,
        "neg_loglik": round(float(res.fun), 2),
        "league_avg_home": round(lg_h, 3), "league_avg_away": round(lg_a, 3),
        "teams": {t: {"attack": round(float(att[idx[t]]), 4), "defense": round(float(dfn[idx[t]]), 4)} for t in teams},
    }


def fit_all(data_dir: str = "data", leagues: tuple[str, ...] = ("SP1", "E0")) -> dict:
    """Ajusta por liga desde matches_*.csv y guarda team_ratings.json."""
    from .upcoming import load_history

    matches = load_history(data_dir)
    out: dict = {
        "fitted_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "half_life_days": HALF_LIFE_DAYS,
        "leagues": {},
    }
    for lg in leagues:
        ms = [m for m in matches if m["league"] == lg]
        t0 = time.time()
        try:
            fit = fit_league(ms)
        except ImportError:
            fit = _weighted_ratios(ms)
        fit["fit_seconds"] = round(time.time() - t0, 1)
        out["leagues"][lg] = fit
    os.makedirs(data_dir, exist_ok=True)
    with open(os.path.join(data_dir, RATINGS_NAME), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)
    return out


def load_ratings(data_dir: str = "data") -> dict:
    with open(os.path.join(data_dir, RATINGS_NAME), encoding="utf-8") as f:
        return json.load(f)


def project(home: str, away: str, league: str, ratings: dict) -> tuple[float, float, bool]:
    """Devuelve (λ_home, λ_away, has_ratings). λ == xG proyectado."""
    lg = ratings.get("leagues", {}).get(league)
    if not lg or home not in lg.get("teams", {}) or away not in lg.get("teams", {}):
        return (1.45, 1.15, False)
    mu, h = lg["mu"], lg["home_adv"]
    ah, dh = lg["teams"][home]["attack"], lg["teams"][home]["defense"]
    aa, da = lg["teams"][away]["attack"], lg["teams"][away]["defense"]
    lh = min(5.0, max(0.15, math.exp(mu + ah + da + h)))
    la = min(5.0, max(0.15, math.exp(mu + aa + dh)))
    return (round(lh, 3), round(la, 3), True)


if __name__ == "__main__":
    import sys

    out = fit_all(sys.argv[1] if len(sys.argv) > 1 else "data")
    for lg, fit in out["leagues"].items():
        print(f"{lg}: method={fit['method']} mu={fit['mu']} home_adv={fit['home_adv']} rho={fit.get('rho')} n={fit.get('n_matches')} ({fit.get('fit_seconds')}s)")
        top = sorted(fit["teams"].items(), key=lambda kv: -kv[1]["attack"])[:3]
        print("  top ataque:", [(t, v["attack"]) for t, v in top])
