import asyncio
from typing import Dict

import pandas as pd

from plugins.base import PluginInterface


def compute_ema(series: pd.Series, period: int) -> pd.Series:
    """Compute Exponential Moving Average."""
    return series.ewm(span=period, adjust=False).mean()


def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Compute Relative Strength Index."""
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.rolling(window=period, min_periods=period).mean()
    avg_loss = loss.rolling(window=period, min_periods=period).mean()
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    rsi = rsi.fillna(0)
    rsi[avg_loss == 0] = 100
    return rsi


def compute_macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> pd.DataFrame:
    """Compute Moving Average Convergence Divergence."""
    ema_fast = compute_ema(series, fast)
    ema_slow = compute_ema(series, slow)
    macd_line = ema_fast - ema_slow
    signal_line = compute_ema(macd_line, signal)
    histogram = macd_line - signal_line
    return pd.DataFrame({"macd": macd_line, "signal": signal_line, "hist": histogram})


def compute_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    """Compute Average True Range."""
    high = df["high"]
    low = df["low"]
    close = df["close"]
    prev_close = close.shift(1)

    tr = pd.concat([
        (high - low),
        (high - prev_close).abs(),
        (low - prev_close).abs(),
    ], axis=1).max(axis=1)
    atr = tr.rolling(window=period, min_periods=period).mean()
    return atr


def determine_volatility_regime(atr_series: pd.Series, threshold: float = 0.75) -> str:
    """Classify volatility regime based on ATR percentile."""
    percentile = atr_series.rank(pct=True).iloc[-1]
    return "HIGH_VOLATILITY" if percentile >= threshold else "NORMAL_VOLATILITY"


class TechnicalPlugin(PluginInterface):
    """Plugin exposing technical indicator calculations."""

    async def _setup(self) -> None:
        await asyncio.sleep(0)

    async def execute(self, price_data: pd.DataFrame | None = None) -> Dict[str, float]:
        if price_data is None or price_data.empty:
            return {}
        close = price_data["close"]
        rsi_series = compute_rsi(close, self.config.get("rsi_period", 14))
        macd_df = compute_macd(
            close,
            self.config.get("ema_fast", 12),
            self.config.get("ema_slow", 26),
        )
        atr_series = compute_atr(price_data[["high", "low", "close"]])
        regime = determine_volatility_regime(atr_series, self.config.get("high_vol_threshold", 0.75))
        return {
            "rsi": float(rsi_series.iloc[-1]),
            "macd": float(macd_df["macd"].iloc[-1]),
            "signal": float(macd_df["signal"].iloc[-1]),
            "ema": float(compute_ema(close, self.config.get("ema_fast", 12)).iloc[-1]),
            "atr": float(atr_series.iloc[-1]),
            "regime": regime,
        }

