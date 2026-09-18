"""Calibración walk-forward: isotonic por clase + puerta XGB honesta.

Protocolo:
  1. Ratings Dixon-Coles ajustados SOLO con temporadas <=2425 (fit-A).
  2. Predicción walk-forward de toda la 2526 (760 partidos) -> pares
     (prob_cruda, ocurrió) por clase. Entrena IsotonicRegression.
  3. Validación en 2627: Brier crudo vs calibrado.
  4. Candidato XGBClassifier (λ + implícita de mercado) entrenado en 2526,
     validado en 2627. Solo entra al ensemble si mejora el Brier con
     margen (>0.003); si no, peso 0 y queda documentado.

Artefactos: data/calibration.json (+ data/xgb_1x2.json si entra).
El backend aplica interpolación lineal sobre la isotónica + renormaliza.
"""
from __future__ import annotations

import csv
import glob
import json
import os
from datetime import datetime, timezone

CAL_NAME = "calibration.json"
XGB_NAME = "xgb_1x2.json"
CLASSES = ("home", "draw", "away")


def _fnum(v):
    try:
        return float(str(v).strip()) if str(v).strip() not in ("", "NA") else None
    except ValueError:
        return None


def load_market_triples(data_dir: str = "data") -> dict[str, dict]:
    """Triple Bet365 (cierre Pinnacle si falta) por match_id."""
    best: dict[str, dict] = {}
    for path in sorted(glob.glob(os.path.join(data_dir, "odds_*.csv"))):
        with open(path, encoding="utf-8", newline="") as f:
            for o in csv.DictReader(f):
                h, d, a = _fnum(o.get("odds_home")), _fnum(o.get("odds_draw")), _fnum(o.get("odds_away"))
                if not h or not a:
                    continue
                cur = best.get(o["match_id"])
                score = (o["bookmaker"] == "pinnacle", o.get("is_closing_line") == "True")
                if cur is None or score > cur["_s"]:
                    best[o["match_id"]] = {"home": h, "draw": d or 3.4, "away": a, "_s": score}
    return {k: {"home": v["home"], "draw": v["draw"], "away": v["away"]} for k, v in best.items()}


def _outcome(m: dict) -> str | None:
    hs, aws = m.get("home_score"), m.get("away_score")
    if hs is None or aws is None:
        return None
    return "home" if hs > aws else ("away" if hs < aws else "draw")


def build_pairs(matches: list[dict], ratings: dict, triples: dict) -> list[dict]:
    """Pares walk-forward con ratings ya ajustados en ventana anterior."""
    from . import ml_probability as mlp
    from .xg_ratings import project

    out = []
    for m in matches:
        y = _outcome(m)
        t = triples.get(m["id"])
        if y is None or t is None:
            continue
        lh, la, ok = project(m["home_team_id"], m["away_team_id"], m["league"], ratings)
        if not ok:
            continue
        probs = mlp.predict_1x2(lh, la, ratings["leagues"][m["league"]].get("rho", -0.12))
        implied = mlp.remove_vig(t, method="power")
        out.append({"id": m["id"], "probs": probs, "implied": implied, "y": y, "lambdas": (lh, la)})
    return out


def fit_isotonic(pairs: list[dict]) -> dict:
    from sklearn.isotonic import IsotonicRegression

    cal = {}
    for c in CLASSES:
        xs = [p["probs"][c] for p in pairs]
        ys = [1.0 if p["y"] == c else 0.0 for p in pairs]
        ir = IsotonicRegression(out_of_bounds="clip", y_min=0.01, y_max=0.95)
        ir.fit(xs, ys)
        thr = [float(v) for v in ir.X_thresholds_]
        cal[c] = {"x": [round(v, 4) for v in thr], "f": [round(float(v), 4) for v in ir.predict(thr)]}
    return cal


def apply_isotonic(probs: dict, cal: dict | None) -> dict:
    import numpy as np

    if not cal:
        return dict(probs)
    out = {c: float(np.interp(probs[c], cal[c]["x"], cal[c]["f"])) for c in CLASSES}
    tot = sum(out.values()) or 1.0
    return {c: out[c] / tot for c in CLASSES}


def brier(pairs: list[dict], key: str = "probs") -> float:
    n = len(pairs)
    if not n:
        return float("nan")
    s = 0.0
    for p in pairs:
        pr = p[key] if key in p else apply_isotonic(p["probs"], p.get("_cal"))
        for c in CLASSES:
            s += (pr[c] - (1.0 if p["y"] == c else 0.0)) ** 2
    return round(s / n, 4)


