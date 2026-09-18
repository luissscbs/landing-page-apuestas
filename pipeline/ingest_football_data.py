"""Ingesta Football-Data.co.uk -> matches + odds_snapshots.

Fuente gratuita con CSV desde 2000: Date,HomeTeam,AwayTeam,FTHG,FTAG,
B365H,B365D,B365A (Bet365), PSH,PSD,PSA + PSCH,PSCD,PSCA (Pinnacle open/close).

Uso:
  python -m pipeline.ingest_football_data --league SP1 --season 2526 --out data
Sin red / sin DB: parsea un CSV local con --csv data/SP1_2526.csv
Con DB: --write-db hace upsert a Postgres (requiere DATABASE_URL + psycopg).

Solo stdlib (csv/urllib) para que el scaffold corra sin pip install.
"""
from __future__ import annotations

import argparse
import csv
import os
import urllib.request
from datetime import datetime, timezone

from .config import DATA_DIR, FOOTBALL_DATA_BASE
from .teams import canonical, match_id


def parse_date(raw: str, season: str) -> str:
    raw = raw.strip()
    for fmt in ("%d/%m/%Y", "%d/%m/%y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            dt = datetime.strptime(raw, fmt).replace(tzinfo=timezone.utc)
            return dt.isoformat().replace("+00:00", "Z")
        except ValueError:
            continue
    raise ValueError(f"Fecha no parseable: {raw!r}")


def fnum(v: str | None) -> float | None:
    try:
        if v is None or str(v).strip() in ("", "NA", "N/A"):
            return None
        return float(str(v).strip())
    except ValueError:
        return None


def fint(v: str | None) -> int | None:
    try:
        if v is None or str(v).strip() in ("", "NA"):
            return None
        return int(float(str(v).strip()))
    except ValueError:
        return None


def download_csv(league: str, season: str, dest_dir: str = DATA_DIR) -> str:
    os.makedirs(dest_dir, exist_ok=True)
    url = f"{FOOTBALL_DATA_BASE}/{season}/{league}.csv"
    dest = os.path.join(dest_dir, f"{league}_{season}.csv")
    req = urllib.request.Request(url, headers={"User-Agent": "p50-pipeline/0.1"})
    with urllib.request.urlopen(req, timeout=30) as r, open(dest, "wb") as f:
        f.write(r.read())
    return dest


def parse_csv(path: str, league: str, season: str):
    """Devuelve (matches, odds). matches ordenados por fecha asc (walk-forward safe)."""
    matches: list[dict] = []
    odds: list[dict] = []
    with open(path, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    for r in rows:
        if not r.get("HomeTeam") or not r.get("AwayTeam") or not r.get("Date"):
            continue
        home = canonical(r["HomeTeam"])
        away = canonical(r["AwayTeam"])
        try:
            iso = parse_date(r["Date"], season)
        except ValueError:
            continue
        mid = match_id(league, season, iso, home, away)
        hs, aws = fint(r.get("FTHG")), fint(r.get("FTAG"))
        status = "FINISHED" if hs is not None and aws is not None else "SCHEDULED"
        matches.append(
            {
                "id": mid,
                "league": league,
                "season": season,
                "match_date": iso,
                "home_team_id": home,
                "away_team_id": away,
                "home_score": hs,
                "away_score": aws,
                "status": status,
            }
        )
        # Snapshot Bet365 (apertura/pre-match disponible)
        bh, bd, ba = fnum(r.get("B365H")), fnum(r.get("B365D")), fnum(r.get("B365A"))
        if bh and ba:
            odds.append(
                {
                    "match_id": mid,
                    "bookmaker": "bet365",
                    "captured_at": iso,
                    "odds_home": bh,
                    "odds_draw": bd,
                    "odds_away": ba,
                    "is_closing_line": False,
                }
            )
        # Pinnacle cierre (oro para CLV) — columnas PSCH/PSCD/PSCA si existen
        ph, pd, pa = fnum(r.get("PSCH")), fnum(r.get("PSCD")), fnum(r.get("PSCA"))
        if ph and pa:
            odds.append(
                {
                    "match_id": mid,
                    "bookmaker": "pinnacle",
                    "captured_at": iso,
                    "odds_home": ph,
                    "odds_draw": pd,
                    "odds_away": pa,
                    "is_closing_line": True,
                }
            )
    matches.sort(key=lambda m: m["match_date"])
    return matches, odds


def write_normalized(matches, odds, dest_dir: str, league: str, season: str) -> None:
    os.makedirs(dest_dir, exist_ok=True)
    with open(os.path.join(dest_dir, f"matches_{league}_{season}.csv"), "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["id", "league", "season", "match_date", "home_team_id", "away_team_id", "home_score", "away_score", "status"],
        )
        w.writeheader()
        w.writerows(matches)
    with open(os.path.join(dest_dir, f"odds_{league}_{season}.csv"), "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["match_id", "bookmaker", "captured_at", "odds_home", "odds_draw", "odds_away", "is_closing_line"],
        )
        w.writeheader()
        w.writerows(odds)


def write_db(matches, odds) -> None:
    import psycopg  # type: ignore

    from .db import get_dsn

    with psycopg.connect(get_dsn()) as conn:
        with conn.cursor() as cur:
            for m in matches:
                cur.execute(
                    """INSERT INTO matches (id,league,season,match_date,home_team_id,away_team_id,home_score,away_score,status)
                       VALUES (%(id)s,%(league)s,%(season)s,%(match_date)s,%(home_team_id)s,%(away_team_id)s,%(home_score)s,%(away_score)s,%(status)s)
                       ON CONFLICT (id) DO UPDATE SET home_score=EXCLUDED.home_score, away_score=EXCLUDED.away_score, status=EXCLUDED.status""",
                    m,
                )
            for o in odds:
                cur.execute(
                    """INSERT INTO odds_snapshots (match_id,bookmaker,captured_at,odds_home,odds_draw,odds_away,is_closing_line)
                       VALUES (%(match_id)s,%(bookmaker)s,%(captured_at)s,%(odds_home)s,%(odds_draw)s,%(odds_away)s,%(is_closing_line)s)""",
                    o,
                )
        conn.commit()


def main() -> None:
    ap = argparse.ArgumentParser(description="Ingesta Football-Data.co.uk")
    ap.add_argument("--league", default="SP1", help="SP1=LaLiga, E0=Premier, etc.")
    ap.add_argument("--season", default="2526", help="Ej 2526 = 2025/26")
    ap.add_argument("--csv", default="", help="CSV local (omite descarga)")
    ap.add_argument("--out", default=DATA_DIR)
    ap.add_argument("--write-db", action="store_true")
    a = ap.parse_args()

    path = a.csv or download_csv(a.league, a.season, a.out)
    matches, odds = parse_csv(path, a.league, a.season)
    write_normalized(matches, odds, a.out, a.league, a.season)
    print(f"matches={len(matches)} odds={len(odds)} csv={path}")
    if a.write_db:
        write_db(matches, odds)
        print("upsert Postgres OK")


if __name__ == "__main__":
    main()
