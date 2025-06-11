import pandas as pd

from plugins.analysis.technical import compute_rsi, determine_volatility_regime, compute_atr


def test_compute_rsi_uptrend():
    prices = pd.Series(range(1, 16))  # Strictly increasing
    rsi = compute_rsi(prices, period=14)
    assert round(rsi.iloc[-1], 2) == 100.0


def test_volatility_regime_detection():
    data = pd.DataFrame({
        "high": [1, 2, 3, 4, 5],
        "low": [0.5, 1, 2, 3, 4],
        "close": [0.8, 1.5, 2.5, 3.5, 4.5],
    })
    atr = compute_atr(data, period=3)
    regime = determine_volatility_regime(atr, threshold=0.6)
    assert regime == "HIGH_VOLATILITY"
