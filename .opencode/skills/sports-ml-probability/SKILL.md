---
name: sports-ml-probability
description: Use when designing, training, and deploying Machine Learning and statistical probability models for sports betting, fair odds calculation, vig removal, and expected value (+EV) detection.
---

# Sports ML & Probability Systems

Guía técnica especializada para el modelado cuantitativo, machine learning y sistemas probabilísticos en apuestas deportivas.

---

## 1. Fundamentos Matemáticos y Modelos Estadísticos

### A. Modelo Dixon-Coles y Distribución Poisson
Para deportes basados en anotaciones (fútbol, hockey, balonmano):
- Los goles del equipo local $X$ y visitante $Y$ se modelan asumiendo parámetros de ataque ($\alpha$), defensa ($\beta$), ventaja de local ($\gamma$) y promedio de goles ($\mu$):
  $$\lambda = \exp(\mu + \alpha_i + \beta_j + \gamma)$$
  $$\mu_{visita} = \exp(\mu + \alpha_j + \beta_i)$$
- **Ajuste Dixon-Coles:** Modifica las probabilidades de marcadores con pocos goles (0-0, 1-0, 0-1, 1-1) para corregir la subestimación de empates propia del Poisson estándar:
  $$\tau(x, y) = \begin{cases} 1 - \lambda \mu \rho & \text{si } x=0, y=0 \\ 1 + \lambda \rho & \text{si } x=0, y=1 \\ 1 + \mu \rho & \text{si } x=1, y=0 \\ 1 - \rho & \text{si } x=1, y=1 \\ 1 & \text{en otro caso} \end{cases}$$
- Ponderación temporal: Ajustar la función de verosimilitud con decaimiento exponencial $\phi(t) = \exp(-\xi (T - t))$ para otorgar más peso a partidos recientes.

---

## 2. Eliminación de Margen (Vig / Overround Removal)

Las cuotas de los bookmakers contienen el margen de la casa (Overround > 1.0). Para obtener la probabilidad implícita real del mercado:

### Método Shin (Recomendado para Sharp Books)
Modela que una fracción $z$ del mercado tiene información privilegiada (*insider trading*):
$$p_i = \frac{\sqrt{z^2 + 4(1-z) \frac{\pi_i^2}{\sum \pi_j}} - z}{2(1-z)}$$
Donde $\pi_i = \frac{1}{\text{Cuota}_i}$.

### Método Proporcional (Básico) y Power Method:
- **Proporcional:** $P_i = \frac{1 / \text{Cuota}_i}{\sum_{j} (1 / \text{Cuota}_j)}$
- **Power Method (Shin simplificado):** Resolver $k$ tal que $\sum (1 / \text{Cuota}_i)^k = 1$. Entonces $P_i = (1 / \text{Cuota}_i)^k$.

---

## 3. Pipeline de Machine Learning Supervisado

### Modelos recomendados:
- **LightGBM / XGBoost / CatBoost:** Para datos tabulares estructurados con métricas avanzadas (xG, tiros a puerta, posesión en campo rival, ratings Elo).
- **Target:** Clasificación multiclase (1, X, 2) o regresión probabilística bivariada (goles esperados local/visita).

### Métrica de Optimización Obligatoria:
No optimizar `accuracy` ni `F1-score`. Optimizar funciones de pérdida probabilística:
1. **Multi-class Log Loss:** Penaliza severamente predicciones confiadas pero erróneas.
2. **Brier Score:** Error cuadrático medio de las probabilidades:
   $$\text{Brier} = \frac{1}{N} \sum_{t=1}^N \sum_{i=1}^R (f_{ti} - o_{ti})^2$$

### Calibración de Probabilidades:
Los clasificadores de árboles no calibran naturalmente las probabilidades en los extremos.
- Usar `CalibratedClassifierCV(model, method='isotonic', cv='prefit')` o Platt Scaling (sigmoide) para asegurar que un 65% predicho signifique que el evento ocurre el 65% de las veces.

```python
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import brier_score_loss, log_loss
import lightgbm as lgb

# Entrenamiento de base con objective multiclass
params = {
    'objective': 'multiclass',
    'num_class': 3,
    'metric': 'multi_logloss',
    'learning_rate': 0.03,
    'max_depth': 5
}
# Calibración sobre conjunto de validación temporal
calibrator = CalibratedClassifierCV(estimator=base_model, method='isotonic', cv='prefit')
calibrator.fit(X_val, y_val)
probabilidades_calibradas = calibrator.predict_proba(X_test)
```

---

## 4. Expected Value (+EV) y Criterio de Kelly

### Cálculo de Valor Esperado (+EV):
Una apuesta tiene valor positivo si:
$$\text{EV} = (P_{\text{modelo}} \times \text{Cuota}_{\text{mercado}}) - 1 > 0$$
- Ejemplo: Si el modelo da $P = 0.52$ para victoria local y la casa paga cuota $2.10$:
  $$\text{EV} = (0.52 \times 2.10) - 1 = 1.092 - 1 = +0.092 \implies +9.2\% \text{ EV}$$

### Dimensionamiento con Criterio de Kelly Fraccional:
Para evitar la bancarrota ante rachas de varianza negativa, **nunca usar Kelly completo**:
$$f^* = \text{Fracción} \times \frac{b \cdot p - q}{b}$$
- $b = \text{Cuota} - 1$ (ganancia neta por unidad apostada).
- $p = \text{probabilidad estimada por el modelo}$.
- $q = 1 - p$.
- **Recomendación:** Usar **Quarter-Kelly** (Fracción = 0.25) con un tope máximo del 2% al 3% del bankroll total por apuesta.

---

## 5. Contrato de Salida para la API y Frontend

Cada predicción generada por el módulo ML debe exportarse con el siguiente esquema JSON para que el frontend Next.js la consuma de forma directa:

```json
{
  "match_id": "match_uuid_123",
  "sport": "football",
  "league": "LaLiga",
  "home_team": "Real Madrid",
  "away_team": "Barcelona",
  "start_time": "2026-09-20T19:00:00Z",
  "market": "1X2",
  "probabilities": {
    "home": 0.512,
    "draw": 0.268,
    "away": 0.220
  },
  "fair_odds": {
    "home": 1.95,
    "draw": 3.73,
    "away": 4.55
  },
  "market_odds": {
    "home": 2.15,
    "draw": 3.40,
    "away": 3.20
  },
  "value_analysis": {
    "best_selection": "home",
    "expected_value_pct": 10.08,
    "is_value_bet": true,
    "confidence_level": "high",
    "recommended_kelly_stake_pct": 2.34
  }
}
```
