"""
RiskManager
Phase 3: Lightweight risk validation utilities.

This module provides non-blocking validation that returns warnings to be surfaced
alongside backtest results or optimization responses.
"""

from __future__ import annotations

from typing import Dict, Any, List, Optional


class RiskManager:
    """
    Stateless validator that inspects backtest configuration for basic risk hygiene.
    All checks are non-blocking: they return warnings rather than raising errors.
    """

    def __init__(self) -> None:
        # Reasonable defaults; callers can extend via risk_management payload in requests if needed
        self.defaults = {
            "max_single_position_ratio": 0.10,  # not enforced here (engine-side concern), documented for future use
            "max_drawdown_threshold": 50.0,     # warn if configured greater than this
            "min_stop_loss": 0.1,               # warn if configured below this (too tight)
            "max_stop_loss": 50.0,              # warn if configured above this (too wide)
            "min_holding_period": 1,            # warn if too low
            "max_holding_period": 250,          # warn if too high for typical swing/positional strategies
        }

    def validate_config(self, cfg: Dict[str, Any]) -> List[str]:
        """
        Validate high-level backtest configuration. Returns a list of warning strings.
        Expected cfg keys:
          - holding_period: int
          - stop_loss: float
          - take_profit: Optional[float]
          - position_sizing: str
          - allow_leverage: bool
          - risk_management: dict (optional)
        """
        warnings: List[str] = []

        hp = int(cfg.get("holding_period", 10))
        sl = float(cfg.get("stop_loss", 5.0))
        tp = cfg.get("take_profit", None)
        sizing = str(cfg.get("position_sizing", "equal_weight"))
        allow_leverage = bool(cfg.get("allow_leverage", False))
        risk_mgmt = cfg.get("risk_management") or {}

        # Holding period sanity
        if hp < self.defaults["min_holding_period"]:
            warnings.append(f"Holding period {hp} < {self.defaults['min_holding_period']}: may be too short to realize edge.")
        if hp > self.defaults["max_holding_period"]:
            warnings.append(f"Holding period {hp} > {self.defaults['max_holding_period']}: consider shorter horizons for robustness.")

        # Stop loss sanity
        if sl < self.defaults["min_stop_loss"]:
            warnings.append(f"Stop loss {sl}% is unusually tight and may produce excessive churn.")
        if sl > self.defaults["max_stop_loss"]:
            warnings.append(f"Stop loss {sl}% is unusually wide and may expose the portfolio to large losses.")

        # Take profit sanity
        if tp is not None:
            try:
                tp_val = float(tp)
                if tp_val <= 0:
                    warnings.append(f"Take profit {tp_val}% is non-positive; consider a positive threshold or disable take profit.")
            except Exception:
                warnings.append("Take profit value is not numeric and was ignored.")

        # Position sizing sanity
        valid_sizing = {
            "equal_weight",
            "kelly",
            "volatility_target",
            "atr_based",
            "fixed_dollar",
            "percentage",
            "equalweight",  # tolerate minor variants
        }
        if sizing not in valid_sizing:
            warnings.append(f"Position sizing '{sizing}' is not recognized; falling back to equal_weight is recommended.")

        # Leverage
        if allow_leverage:
            warnings.append("Leverage enabled: ensure margin requirements and risk controls are in place.")

        # Additional risk settings
        max_dd = risk_mgmt.get("maxDrawdown")
        if max_dd is not None:
            try:
                max_dd_val = float(max_dd)
                if max_dd_val > self.defaults["max_drawdown_threshold"]:
                    warnings.append(f"Configured maxDrawdown {max_dd_val}% exceeds {self.defaults['max_drawdown_threshold']}%: consider stricter limits.")
            except Exception:
                warnings.append("Risk setting 'maxDrawdown' is not numeric and was ignored.")

        return warnings

    # Placeholder for future position-based validation hook
    def validate_positions(self, proposed_positions: Dict[str, Dict[str, Any]], portfolio_value: float) -> Dict[str, Any]:
        """
        Future extension: validate per-position limits and return adjustments.
        Currently returns pass-through result.
        """
        return {
            "valid": True,
            "violations": [],
            "adjusted_positions": proposed_positions,
        }