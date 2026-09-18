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
    "atletico": "Ath Madrid",
    "atletico madrid": "Ath Madrid",
    "club atletico de madrid": "Ath Madrid",
    "atletico de madrid": "Ath Madrid",
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
    # ── Variantes de The Odds API -> canónico del histórico FD ──
    # LaLiga (histórico usa formas cortas de Football-Data.co.uk)
    "espanyol": "Espanol",
    "elche": "Elche",
    "elche cf": "Elche",
    "ca osasuna": "Osasuna",
    "osasuna": "Osasuna",
    "rayo vallecano": "Vallecano",
    "athletic bilbao": "Ath Bilbao",
    "athletic club": "Ath Bilbao",
    "deportivo alaves": "Alaves",
    "alaves": "Alaves",
    "celta vigo": "Celta",
    "celta": "Celta",
    "rc celta": "Celta",
    "real racing club de santander": "Santander",
    "racing santander": "Santander",
    "real sociedad": "Sociedad",
    "sociedad": "Sociedad",
    "real betis": "Betis",
    "real betis balompie": "Betis",
    "betis": "Betis",
    "villarreal cf": "Villarreal",
    "getafe cf": "Getafe",
    "girona fc": "Girona",
    "girona": "Girona",
    "rcd mallorca": "Mallorca",
    "mallorca": "Mallorca",
    "ud las palmas": "Las Palmas",
    "las palmas": "Las Palmas",
    "cd leganes": "Leganes",
    "leganes": "Leganes",
    "levante ud": "Levante",
    "levante": "Levante",
    "valencia cf": "Valencia",
    "real valladolid": "Valladolid",
    "valladolid": "Valladolid",
    # Premier League
    "tottenham hotspur": "Tottenham",
    "tottenham": "Tottenham",
    "brighton and hove albion": "Brighton",
    "brighton": "Brighton",
    "ipswich town": "Ipswich",
    "ipswich": "Ipswich",
    "newcastle united": "Newcastle",
    "newcastle": "Newcastle",
    "hull city": "Hull",
    "hull": "Hull",
    "nottingham forest": "Nott'm Forest",
    "coventry city": "Coventry",
    "coventry": "Coventry",
    "manchester united": "Man United",
    "man united": "Man United",
    "west ham united": "West Ham",
    "west ham": "West Ham",
    "wolverhampton wanderers": "Wolves",
    "wolverhampton": "Wolves",
    "leeds united": "Leeds",
    "leeds": "Leeds",
    "leicester city": "Leicester",
    "leicester": "Leicester",
    "luton town": "Luton",
    "luton": "Luton",
    "sheffield united": "Sheffield United",
    "crystal palace": "Crystal Palace",
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
