"""Acceso Postgres. Sin dependencia obligatoria en import (psycopg lazy)."""
from .config import DATABASE_URL


def get_dsn() -> str:
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL vacío. Define DATABASE_URL en .env.local "
            "(ej postgres://user:pass@localhost:5432/p50)"
        )
    return DATABASE_URL


def init_schema(sql_path: str = "db/schema.sql") -> None:
    import psycopg  # type: ignore

    with open(sql_path, encoding="utf-8") as f:
        ddl = f.read()
    with psycopg.connect(get_dsn(), autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(ddl)
