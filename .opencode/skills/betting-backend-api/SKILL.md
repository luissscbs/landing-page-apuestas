---
name: betting-backend-api
description: Use when developing backend REST APIs, WebSocket feeds, Redis caching, and odds serving architecture for the sports betting landing and application.
---

# Betting Backend & Odds Serving API

Guía de desarrollo para el backend de alto rendimiento encargado de procesar cuotas, exponer predicciones de Machine Learning y alimentar el frontend Next.js.

---

## 1. Arquitectura Recomendada

- **Stack:** Python 3.11+ con **FastAPI** (asíncrono, validación nativa con Pydantic v2) o **Node.js/NestJS**.
- **Capa de Memoria / Caché:** **Redis** (fundamental para absorber el tráfico del frontend y proteger los límites de peticiones de las APIs deportivas externas).
- **Base de Datos:** **PostgreSQL** para persistencia de partidos, usuarios, historial de cuotas y registros de valor.

---

## 2. Estrategia de Caché en Redis

Las cuotas cambian dinámicamente según se acerca el inicio del evento. Aplicar TTL escalonado:

| Tipo de Evento | TTL en Redis | Razón |
| :--- | :--- | :--- |
| **Próximos (> 24 horas)** | 300 segundos (5 min) | Pocos movimientos de mercado |
| **Próximos (< 2 horas)** | 30 segundos | Ajustes por alineaciones |
| **En Vivo (Live In-Play)** | 3 - 5 segundos | Volatilidad extrema de cuotas |
| **Predicciones ML** | 60 segundos | Re-evaluación periódica de valor |
| **Partidos Finalizados** | 86400 segundos (24h) | Datos inmutables |

```python
# Ejemplo de cache-aside en FastAPI con Redis
import json
from fastapi import APIRouter, Depends
import redis.asyncio as aioredis

router = APIRouter(prefix="/api/v1")

@router.get("/odds/upcoming")
async def get_upcoming_odds(redis: aioredis.Redis = Depends(get_redis)):
    cache_key = "odds:upcoming:top_matches"
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)
        
    data = await fetch_and_calculate_odds_from_db_or_ml()
    await redis.set(cache_key, json.dumps(data), ex=30)
    return data
```

---

## 3. Especificación de Endpoints para el Frontend

### `GET /api/v1/odds/upcoming`
Devuelve los partidos destacados con sus cuotas y el análisis de valor calculado por el modelo de ML:
```json
[
  {
    "match_id": "laliga-2026-rm-atm",
    "league": "LaLiga EA Sports",
    "sport": "football",
    "start_time": "2026-09-21T20:00:00Z",
    "home_team": { "name": "Real Madrid", "short": "RMA", "logo_url": "/teams/rma.png" },
    "away_team": { "name": "Atlético Madrid", "short": "ATM", "logo_url": "/teams/atm.png" },
    "odds_1x2": { "home": 1.95, "draw": 3.40, "away": 4.10 },
    "ml_prediction": {
      "home_win_prob": 0.53,
      "draw_prob": 0.28,
      "away_win_prob": 0.19,
      "fair_odds_home": 1.88,
      "best_bet": "home",
      "expected_value_pct": 3.35,
      "badge": "VALUE_PICK"
    }
  }
]
```

### `GET /api/v1/predictions/value`
Devuelve únicamente las oportunidades con $EV > 5\%$ detectadas por el sistema en las próximas 48 horas.

### `WS /api/v1/odds/live`
WebSocket para emitir cambios de cuotas en vivo, alertas de goles y variaciones de probabilidad en tiempo real hacia componentes React.

---

## 4. Configuración de Seguridad y CORS

El frontend Next.js se comunica desde dominios permitidos (desarrollo `localhost:3000` y producción de la landing):
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://app.p50sports.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
```
