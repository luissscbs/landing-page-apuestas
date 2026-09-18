"""Config centralizada del pipeline. Solo stdlib + dotenv opcional."""
import os

try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv(".env.local")
    load_dotenv(".env")
except Exception:
    pass


def getenv(name: str, default: str = "") -> str:
    return os.getenv(name, default)


DATABASE_URL = getenv("DATABASE_URL", "")
# Football-Data.co.uk base: https://www.football-data.co.uk/mmz4281/{season}/{league}.csv
# Ej season="2526", league="SP1" (LaLiga), "E0" (Premier)
FOOTBALL_DATA_BASE = getenv(
    "FOOTBALL_DATA_BASE", "https://www.football-data.co.uk/mmz4281"
)
DATA_DIR = getenv("PIPELINE_DATA_DIR", "data")

THE_ODDS_API_KEY = getenv("THE_ODDS_API_KEY", "")
THE_ODDS_BASE = getenv("THE_ODDS_BASE", "https://api.the-odds-api.com/v4")
