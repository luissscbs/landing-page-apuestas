---
name: betting-backtest-clv
description: Use when evaluating sports betting models, performing temporal backtesting, calculating Closing Line Value (CLV), and running Monte Carlo simulations.
---

# Betting Backtest & Closing Line Value (CLV)

Guía de ingeniería cuantitativa para validar sistemas de apuestas deportivas sin incurrir en sesgos estadísticos.

---

## 1. Protocolo Anti-Sesgos en Backtesting

### A. Temporal Walk-Forward Validation (Cero Data Leakage)
En apuestas deportivas, la validación cruzada estándar ($k$-fold aleatorio) es un error crítico que filtra información del futuro:
- **Regla:** Ordenar cronológicamente todos los partidos.
- **Ventana rodante o acumulativa:**
  - Entrenar con datos de la fecha $T_0$ a $T_{n}$.
  - Predecir únicamente la jornada siguiente $T_{n+1}$.
  - Re-entrenar o actualizar parámetros de ratings y añadir $T_{n+1}$ al set histórico.

### B. Prohibición de Datos Ex-Post
- Solo usar variables que estaban disponibles **al menos 15 minutos antes del inicio del evento** (alineaciones confirmadas, cuotas pre-partido, cuotas de apertura).
- No usar estadísticas finales del partido en la generación de features de ese mismo partido.

---

## 2. Closing Line Value (CLV): El Estándar Cuantitativo

El resultado individual de un partido tiene alta varianza (un tiro al poste en el 93' no invalida un modelo). El **Closing Line Value (CLV)** mide si conseguiste cuotas superiores a la cuota de cierre de casas de referencia agudas (*Sharp Books* como Pinnacle o Betfair Exchange sin margen).

### Cálculo de CLV:
$$\text{CLV} = \left( \frac{\text{Cuota Apostada}}{\text{Cuota Cierre Sin Margen}} \right) - 1$$
- Si apostaste a **2.15** y la cuota de cierre limpia fue **1.95**:
  $$\text{CLV} = \frac{2.15}{1.95} - 1 = +10.25\%$$
- **Regla de oro:** Un modelo con CLV medio positivo constante (+2% a +5%) bate matemáticamente al mercado a largo plazo, independientemente de la varianza a corto plazo.

---

## 3. Métricas Financieras Esenciales

1. **Turnover:** Monto total apostado acumulado.
2. **Yield / ROI (%):**
   $$\text{Yield} = \frac{\text{Beneficio Neto Total}}{\text{Turnover Total}} \times 100$$
3. **Maximum Drawdown (MDD):**
   $$\text{MDD} = \frac{\text{Pico Máximo de Bankroll} - \text{Mínimo Posterior}}{\text{Pico Máximo}} \times 100$$
4. **Hit Rate (% aciertos):** Depende del rango de cuotas (un modelo de cuotas 3.0 con 40% de aciertos es altamente rentable).

---

## 4. Simulación Monte Carlo

Para medir el riesgo de ruina y el rango de varianza estadística:
- Simular **10,000 trayectorias sintéticas** reordenando aleatoriamente la secuencia de apuestas ganadas/perdidas con reposición (*bootstraping*).
- Extraer percentiles de bankroll: P5 (peor escenario razonable), P50 (mediana), P95 (escenario optimista).

```python
import numpy as np
import pandas as pd

def run_monte_carlo(bets_df: pd.DataFrame, initial_bankroll: float = 1000.0, num_simulations: int = 5000):
    """
    bets_df debe contener 'odds', 'won' (bool) y 'stake'
    """
    results = []
    max_drawdowns = []
    
    n_bets = len(bets_df)
    for _ in range(num_simulations):
        sampled = bets_df.sample(n=n_bets, replace=True)
        profits = np.where(sampled['won'], sampled['stake'] * (sampled['odds'] - 1), -sampled['stake'])
        curve = initial_bankroll + np.cumsum(profits)
        
        # Drawdown
        peak = np.maximum.accumulate(curve)
        dd = (peak - curve) / peak
        max_drawdowns.append(np.max(dd) * 100)
        results.append(curve[-1])
        
    return {
        "median_final_bank": np.median(results),
        "p5_worst_bank": np.percentile(results, 5),
        "p95_best_bank": np.percentile(results, 95),
        "p95_max_drawdown_pct": np.percentile(max_drawdowns, 95)
    }
```
