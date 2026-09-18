"""Motor de backtesting walk-forward (track record auditable).

Protocolo honesto (sin leakage):
  - Por cada temporada S en (2425, 2526, 2627): ratings Dixon-Coles MLE y
    forma/fatiga calculados SOLO con partidos de temporadas < S.
  - Se apuesta la cuota Bet365 pre-match (apostable); el cierre Pinnacle
    solo audita CLV, nunca se apuesta.
  - Pricing idéntico a producción: λ xG -> Dixon-Coles -> shrinkage
    validado (calibration.json) + guardia de discrepancia >8pp.
  - Criterio: EV >= --min-ev en la mejor selección (best_value).
  - Estrategias: stake plano (100 USD) y Quarter-Kelly sobre bankroll
    (default 10.000 USD, tope 3% por apuesta).

Métricas: N, W/L, win rate real vs esperada, beneficio, ROI, cuota
promedio, max drawdown, CLV medio, desgloses por liga y rango de cuota.
Artefacto: data/backtest_results.json.

Solo stdlib (+numpy para agregados). Uso:
  python -m pipeline.backtest --min-ev 3.0 --stake 100
"""
from __future__ import annotations

import argparse
import csv
import glob
import json
import os
from datetime import datetime, timezone

RESULTS_NAME = "backtest_results.json"
SEASONS = ("2425", "2526", "2627")
LEAGUES = ("SP1", "E0")
LEAGUE_LABEL = {"E0": "premier", "SP1": "laliga"}
ODDS_BANDS = (("low", None, 1.80), ("mid", 1.80, 2.50), ("high", 2.50, None))


def _fnum(v):
    try:
        return float(str(v).strip()) if str(v).strip() not in ("", "NA") else None
    except ValueError:
        return None


def load_book_triples(data_dir: str, bookmaker: str, closing: bool | None = None) -> dict[str, dict]:
    """Triples por match_id de una casa (closing filtra is_closing_line)."""
    out: dict[str, dict] = {}
    for path in sorted(glob.glob(os.path.join(data_dir, "odds_*.csv"))):
        with open(path, encoding="utf-8", newline="") as f:
            for o in csv.DictReader(f):
                if o.get("bookmaker") != bookmaker:
                    continue
                if closing is not None:
                    is_close = str(o.get("is_closing_line")).lower() in ("true", "1", "t")
                    if is_close != closing:
                        continue
                h, d, a = _fnum(o.get("odds_home")), _fnum(o.get("odds_draw")), _fnum(o.get("odds_away"))
                if not h or not a or o["match_id"] in out:
                    continue
                out[o["match_id"]] = {"home": h, "draw": d or 3.4, "away": a}
    return out


def _outcome(m: dict) -> str | None:
    hs, aws = m.get("home_score"), m.get("away_score")
    if hs is None or aws is None:
        return None
    return "home" if hs > aws else ("away" if hs < aws else "draw")


def window_state(matches_prior: list[dict]) -> tuple[dict, dict]:
    """Ratings MLE + última forma, solo con partidos anteriores."""
    from . import features as feat
    from .xg_ratings import fit_league

    ratings = {"leagues": {lg: fit_league([m for m in matches_prior if m["league"] == lg]) for lg in LEAGUES}}
    last_feats: dict[str, dict] = {}
    for m in feat.enrich(matches_prior):
        last_feats[m["home_team_id"]] = m["features"]
        last_feats[m["away_team_id"]] = m["features"]
    return ratings, last_feats


def price_raw(m: dict, triple: dict, ratings: dict, last_feats: dict) -> dict:
    """Opinión cruda del modelo (sin shrinkage): λ -> 1X2 + implícita.
    Lo costoso (fits) se hace una vez por temporada en collect()."""
    from . import ml_probability as mlp
    from .xg_ratings import project

    lg_r = ratings.get("leagues", {}).get(m["league"], {})
    rho = lg_r.get("rho", -0.12)
    teams = lg_r.get("teams", {})
    if m["home_team_id"] in teams and m["away_team_id"] in teams:
        lh, la, _ = project(m["home_team_id"], m["away_team_id"], m["league"], ratings)
        has_r = True
    else:
        lh, la = mlp.fit_market_lambdas(mlp.remove_vig(triple, method="power"))
        has_r = False
    lf, af = last_feats.get(m["home_team_id"], {}), last_feats.get(m["away_team_id"], {})
    rh = lf.get("roll_h_pts", lf.get("roll_h_home_pts"))
    ra = af.get("roll_a_pts", af.get("roll_a_away_pts"))
    if rh is not None and ra is not None:
        adj = max(-0.12, min(0.12, (rh - ra) / 3.0 * 0.08))
        lh = max(0.2, min(4.0, lh * (1 + adj)))
        la = max(0.2, min(4.0, la * (1 - adj)))
    if lf.get("has_midweek_home"):
        lh *= 0.97
    if af.get("has_midweek_away"):
        la *= 0.97
    raw = mlp.predict_1x2(round(lh, 3), round(la, 3), rho)
    implied = mlp.remove_vig(triple, method="power")
    gap = max(abs(raw[k] - implied[k]) for k in ("home", "draw", "away"))
    return {"raw": raw, "implied": implied, "gap": gap, "has_r": has_r,
            "xg": (round(lh, 2), round(la, 2))}


