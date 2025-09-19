"""
BacktestOptimizer
Phase 3: Parameter optimization leveraging existing vectorized engine functions.
This module does NOT import BackTestEngine directly to avoid import mode issues.
Instead, pass the functions map (e.g., from backtest_api.backtest_functions) so we can call
run_single_parameter_combo(args) consistently.

Usage example:
optimizer = BacktestOptimizer(functions_map)
results = optimizer.optimize_parameters(
    signals_df=signals_df,
    vectorized_data=vectorized_data,
    base_cfg={
        "initial_capital": 100000,
        "signal_type": "long",
        "position_sizing": "equal_weight",
        "allow_leverage": False,
        "one_trade_per_instrument": False,
        "sizing_params": {},
    },
    param_ranges={
        "holding_period": [5, 10, 20],
        "stop_loss": [2.0, 5.0, 8.0],
        "take_profit": [None, 10.0, 15.0]
    },
    max_workers=None
)
"""

from typing import Dict, Any, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
import multiprocessing as mp
import logging
from itertools import product

import pandas as pd

try:
    # Prefer local import when used inside backend package
    from .performance_optimizer import PerformanceOptimizer
except Exception:
    # Fallback for direct script usage
    from performance_optimizer import PerformanceOptimizer


logger = logging.getLogger(__name__)


def _ensure_list(v) -> List[Any]:
    if v is None:
        return [None]
    if isinstance(v, list):
        return v
    return [v]


def _generate_param_combinations(param_ranges: Dict[str, List[Any]],
                                 defaults: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Build combinations across holding_period, stop_loss, take_profit.
    If a key is missing in param_ranges, fall back to defaults as a single choice.
    """
    hp_list = _ensure_list(param_ranges.get("holding_period", defaults.get("holding_period")))
    sl_list = _ensure_list(param_ranges.get("stop_loss", defaults.get("stop_loss")))
    tp_list = _ensure_list(param_ranges.get("take_profit", defaults.get("take_profit")))

    combos: List[Dict[str, Any]] = []
    for hp, sl, tp in product(hp_list, sl_list, tp_list):
        combos.append({"holding_period": hp, "stop_loss": sl, "take_profit": tp})
    return combos


class BacktestOptimizer:
    def __init__(self, functions_map: Dict[str, Any]):
        """
        functions_map should at least contain:
          - 'run_single_parameter_combo': Callable[[Tuple], Dict]
        """
        self.functions = functions_map
        self.performance_optimizer = PerformanceOptimizer()

        if "run_single_parameter_combo" not in self.functions:
            raise ValueError("functions_map must include 'run_single_parameter_combo'")

    def _build_args_tuple(
        self,
        vectorized_data: Dict[str, Any],
        signals_df: pd.DataFrame,
        hp: int,
        sl: float,
        tp: Optional[float],
        base_cfg: Dict[str, Any],
    ) -> Tuple[Any, ...]:
        """
        Match BackTestEngine.run_single_parameter_combo(args) signature:
        (vectorized_data, signals_data, hp, sl, tp, signal_type,
         initial_capital, sizing_method, sizing_params, one_trade_per_instrument, allow_leverage)
        """
        return (
            vectorized_data,
            signals_df,
            hp,
            sl,
            tp,
            base_cfg.get("signal_type", "long"),
            base_cfg.get("initial_capital", 100000),
            base_cfg.get("position_sizing", "equal_weight"),
            base_cfg.get("sizing_params", {}),
            base_cfg.get("one_trade_per_instrument", False),
            base_cfg.get("allow_leverage", False),
        )

    def optimize_parameters(
        self,
        signals_df: pd.DataFrame,
        vectorized_data: Dict[str, Any],
        base_cfg: Dict[str, Any],
        param_ranges: Dict[str, List[Any]],
        max_workers: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Run parameter optimization. Returns:
          {
            "all_results": List[Dict[str, Any]],
            "best_params": Dict[str, Any],
            "best_performance": Dict[str, Any]
          }
        """
        # Ensure reasonable workers
        if max_workers is None:
            try:
                max_workers = max(1, min(8, mp.cpu_count() - 1))
            except Exception:
                max_workers = 4

        # Generate combos with defaults for any missing keys
        defaults = {
            "holding_period": base_cfg.get("holding_period", 10),
            "stop_loss": base_cfg.get("stop_loss", 5.0),
            "take_profit": base_cfg.get("take_profit", None),
        }
        combos = _generate_param_combinations(param_ranges or {}, defaults)

        logger.info(f"Starting parameter optimization on {len(combos)} combinations using {max_workers} workers")

        all_results: List[Dict[str, Any]] = []
        best_params: Optional[Dict[str, Any]] = None
        best_performance: Optional[Dict[str, Any]] = None
        best_total_return = float("-inf")

        runner = self.functions["run_single_parameter_combo"]

        # Use threads to avoid pickling issues in some environments
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_params = {}
            for c in combos:
                args = self._build_args_tuple(
                    vectorized_data=vectorized_data,
                    signals_df=signals_df,
                    hp=int(c["holding_period"]),
                    sl=float(c["stop_loss"]),
                    tp=(None if c["take_profit"] in (None, "None", "") else float(c["take_profit"])),
                    base_cfg=base_cfg,
                )
                fut = executor.submit(runner, args)
                future_to_params[fut] = c

            for fut in as_completed(future_to_params):
                params = future_to_params[fut]
                try:
                    result = fut.result()
                except Exception as e:
                    logger.warning(f"Optimization combo {params} failed: {e}")
                    continue

                # result should be a summary dict from run_single_parameter_combo
                # use both camel-cased and snake-cased checks
                total_return = (
                    result.get("Total Return (%)")
                    if result.get("Total Return (%)") is not None
                    else result.get("total_return", 0)
                )
                total_return = float(total_return) if total_return is not None else 0.0

                all_results.append(
                    {
                        "params": params,
                        "performance": result,
                        "total_return": total_return,
                        "total_trades": result.get("Total Trades", result.get("total_trades", 0)),
                    }
                )

                if total_return > best_total_return:
                    best_total_return = total_return
                    best_params = params
                    best_performance = result

        return {
            "all_results": all_results,
            "best_params": best_params or {},
            "best_performance": best_performance or {},
        }