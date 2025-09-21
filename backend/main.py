from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import traceback
from typing import List, Optional, Union, Dict
from datetime import datetime
import sys
import os

# Add the current directory to Python path (if needed)
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import custom modules with error handling
from utils_module import DataProcessor
from filters_module import FilterEngine
from advanced_filter_engine import AdvancedFilterEngine

from pydantic import BaseModel

app = FastAPI()
data_processor = DataProcessor()
filter_engine = FilterEngine()
advanced_filter_engine = AdvancedFilterEngine()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for the processed data
# For a production application, you might consider a more robust solution
# like a database or a dedicated caching layer.
processed_data: Optional[pd.DataFrame] = None
saved_filters: Dict[str, Union[str, dict]] = {}

class FilterRequest(BaseModel):
    filter: Union[str, dict]
    date_range: Optional[list[str]] = None

@app.get("/")
def read_root():
    return {"message": "Stock Scanner API is running."}

@app.post("/api/upload")
async def upload_data(file: UploadFile = File(...)):
    """
    Uploads a data file (CSV, XLSX, Parquet), processes it, and stores it in memory.
    """
    global processed_data
    try:
        # Use the data_processor to load the file
        df = data_processor.load_file(file, file.filename or "")
        
        # Basic data processing (can be expanded later)
        detected_cols = data_processor.detect_columns(df)
        date_col = detected_cols.get('date')
        symbol_col = detected_cols.get('symbol')

        if not date_col or not symbol_col:
            raise HTTPException(
                status_code=400,
                detail="Could not automatically detect 'date' and 'symbol' columns. Please ensure they are present in the file."
            )

        processed_data = data_processor.process_data(df, date_col, symbol_col, detected_cols)
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "File uploaded and processed successfully.",
                "shape": processed_data.shape,
                "columns": processed_data.columns.to_list(),
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred: {str(e)}\n{traceback.format_exc()}"
        )

@app.get("/api/data/summary")
async def get_data_summary():
    """
    Returns summary statistics of the processed data.
    """
    if processed_data is None:
        raise HTTPException(status_code=404, detail="No data has been uploaded yet.")
    
    try:
        # Get numeric columns for summary stats
        numeric_cols = processed_data.select_dtypes(include=[np.number]).columns.tolist()
        # Replace NaN values with None for JSON serialization
        summary_stats = processed_data[numeric_cols].describe().replace({np.nan: None}).to_dict()
        
        # Get unique symbols count
        symbol_col = None
        # Try to find symbol column (it should have been detected during upload)
        for col in processed_data.columns:
            if 'symbol' in col.lower():
                symbol_col = col
                break
                
        unique_symbols = processed_data[symbol_col].nunique() if symbol_col and symbol_col in processed_data.columns else 0
        
        # Get date range
        date_col = None
        # Try to find date column (it should have been detected during upload)
        for col in processed_data.columns:
            if 'date' in col.lower():
                date_col = col
                break
                
        date_range = {}
        if date_col and date_col in processed_data.columns:
            try:
                min_date = processed_data[date_col].min()
                max_date = processed_data[date_col].max()
                # Convert to string for JSON serialization
                date_range = {
                    "min": str(min_date) if pd.notna(min_date) else None,
                    "max": str(max_date) if pd.notna(max_date) else None
                }
            except Exception as e:
                print(f"Error calculating date range: {str(e)}")
                date_range = {"min": None, "max": None}
        
        # Get first 5 rows for preview
        preview_data = processed_data.head(5).to_dict(orient="records")
        # Convert any Timestamp objects to strings
        for record in preview_data:
            for key, value in record.items():
                if pd.api.types.is_datetime64_any_dtype(type(value)) or isinstance(value, pd.Timestamp):
                    record[key] = str(value)
                elif pd.isna(value):
                    record[key] = None

        return JSONResponse(
            status_code=200,
            content={
                "message": "Data summary retrieved successfully.",
                "shape": processed_data.shape,
                "columns": processed_data.columns.tolist(),
                "unique_symbols": unique_symbols,
                "date_range": date_range,
                "preview": preview_data,
                "summary_stats": summary_stats,
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"An error occurred: {str(e)}\n{traceback.format_exc()}"
        )

@app.post("/api/filters/apply")
async def apply_filter(request: FilterRequest):
    """
    Applies a filter to the processed data.
    The filter can be a simple string or a JSON object.
    """
    if processed_data is None:
        raise HTTPException(status_code=404, detail="No data has been uploaded yet.")

    try:
        filter_definition = request.filter
        date_range = request.date_range

        if isinstance(filter_definition, dict):
            # It's a JSON filter
            results = advanced_filter_engine.apply_filter(processed_data, filter_definition)
        else:
            # It's a simple string filter
            date_range_tuple = tuple(date_range) if date_range else (None, None)
            results = filter_engine.apply_filter(processed_data, filter_definition, date_range_tuple)

        # Convert Timestamp objects to strings for JSON serialization
        results_dict = results.to_dict(orient="records")
        for record in results_dict:
            for key, value in record.items():
                if pd.api.types.is_datetime64_any_dtype(type(value)) or isinstance(value, pd.Timestamp):
                    record[key] = str(value)
                elif pd.isna(value):
                    record[key] = None

        return JSONResponse(
            status_code=200,
            content={
                "message": "Filter applied successfully.",
                "results": results_dict,
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error applying filter: {str(e)}\n{traceback.format_exc()}"
        )

@app.get("/api/filters/saved")
async def get_saved_filters():
    """Returns all saved filters"""
    return JSONResponse(
        status_code=200,
        content={
            "saved_filters": saved_filters
        }
    )

@app.post("/api/filters/saved")
async def save_filter(filter_request: dict):
    """Saves a new filter"""
    try:
        filter_name = filter_request.get("name")
        filter_definition = filter_request.get("filter")
        
        if not filter_name or not filter_definition:
            raise HTTPException(
                status_code=400,
                detail="Both 'name' and 'filter' fields are required"
            )
            
        saved_filters[filter_name] = filter_definition
        return JSONResponse(
            status_code=200,
            content={"message": f"Filter '{filter_name}' saved successfully"}
        )
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error saving filter: {str(e)}"
        )

@app.delete("/api/filters/saved/{filter_name}")
async def delete_saved_filter(filter_name: str):
    """Deletes a saved filter"""
    try:
        if filter_name not in saved_filters:
            raise HTTPException(
                status_code=404,
                detail=f"Filter '{filter_name}' not found"
            )
            
        del saved_filters[filter_name]
        return {"message": f"Filter '{filter_name}' deleted successfully"}
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting filter: {str(e)}"
        )