def collect(matches: list[dict], b365: dict) -> list[dict]:
    """Candidatos walk-forward (ratings/forma solo con datos previos). Una sola pasada."""
    from .upcoming import team_display

    cands: list[dict] = []
    for season in SEASONS:
        prior = [m for m in matches if m["season"] < season]
        season_ms = sorted(
            (m for m in matches if m["season"] == season and _outcome(m) and m["id"] in b365),
            key=lambda m: m["match_date"],
        )
        if not season_ms:
            continue
        ratings, last_feats = window_state(prior)
        for m in season_ms:
            triple = b365[m["id"]]
            px = price_raw(m, triple, ratings, last_feats)
            cands.append({
                "date": m["match_date"][:10],
                "match": f"{team_display(m['home_team_id'])} vs {team_display(m['away_team_id'])}",
                "league": LEAGUE_LABEL.get(m["league"], m["league"]),
                "id": m["id"],
                "triple": triple,
                "outcome": _outcome(m),
                **px,
            })
    return cands


def evaluate(cands: list[dict], pinn: dict, w_model: float, min_ev: float,
             flat_stake: float, bankroll0: float, use_guard: bool, gap_warn: float = 0.08) -> list[dict]:
    """Aplica shrinkage (+guardia opcional) y simula apuestas sobre candidatos."""
    from . import ml_probability as mlp

    bets: list[dict] = []
    bank = bankroll0
    for c in cands:
        w = w_model
        warned = False
        if use_guard and c["has_r"] and c["gap"] > gap_warn:
            w = w_model * 0.5
            warned = True
        tot = 0.0
        blended = {}
        for k in ("home", "draw", "away"):
            blended[k] = w * c["raw"][k] + (1 - w) * c["implied"][k]
            tot += blended[k]
        blended = {k: v / tot for k, v in blended.items()}
        vb = mlp.best_value(blended, c["triple"])
        if vb is None or vb["expectedValuePct"] < min_ev:
            continue
        sel = vb["selection"]
        prob, odds = blended[sel], c["triple"][sel]
        won = c["outcome"] == sel
        profit_flat = round(odds * flat_stake - flat_stake if won else -flat_stake, 2)
        frac = mlp.kelly_stake(prob, odds)
        stake_k = round(frac * bank, 2)
        profit_k = round(odds * stake_k - stake_k if won else -stake_k, 2)
        bank = round(bank + profit_k, 2)
        close = pinn.get(c["id"], {}).get(sel)
        bets.append({
            "id": c["id"],
            "date": c["date"],
            "match": c["match"],
            "league": c["league"],
            "selection": sel,
            "odds": odds,
            "prob": round(prob, 3),
            "ev": vb["expectedValuePct"],
            "result": "won" if won else "lost",
            "profit": profit_flat,
            "stake_kelly": stake_k,
            "profit_kelly": profit_k,
            "bankroll_kelly": bank,
            "warned": warned,
            # CLV basado en precio (cuota tomada vs cierre): model-free y estándar.
            "clv": round((odds / close - 1) * 100, 2) if close else None,
        })
    return bets


def _summarize(bets: list[dict], flat_stake: float, bankroll0: float, profit_key: str, stake_key: str | None = None) -> dict:
    import numpy as np

    n = len(bets)
    if not n:
        return {"total_bets": 0, "won": 0, "lost": 0, "win_rate_pct": 0.0,
                "win_rate_expected_pct": 0.0, "total_staked": 0.0, "net_profit": 0.0,
                "roi_pct": 0.0, "avg_odds": 0.0, "max_drawdown_pct": 0.0}
    won = sum(1 for b in bets if b["result"] == "won")
    profits = np.array([b[profit_key] for b in bets], dtype=float)
    stakes = np.array([b[stake_key] if stake_key else flat_stake for b in bets], dtype=float)
    equity = bankroll0 + np.cumsum(profits)
    peak = np.maximum.accumulate(equity)
    dd = float(np.max((peak - equity) / np.maximum(peak, 1e-9)) * 100)
    return {
        "total_bets": n,
        "won": won,
        "lost": n - won,
        "win_rate_pct": round(won / n * 100, 2),
        "win_rate_expected_pct": round(float(np.mean([b["prob"] for b in bets])) * 100, 2),
        "total_staked": round(float(np.sum(stakes)), 2),
        "net_profit": round(float(np.sum(profits)), 2),
        "roi_pct": round(float(np.sum(profits) / max(np.sum(stakes), 1e-9)) * 100, 2),
        "avg_odds": round(float(np.mean([b["odds"] for b in bets])), 2),
        "max_drawdown_pct": round(dd, 2),
    }


