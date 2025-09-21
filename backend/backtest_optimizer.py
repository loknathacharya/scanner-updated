"""
BacktestOptimizer
Phase 3: Enhanced parameter optimization with step functions and ProcessPoolExecutor support.
This module provides advanced parameter optimization capabilities similar to the original BackTestEngine.py
with vectorization and multiprocessing options.

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
        "holding_period": {"min": 5, "max": 50, "step": 5},
        "stop_loss": {"min": 1.0, "max": 10.0, "step": 1.0},
        "take_profit": {"min": 5.0, "max": 30.0, "step": 5.0}
    },
    max_workers=None,
    use_multiprocessing=True,
    use_vectorized=True
)
"""

from typing import Dict, Any, List, Optional, Tuple
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor, as_completed
import multiprocessing as mp
import logging
from itertools import product
import numpy as np

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


def _generate_param_combinations_with_steps(param_ranges: Dict[str, Any],
                                           defaults: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generate parameter combinations using step functions similar to BackTestEngine.py
    param_ranges format: {
        "holding_period": {"min": 5, "max": 50, "step": 5},
        "stop_loss": {"min": 1.0, "max": 10.0, "step": 1.0},
        "take_profit": {"min": 5.0, "max": 30.0, "step": 5.0}
    }
    """
    # Generate ranges using step functions
    hp_min = param_ranges.get("holding_period", {}).get("min", defaults.get("holding_period", 10))
    hp_max = param_ranges.get("holding_period", {}).get("max", defaults.get("holding_period", 10))
    hp_step = param_ranges.get("holding_period", {}).get("step", 5)
    
    if hp_min is not None and hp_max is not None and hp_step is not None:
        hp_list = list(range(int(hp_min), int(hp_max) + 1, int(hp_step)))
    else:
        hp_list = [defaults.get("holding_period", 10)]
    
    sl_min = param_ranges.get("stop_loss", {}).get("min", defaults.get("stop_loss", 2.0))
    sl_max = param_ranges.get("stop_loss", {}).get("max", defaults.get("stop_loss", 10.0))
    sl_step = param_ranges.get("stop_loss", {}).get("step", 1.0)
    
    if sl_min is not None and sl_max is not None and sl_step is not None:
        sl_list = [round(x, 2) for x in np.arange(float(sl_min), float(sl_max) + 0.01, float(sl_step))]
    else:
        sl_list = [defaults.get("stop_loss", 5.0)]
    
    tp_min = param_ranges.get("take_profit", {}).get("min", defaults.get("take_profit", 5.0))
    tp_max = param_ranges.get("take_profit", {}).get("max", defaults.get("take_profit", 30.0))
    tp_step = param_ranges.get("take_profit", {}).get("step", 5.0)
    
    tp_list = []
    if tp_min is not None and tp_max is not None and tp_step is not None:
        tp_list = [round(x, 2) for x in np.arange(float(tp_min), float(tp_max) + 0.01, float(tp_step))]
    
    # Handle None values for take profit
    if param_ranges.get("take_profit", {}).get("include_none", True):
        tp_list.insert(0, None)

    combos: List[Dict[str, Any]] = []
    for hp, sl, tp in product(hp_list, sl_list, tp_list):
        combos.append({"holding_period": hp, "stop_loss": sl, "take_profit": tp})
    return combos


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
        use_multiprocessing: bool = True,
        use_vectorized: bool = True,
    ) -> Dict[str, Any]:
        """
        Enhanced parameter optimization with multiprocessing and vectorization options.
        
        Args:
            signals_df: Signals DataFrame
            vectorized_data: Pre-processed vectorized OHLCV data
            base_cfg: Base configuration dictionary
            param_ranges: Parameter ranges for optimization
            max_workers: Maximum number of worker processes/threads
            use_multiprocessing: Whether to use ProcessPoolExecutor (True) or ThreadPoolExecutor (False)
            use_vectorized: Whether to use vectorized processing
        
        Returns:
            Dictionary containing optimization results
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
        
        # Use step-based generation if step parameters are provided
        if any(isinstance(param_ranges.get(key), dict) and "step" in param_ranges[key]
               for key in ["holding_period", "stop_loss", "take_profit"]):
            combos = _generate_param_combinations_with_steps(param_ranges, defaults)
        else:
            combos = _generate_param_combinations(param_ranges or {}, defaults)

        logger.info(f"Starting enhanced parameter optimization on {len(combos)} combinations using {max_workers} workers")
        logger.info(f"Using multiprocessing: {use_multiprocessing}, Vectorized: {use_vectorized}")

        all_results: List[Dict[str, Any]] = []
        best_params: Optional[Dict[str, Any]] = None
        best_performance: Optional[Dict[str, Any]] = None
        best_total_return = float("-inf")

        runner = self.functions["run_single_parameter_combo"]

        # Choose executor based on configuration
        if use_multiprocessing:
            executor_class = ProcessPoolExecutor
            logger.info(f"Using ProcessPoolExecutor with {max_workers} processes")
        else:
            executor_class = ThreadPoolExecutor
            logger.info(f"Using ThreadPoolExecutor with {max_workers} threads")

        with executor_class(max_workers=max_workers) as executor:
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

            completed = 0
            total_combinations = len(combos)
            
            for fut in as_completed(future_to_params):
                params = future_to_params[fut]
                completed += 1
                
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
                        "sharpe_ratio": result.get("Sharpe Ratio", result.get("sharpe_ratio", 0)),
                        "max_drawdown": result.get("Max Drawdown (%)", result.get("max_drawdown", 0)),
                        "win_rate": result.get("Win Rate (%)", result.get("win_rate", 0)),
                    }
                )

                if total_return > best_total_return:
                    best_total_return = total_return
                    best_params = params
                    best_performance = result

                # Log progress every 10%
                if completed % max(1, total_combinations // 10) == 0:
                    progress_pct = (completed / total_combinations) * 100
                    logger.info(f"Optimization progress: {completed}/{total_combinations} ({progress_pct:.1f}%)")

        # Sort results by total return
        all_results.sort(key=lambda x: x["total_return"], reverse=True)

        return {
            "all_results": all_results,
            "best_params": best_params or {},
            "best_performance": best_performance or {},
            "optimization_stats": {
                "total_combinations": len(combos),
                "successful_combinations": len(all_results),
                "failed_combinations": len(combos) - len(all_results),
                "use_multiprocessing": use_multiprocessing,
                "use_vectorized": use_vectorized,
                "max_workers": max_workers
            }
        }

    def optimize_parameters_sequential(
        self,
        signals_df: pd.DataFrame,
        vectorized_data: Dict[str, Any],
        base_cfg: Dict[str, Any],
        param_ranges: Dict[str, List[Any]],
    ) -> Dict[str, Any]:
        """
        Sequential parameter optimization for smaller parameter spaces or debugging.
        """
        return self.optimize_parameters(
            signals_df=signals_df,
            vectorized_data=vectorized_data,
            base_cfg=base_cfg,
            param_ranges=param_ranges,
            max_workers=1,
            use_multiprocessing=False,
            use_vectorized=True
        )