from backtest_api import router as backtest_router
app.include_router(backtest_router, prefix="/api/backtest", tags=["backtest"])

# Phase 2 support: expose processed OHLCV data for frontend to call
from fastapi import Query

@app.get("/api/data/ohlcv")
async def get_ohlcv_data(limit: int = Query(5000, ge=1, le=200000)):
    """
    Return processed OHLCV rows standardized to:
    symbol, date, open, high, low, close, volume

    Query:
      - limit: max rows to return (default 5000)
    """
    if processed_data is None:
        raise HTTPException(status_code=404, detail="No data has been uploaded yet.")

    try:
        df = processed_data.copy()

        # Helper to find a column by case-insensitive exact name or substring
        def pick_col(candidates_exact, candidates_contains=None):
            cols = list(df.columns)
            lower_map = {c.lower(): c for c in cols}
            # exact match first
            for name in candidates_exact:
                if name in lower_map:
                    return lower_map[name]
            # contains fallback
            if candidates_contains:
                for sub in candidates_contains:
                    for c in cols:
                        if sub in c.lower():
                            return c
            return None

        # Detect required columns
        symbol_col = pick_col(["symbol", "ticker", "stock", "code"], ["symbol", "ticker", "stock", "code"])
        date_col = pick_col(["date", "datetime", "timestamp", "time"], ["date", "datetime", "timestamp", "time"])
        open_col = pick_col(["open"])
        high_col = pick_col(["high"])
        low_col  = pick_col(["low"])
        close_col= pick_col(["close"])
        vol_col  = pick_col(["volume", "vol"])

        required = {
            "symbol": symbol_col,
            "date": date_col,
            "open": open_col,
            "high": high_col,
            "low": low_col,
            "close": close_col,
            "volume": vol_col
        }
        missing = [k for k,v in required.items() if v is None]
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns in processed data: {missing}. Columns present: {list(df.columns)}"
            )

        # Normalize and select
        sel = df[[symbol_col, date_col, open_col, high_col, low_col, close_col, vol_col]].head(limit).copy()
        # Standardize keys expected by backtest API transformer (lower-case)
        sel.rename(columns={
            symbol_col: "symbol",
            date_col: "date",
            open_col: "open",
            high_col: "high",
            low_col: "low",
            close_col: "close",
            vol_col: "volume",
        }, inplace=True)

        # Normalize date to ISO string
        try:
            sel["date"] = pd.to_datetime(sel["date"], errors="coerce").dt.strftime("%Y-%m-%d")
        except Exception:
            sel["date"] = sel["date"].astype(str)

        # Replace NaNs with None for JSON
        data = sel.where(pd.notnull(sel), None).to_dict(orient="records")

        return JSONResponse(
            status_code=200,
            content={
                "message": "OHLCV data exported successfully",
                "count": len(data),
                "limit": limit,
                "columns": ["symbol", "date", "open", "high", "low", "close", "volume"],
                "data": data
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export OHLCV data: {str(e)}\n{traceback.format_exc()}"
        )