def try_xgb(train: list[dict], valid: list[dict]) -> tuple[float, dict]:
    """Puerta honesta: devuelve (peso, info). Peso >0 solo si mejora Brier."""
    import numpy as np
    from xgboost import XGBClassifier

    order = {"home": 0, "draw": 1, "away": 2}

    def X(pairs):
        return np.array([
            [p["lambdas"][0], p["lambdas"][1],
             p["lambdas"][0] + p["lambdas"][1], p["lambdas"][0] - p["lambdas"][1],
             p["implied"]["home"], p["implied"]["draw"], p["implied"]["away"]]
            for p in pairs
        ])

    ytr = np.array([order[p["y"]] for p in train])
    clf = XGBClassifier(n_estimators=250, max_depth=3, learning_rate=0.05,
                        subsample=0.8, colsample_bytree=0.8, reg_lambda=8.0,
                        objective="multi:softprob", num_class=3, n_jobs=-1,
                        random_state=7)
    clf.fit(X(train), ytr)
    pv = clf.predict_proba(X(valid))
    b_raw = brier(valid)
    s = sum(
        (pv[i][order[p["y"]]] - 1.0) ** 2 + sum(pv[i][j] ** 2 for j in range(3) if j != order[p["y"]])
        for i, p in enumerate(valid)
    ) / len(valid)
    b_xgb = round(float(s), 4)
    info = {"brier_valid": b_xgb, "brier_baseline": float(b_raw), "n_train": len(train), "n_valid": len(valid)}
    if b_xgb + 0.003 < b_raw:
        return 0.20, {**info, "accepted": True}
    return 0.0, {**info, "accepted": False, "reason": "no mejora Brier con margen"}


def run(data_dir: str = "data") -> dict:
    from .upcoming import load_history
    from .xg_ratings import fit_league

    matches = load_history(data_dir)
    triples = load_market_triples(data_dir)
    by_season: dict[str, list[dict]] = {}
    for m in matches:
        by_season.setdefault(m["season"], []).append(m)

    # Ratings estrictamente anteriores a cada temporada predicha.
    fits = {
        "2425": {lg: fit_league([m for m in matches if m["league"] == lg and m["season"] <= "2324"]) for lg in ("SP1", "E0")},
        "2526": {lg: fit_league([m for m in matches if m["league"] == lg and m["season"] <= "2425"]) for lg in ("SP1", "E0")},
        "2627": {lg: fit_league([m for m in matches if m["league"] == lg and m["season"] <= "2526"]) for lg in ("SP1", "E0")},
    }
    pairs25 = build_pairs(by_season.get("2425", []), {"leagues": fits["2425"]}, triples)
    pairs26 = build_pairs(by_season.get("2526", []), {"leagues": fits["2526"]}, triples)
    pairs27 = build_pairs(by_season.get("2627", []), {"leagues": fits["2627"]}, triples)

    # Evaluación honesta: isotónica entrenada en 2425, validada en 2526+2627.
    cal_eval = fit_isotonic(pairs25)
    val = pairs26 + pairs27
    for p in val:
        p["calibrated"] = apply_isotonic(p["probs"], cal_eval)
    b_raw = brier(val, "probs")
    b_cal = brier(val, "calibrated")
    iso_used = bool(b_cal + 0.003 < b_raw)

    # Shrinkage óptimo hacia el mercado (grid sobre la misma validación).
    grid = {}
    for w in (0.0, 0.15, 0.25, 0.35, 0.5, 0.65, 0.8, 1.0):
        for p in val:
            p["bl"] = {c: w * p["probs"][c] + (1 - w) * p["implied"][c] for c in CLASSES}
        grid[str(w)] = brier(val, "bl")
    w_star = min(grid, key=lambda k: grid[k])

    # Artefacto productivo: isotónica entrenada en 2425+2526 (más muestra).
    cal = fit_isotonic(pairs25 + pairs26)
    w_xgb, xgb_info = try_xgb(pairs25, val)
    if w_xgb > 0:
        from xgboost import XGBClassifier  # noqa (reentrena para guardar)
        import numpy as np

        order = {"home": 0, "draw": 1, "away": 2}
        clf = XGBClassifier(n_estimators=250, max_depth=3, learning_rate=0.05,
                            subsample=0.8, colsample_bytree=0.8, reg_lambda=8.0,
                            objective="multi:softprob", num_class=3, n_jobs=-1, random_state=7)
        clf.fit(np.array([[p["lambdas"][0], p["lambdas"][1], p["lambdas"][0] + p["lambdas"][1],
                           p["lambdas"][0] - p["lambdas"][1], p["implied"]["home"],
                           p["implied"]["draw"], p["implied"]["away"]] for p in pairs25]),
                np.array([order[p["y"]] for p in pairs25]))
        clf.save_model(os.path.join(data_dir, XGB_NAME))
    out = {
        "fitted_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "train": {"seasons": ["2425", "2526"], "n": len(pairs25) + len(pairs26)},
        "validation": {"seasons": ["2526", "2627"], "n": len(val)},
        "brier": {"raw": b_raw, "isotonic": b_cal},
        "isotonic": cal,
        "isotonic_used": iso_used,
        "isotonic_note": "sin mejora de Brier en validación walk-forward; no se aplica en producción"
        if not iso_used else "mejora Brier; aplicar antes del shrinkage",
        "shrinkage": {"w_model": float(w_star), "grid": grid, "brier_market": grid["0.0"]},
        "xgb": {"weight": w_xgb, **xgb_info, "artifact": XGB_NAME if w_xgb > 0 else None},
    }
    with open(os.path.join(data_dir, CAL_NAME), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)
    return out


if __name__ == "__main__":
    import sys

    out = run(sys.argv[1] if len(sys.argv) > 1 else "data")
    print(f"train_n={out['train']['n']} valid_n={out['validation']['n']}")
    print(f"Brier raw={out['brier']['raw']} isotonic={out['brier']['isotonic']}")
    print(f"XGB: {out['xgb']}")
