"""Normalización de equipos: alias -> canónico.

Cada proveedor nombra distinto ("Real Madrid CF", "RMA", "Man. City").
El ETL siempre guarda el canónico en matches.home_team_id / away_team_id.
Nuevos alias se agregan a ALIASES y a db/schema.sql team_aliases.
"""
import re
import unicodedata

# alias normalizado (lower, sin acentos) -> canónico
_ALIASES_RAW: dict[str, str] = {
    "real madrid": "Real Madrid",
    "real madrid cf": "Real Madrid",
    "rma": "Real Madrid",
    "fc barcelona": "FC Barcelona",
    "barcelona": "FC Barcelona",
    "barca": "FC Barcelona",
    "atletico": "Atletico Madrid",
    "atletico madrid": "Atletico Madrid",
    "club atletico de madrid": "Atletico Madrid",
    "atletico de madrid": "Atletico Madrid",
    "sevilla": "Sevilla",
    "sevilla fc": "Sevilla",
    "man. city": "Manchester City",
    "man city": "Manchester City",
    "manchester city": "Manchester City",
    "arsenal": "Arsenal",
    "boca juniors": "Boca Juniors",
    "boca": "Boca Juniors",
    "river plate": "River Plate",
    "river": "River Plate",
    "america": "Club America",
    "club america": "Club America",
    "chivas": "Guadalajara Chivas",
    "chivas guadalajara": "Guadalajara Chivas",
    "guadalajara": "Guadalajara Chivas",
    "atl. nacional": "Atletico Nacional",
    "atletico nacional": "Atletico Nacional",
    "millonarios": "Millonarios",
}


def _norm(s: str) -> str:
    s = s.strip().lower()
    s = "".join(
        c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn"
    )
    s = re.sub(r"\s+", " ", s)
    return s


ALIASES: dict[str, str] = {_norm(k): v for k, v in _ALIASES_RAW.items()}


def canonical(name: str) -> str:
    """Devuelve el nombre canónico o el original recortado si no hay alias."""
    if not name:
        return name
    return ALIASES.get(_norm(name), name.strip())


def match_id(league: str, season: str, date_iso: str, home: str, away: str) -> str:
    """ID determinista y estable para matches.id (VARCHAR 64)."""
    base = f"{league}-{season}-{date_iso[:10]}-{canonical(home)}-vs-{canonical(away)}"
    base = _norm(base).replace(" ", "-")
    return base[:64]
