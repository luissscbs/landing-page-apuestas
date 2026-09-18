"""Cliente The Odds API: fixtures + cuotas reales en vivo.

Fuente primaria del upcoming (reemplaza cualquier generación de cruces):
  GET {BASE}/sports/{sport}/odds?apiKey=...&regions=eu&marks=h2h
      &oddsFormat=decimal&dateFormat=iso

- sports: soccer_spain_la_liga, soccer_epl, soccer_italy_serie_a,
  soccer_germany_bundesliga (configurable con ODDS_LEAGUES).
- regions=eu + markets=h2h: coste mínimo de cuota (plan gratuito 500/mes).
- Triple de mercado = mediana entre casas por selección + nº de casas.
- Caché en fichero data/live_odds_cache.json + TTL (ODDS_TTL_S, default
  6h para cuidar la cuota gratuita) + comparativa de movement contra el
  snapshot previo.
- Sin clave o sin cuota: se sirve la caché marcada stale; sin caché no se
  inventa nada (el backend devuelve [] y el frontend cae a FALLBACK_ODDS).

Solo stdlib. La clave NUNCA se loguea.
"""
from __future__ import annotations

import json
import os
import statistics
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timezone

from .config import THE_ODDS_API_KEY, THE_ODDS_BASE

SPORTS: dict[str, dict[str, str]] = {
    "soccer_spain_la_liga": {
        "league_code": "SP1",
        "display": "LaLiga · España",
        "category": "laliga",
    },
    "soccer_epl": {
        "league_code": "E0",
        "display": "Premier League · Inglaterra",
        "category": "premier",
    },
    "soccer_italy_serie_a": {
        "league_code": "SA",
        "display": "Serie A · Italia",
        "category": "seriea",
    },
    "soccer_germany_bundesliga": {
        "league_code": "GB",
        "display": "Bundesliga · Alemania",
        "category": "bundesliga",
    },
}

DEFAULT_LEAGUES = ",".join(SPORTS)
CACHE_NAME = "live_odds_cache.json"
MOVEMENT_PCT = 0.02


class LiveOddsError(RuntimeError):
    pass


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default)