def run(data_dir: str = "data", min_ev: float = 3.0, flat_stake: float = 100.0,
        bankroll0: float = 10000.0) -> dict:
    from .upcoming import get_w_model, load_history

    matches = load_history(data_dir)
    b365 = load_book_triples(data_dir, "bet365")
    pinn = load_book_triples(data_dir, "pinnacle", closing=True)
    w_prod = get_w_model(data_dir)
    cands = collect(matches, b365)
    # Auditoría principal: el motor ML puro (w=1.0, sin guardia) = su señal real.
    bets = evaluate(cands, pinn, 1.0, min_ev, flat_stake, bankroll0, use_guard=False)
    # Auditoría secundaria: el blend productivo (casi nunca apuesta: así debe ser).
    bets_prod = evaluate(cands, pinn, w_prod, min_ev, flat_stake, bankroll0, use_guard=True)
    kelly = _summarize(bets, flat_stake, bankroll0, "profit_kelly", "stake_kelly")
    by_league = {lbl: _summarize([b for b in bets if b["league"] == lbl], flat_stake, bankroll0, "profit")
                 for lbl in ("premier", "laliga")}
    by_odds = {}
    for name, lo, hi in ODDS_BANDS:
        sel = [b for b in bets if (lo is None or b["odds"] >= lo) and (hi is None or b["odds"] < hi)]
        by_odds[name] = _summarize(sel, flat_stake, bankroll0, "profit")
    clvs = [b["clv"] for b in bets if b["clv"] is not None]
    out = {
        "params": {"min_ev_pct": min_ev, "flat_stake": flat_stake, "bankroll0": bankroll0,
                   "w_model_audit": 1.0, "w_production": w_prod, "seasons": list(SEASONS),
                   "universe": len(cands),
                   "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")},
        "summary": _summarize(bets, flat_stake, bankroll0, "profit"),
        "kelly": kelly,
        "production": {
            "summary": _summarize(bets_prod, flat_stake, bankroll0, "profit"),
            "note": "Blend productivo (shrinkage validado + guardia): casi nunca alcanza "
                    "el umbral porque vive pegado al consenso. Así debe ser.",
        },
        "clv_mean_pct": round(sum(clvs) / len(clvs), 2) if clvs else None,
        "clv_n": len(clvs),
        "by_league": by_league,
        "by_odds": by_odds,
        "recent_bets": list(reversed(bets[-30:])),
        "all_bets": bets,
        "n_bets": len(bets),
    }
    with open(os.path.join(data_dir, RESULTS_NAME), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)
    return out


def print_summary(res: dict) -> None:
    s = res["summary"]
    k = res["kelly"]
    p = res["production"]["summary"]
    print(f"Backtest EV>={res['params']['min_ev_pct']}% | universo={res['params']['universe']} | seasons={','.join(res['params']['seasons'])}")
    print(f"MODELO (w=1.0) FLAT ${res['params']['flat_stake']}: N={s['total_bets']} W={s['won']} L={s['lost']} "
          f"win={s['win_rate_pct']}% (esp {s['win_rate_expected_pct']}%) | P&L=${s['net_profit']} "
          f"ROI={s['roi_pct']}% | cuota~{s['avg_odds']} | DD={s['max_drawdown_pct']}%")
    print(f"MODELO KELLY 1/4 (bank ${res['params']['bankroll0']}): P&L=${k['net_profit']} ROI={k['roi_pct']}% "
          f"DD={k['max_drawdown_pct']}% | CLV medio={res['clv_mean_pct']}% (n={res['clv_n']})")
    print(f"PRODUCCIÓN (w={res['params']['w_production']}): N={p['total_bets']} P&L=${p['net_profit']}")
    for lbl, b in res["by_league"].items():
        print(f"  {lbl}: N={b['total_bets']} win={b['win_rate_pct']}% ROI={b['roi_pct']}% P&L=${b['net_profit']}")
    for band, b in res["by_odds"].items():
        print(f"  cuotas {band}: N={b['total_bets']} win={b['win_rate_pct']}% ROI={b['roi_pct']}%")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Backtest walk-forward del modelo")
    ap.add_argument("--min-ev", type=float, default=3.0)
    ap.add_argument("--stake", type=float, default=100.0)
    ap.add_argument("--bankroll", type=float, default=10000.0)
    ap.add_argument("--data", default="data")
    a = ap.parse_args()
    print_summary(run(a.data, a.min_ev, a.stake, a.bankroll))
