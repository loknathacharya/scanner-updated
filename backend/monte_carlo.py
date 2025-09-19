"""
MonteCarloSimulator
Phase 3: Monte Carlo analysis on trade return samples.

This module runs bootstrap simulations on historical trade results to estimate
future performance distribution. It is intentionally independent from Streamlit.

Typical usage:
    sim = MonteCarloSimulator()
    out = sim.run_simulation(trade_log_df, n_simulations=1000, n_trades=50)

Returned shape:
{
  "simulations": [ ... percentages ... ],
  "mean_return": float,
  "std_return": float,
  "percentiles": {
    "5th": float,
    "25th": float,
    "50th": float,
    "75th": float,
    "95th": float
  }
}
"""

from __future__ import annotations

from typing import Dict, Any, Optional, Sequence
import logging
import numpy as np
import pandas as pd


logger = logging.getLogger(__name__)


class MonteCarloSimulator:
    def __init__(self, rng_seed: Optional[int] = None):
        """
        Args:
            rng_seed: Optional seed for reproducibility
        """
        self._rng = np.random.default_rng(rng_seed) if rng_seed is not None else np.random.default_rng()

    def _extract_returns_series(self, trade_log_df: pd.DataFrame) -> np.ndarray:
        """
        Extract a 1-D numpy array of trade returns in decimal form from a trade log.
        Accepts either:
          - 'Profit/Loss (%)' as percent values (e.g., 2.5 = 2.5%)
          - 'Portfolio Return' as decimal values (e.g., 0.025 = 2.5%)

        Returns:
            np.ndarray of decimal returns (e.g., 0.025 for 2.5%)
        """
        if trade_log_df is None or len(trade_log_df) == 0:
            return np.array([], dtype=float)

        if "Profit/Loss (%)" in trade_log_df.columns:
            series = pd.to_numeric(trade_log_df["Profit/Loss (%)"], errors="coerce").dropna().astype(float) / 100.0
        elif "Portfolio Return" in trade_log_df.columns:
            series = pd.to_numeric(trade_log_df["Portfolio Return"], errors="coerce").dropna().astype(float)
        else:
            logger.warning("Trade log does not contain 'Profit/Loss (%)' or 'Portfolio Return'. Returning empty series.")
            series = pd.Series(dtype=float)

        # Ensure concrete numpy ndarray type for static typing tools
        return np.asarray(series.to_numpy(), dtype=float)

    def run_simulation(
        self,
        trade_log_df: pd.DataFrame,
        n_simulations: int = 1000,
        n_trades: int = 50,
        allow_negative: bool = True,
    ) -> Dict[str, Any]:
        """
        Run Monte Carlo bootstrap on historical trade returns.

        Args:
            trade_log_df: DataFrame of executed trades; must include either 'Profit/Loss (%)' or 'Portfolio Return'
            n_simulations: Number of bootstrap paths to generate
            n_trades: Number of trades to sample per simulation
            allow_negative: Whether to permit negative cumulative results (always should be True, but kept for API compatibility)

        Returns:
            Dict with simulations array (percent), summary stats, and key percentiles
        """
        returns = self._extract_returns_series(trade_log_df)

        if returns.size == 0:
            logger.warning("No trade returns available for Monte Carlo; returning empty result.")
            return {
                "simulations": [],
                "mean_return": 0.0,
                "std_return": 0.0,
                "percentiles": {k: 0.0 for k in ("5th", "25th", "50th", "75th", "95th")},
            }

        # Pre-allocate for performance
        simulations_pct = np.empty(n_simulations, dtype=float)

        for i in range(n_simulations):
            # Sample with replacement
            idx = self._rng.integers(low=0, high=returns.size, size=n_trades)
            sampled = returns[idx]
            # Compound
            final_return = float(np.prod(1.0 + sampled) - 1.0)
            # Convert to percent
            simulations_pct[i] = final_return * 100.0

        mean_ret = float(np.mean(simulations_pct)) if simulations_pct.size > 0 else 0.0
        std_ret = float(np.std(simulations_pct, ddof=1)) if simulations_pct.size > 1 else 0.0

        percentiles = {
            "5th": float(np.percentile(simulations_pct, 5)) if simulations_pct.size > 0 else 0.0,
            "25th": float(np.percentile(simulations_pct, 25)) if simulations_pct.size > 0 else 0.0,
            "50th": float(np.percentile(simulations_pct, 50)) if simulations_pct.size > 0 else 0.0,
            "75th": float(np.percentile(simulations_pct, 75)) if simulations_pct.size > 0 else 0.0,
            "95th": float(np.percentile(simulations_pct, 95)) if simulations_pct.size > 0 else 0.0,
        }

        return {
            "simulations": simulations_pct.tolist(),
            "mean_return": mean_ret,
            "std_return": std_ret,
            "percentiles": percentiles,
        }