def _get_json(path: str, params: dict, api_key: str) -> tuple[object, dict]:
    """GET contra The Odds API. Devuelve (json, headers de cuota)."""
    qs = urllib.parse.urlencode({"apiKey": api_key, **params})
    req = urllib.request.Request(
        f"{THE_ODDS_BASE}{path}?{qs}", headers={"User-Agent": "cbs-quant/0.1"}
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            body = json.load(r)
            headers = {
                "remaining": r.headers.get("x-requests-remaining"),
                "used": r.headers.get("x-requests-used"),
                "last_cost": r.headers.get("x-requests-last"),
            }
            return body, headers
    except urllib.error.HTTPError as e:
        try:
            detail = e.read().decode("utf-8", "replace")[:200]
        except Exception:
            detail = ""
        if e.code == 401:
            raise LiveOddsError(f"API key inválida (401). {detail}")
        if e.code == 429:
            raise LiveOddsError(f"Cuota agotada (429). {detail}")
        raise LiveOddsError(f"The Odds API {e.code}. {detail}")


def _median_triple(event: dict) -> tuple[dict | None, list[str]]:
    """Mediana entre casas por selección 1X2. Solo casas con las 3 opciones.

    Las casas europeas nombran las opciones con el equipo
    (home_team/away_team/Draw), no con Home/Away genéricos.
    """
    home_name, away_name = event.get("home_team"), event.get("away_team")
    homes, draws, aways = [], [], []
    books: list[str] = []
    for bk in event.get("bookmakers", []):
        prices: dict[str, float] = {}
        for m in bk.get("markets", []):
            if m.get("key") != "h2h":
                continue
            for o in m.get("outcomes", []):
                if not o.get("price"):
                    continue
                if o.get("name") == home_name:
                    prices["home"] = float(o["price"])
                elif o.get("name") == away_name:
                    prices["away"] = float(o["price"])
                elif o.get("name") == "Draw":
                    prices["draw"] = float(o["price"])
        if len(prices) == 3:
            homes.append(prices["home"])
            draws.append(prices["draw"])
            aways.append(prices["away"])
            books.append(bk.get("title") or bk.get("key", "?"))
    if not homes:
        return None, []
    return (
        {
            "home": round(statistics.median(homes), 2),
            "draw": round(statistics.median(draws), 2),
            "away": round(statistics.median(aways), 2),
        },
        books,
    )


def _movement(cur: dict, prev: dict | None) -> dict[str, str]:
    if not prev:
        return {"home": "flat", "draw": "flat", "away": "flat"}
    out: dict[str, str] = {}
    for k in ("home", "draw", "away"):
        if not prev.get(k):
            out[k] = "flat"
            continue
        chg = (cur[k] - prev[k]) / prev[k]
        out[k] = "down" if chg < -MOVEMENT_PCT else ("up" if chg > MOVEMENT_PCT else "flat")
    return out


def _cache_path(data_dir: str) -> str:
    return os.path.join(data_dir, CACHE_NAME)


def load_cache(data_dir: str) -> dict | None:
    try:
        with open(_cache_path(data_dir), encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def save_cache(data_dir: str, payload: dict) -> None:
    os.makedirs(data_dir, exist_ok=True)
    tmp = _cache_path(data_dir) + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    os.replace(tmp, _cache_path(data_dir))


def fetch_all_sports(
    api_key: str, leagues: list[str], regions: str = "eu"
) -> tuple[dict[str, list[dict]], dict]:
    """Descarga eventos h2h por liga. Devuelve (eventos_por_sport, info_cuota)."""
    out: dict[str, list[dict]] = {}
    info: dict = {"remaining": None, "used": None, "cost": 0}
    for sport in leagues:
        body, headers = _get_json(
            f"/sports/{sport}/odds",
            {"regions": regions, "markets": "h2h", "oddsFormat": "decimal", "dateFormat": "iso"},
            api_key,
        )
        out[sport] = body if isinstance(body, list) else []
        info["remaining"] = headers["remaining"]
        info["used"] = headers["used"]
        try:
            info["cost"] += int(headers["last_cost"] or 0)
        except (TypeError, ValueError):
            pass
    return out, info


def _as_date(iso: str) -> date:
    return datetime.fromisoformat(iso.replace("Z", "+00:00")).date()


def get_live_events(
    data_dir: str = "data",
    now: datetime | None = None,
    ttl_s: float | None = None,
    leagues: list[str] | None = None,
) -> tuple[list[dict], dict]:
    """Eventos REALES de Hoy/Mañana con triple mediano entre casas.

    Devuelve (eventos, info). info.source: live | cache | cache-stale.
    Nunca inventa partidos: sin red ni caché, eventos = [] con info.error.
    """
    now = now or datetime.now(timezone.utc)
    ttl = float(_env("ODDS_TTL_S", "21600") if ttl_s is None else ttl_s)
    leagues = leagues or [
        s.strip() for s in _env("ODDS_LEAGUES", DEFAULT_LEAGUES).split(",") if s.strip()
    ]
    leagues = [s for s in leagues if s in SPORTS]
    regions = _env("ODDS_REGIONS", "eu")

    prev_cache = load_cache(data_dir)
    prev_by_id = {e["id"]: e for e in (prev_cache or {}).get("events", [])}
    fresh = (
        prev_cache
        and (time.time() - prev_cache.get("fetched_at_ts", 0)) < ttl
        and prev_cache.get("leagues") == leagues
    )
    api_key = THE_ODDS_API_KEY

    source = "cache"
    info: dict = {"quota_remaining": None, "quota_used": None, "fetch_cost": 0}
    if fresh:
        raw: dict[str, list[dict]] = prev_cache["by_sport"]
        info.update(
            {
                "quota_remaining": prev_cache.get("quota_remaining"),
                "fetched_at": prev_cache.get("fetched_at"),
            }
        )
    elif api_key:
        try:
            raw, q = fetch_all_sports(api_key, leagues, regions)
            info.update(
                {
                    "quota_remaining": q["remaining"],
                    "quota_used": q["used"],
                    "fetch_cost": q["cost"],
                }
            )
            payload = {
                "fetched_at": now.isoformat().replace("+00:00", "Z"),
                "fetched_at_ts": time.time(),
                "leagues": leagues,
                "regions": regions,
                "quota_remaining": q["remaining"],
                "by_sport": raw,
                "events": [],  # se rellena abajo para movement futuro
            }
            source = "live"
        except LiveOddsError as e:
            info["error"] = str(e)
            raw = (prev_cache or {}).get("by_sport", {})
            source = "cache-stale" if raw else "unavailable"
    else:
        info["error"] = "Sin THE_ODDS_API_KEY: define la clave en .env.local"
        raw = (prev_cache or {}).get("by_sport", {})
        source = "cache-stale" if raw else "unavailable"

    day0 = now.date()
    day1 = date.fromordinal(day0.toordinal() + 1)
    events: list[dict] = []
    for sport, ev_list in raw.items():
        meta = SPORTS[sport]
        for ev in ev_list:
            try:
                if _as_date(ev["commence_time"]) not in (day0, day1):
                    continue
            except (KeyError, ValueError):
                continue
            triple, books = _median_triple(ev)
            if not triple:
                continue
            prev = prev_by_id.get(ev["id"])
            events.append(
                {
                    "id": ev["id"],
                    "sport": sport,
                    "league_code": meta["league_code"],
                    "league": meta["display"],
                    "category": meta["category"],
                    "home": ev["home_team"],
                    "away": ev["away_team"],
                    "starts_at": ev["commence_time"],
                    "market_odds": triple,
                    "books": books,
                    "book_count": len(books),
                    "movement": _movement(triple, (prev or {}).get("market_odds")),
                }
            )
    events.sort(key=lambda e: e["starts_at"])

    if source == "live":
        payload["events"] = events
        save_cache(data_dir, payload)
        info["fetched_at"] = payload["fetched_at"]

    info["source"] = source
    info["leagues"] = leagues
    info["window"] = [day0.isoformat(), day1.isoformat()]
    return events, info
