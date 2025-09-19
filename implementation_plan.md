# JSON-Based Filtering System Implementation Plan

## Phase 1: Core JSON Parser (Priority: High)

### Task 1.1: Create JSON Filter Parser Module
**File**: `json_filter_parser.py`
**Components**:
- `JSONFilterParser` class
- JSON schema validation
- Operand parsing logic

**Key Methods**:
```python
class JSONFilterParser:
    def __init__(self):
        self.schema = self._load_schema()
    
    def validate_json(self, json_data: dict) -> tuple[bool, str]:
        """Validate JSON against schema"""
        
    def parse_operands(self, operand_data: dict) -> dict:
        """Parse operand into structured format"""
        
    def build_filter_expression(self, conditions: list, logic: str) -> str:
        """Build executable filter expression"""
        
    def _load_schema(self) -> dict:
        """Load JSON validation schema"""
```

**Dependencies**: `jsonschema`, `typing`

**Estimated Time**: 4-6 hours

### Task 1.2: Create Operand Calculator
**File**: `operand_calculator.py`
**Components**:
- `OperandCalculator` class
- Column value calculation with offset
- Indicator calculation with offset

**Key Methods**:
```python
class OperandCalculator:
    def __init__(self, data: pd.DataFrame):
        self.data = data
    
    def calculate_column(self, operand: dict) -> pd.Series:
        """Calculate column value with offset"""
        
    def calculate_indicator(self, operand: dict) -> pd.Series:
        """Calculate indicator value with offset"""
        
    def apply_offset(self, series: pd.Series, offset: int) -> pd.Series:
        """Apply timeframe offset to series"""
        
    def calculate_constant(self, operand: dict) -> float:
        """Return constant value"""
```

**Dependencies**: `pandas`, `TechnicalIndicators` from `indicators_module`

**Estimated Time**: 3-4 hours

### Task 1.3: Create Advanced Filter Engine
**File**: `advanced_filter_engine.py`
**Components**:
- `AdvancedFilterEngine` class
- JSON filter execution
- Logic operator handling

**Key Methods**:
```python
class AdvancedFilterEngine:
    def __init__(self):
        self.parser = JSONFilterParser()
        self.calculator = None
    
    def apply_filter(self, data: pd.DataFrame, json_filter: dict) -> pd.DataFrame:
        """Apply JSON filter to data"""
        
    def evaluate_condition(self, data: pd.DataFrame, condition: dict) -> pd.Series:
        """Evaluate single condition"""
        
    def combine_results(self, results: list, logic: str) -> pd.Series:
        """Combine condition results with logic operator"""
```

**Dependencies**: `json_filter_parser`, `operand_calculator`

**Estimated Time**: 3-4 hours

## Phase 2: UI Integration (Priority: High)

### Task 2.1: Create JSON Filter UI Components
**File**: `json_filter_ui.py`
**Components**:
- `JSONFilterUI` class
- JSON editor interface
- Filter validation feedback

**Key Methods**:
```python
class JSONFilterUI:
    def __init__(self):
        self.parser = JSONFilterParser()
    
    def render_json_editor(self) -> dict:
        """Render JSON editor interface"""
        
    def render_validation_feedback(self, json_data: dict) -> None:
        """Show validation feedback"""
        
    def render_filter_preview(self, json_data: dict, data: pd.DataFrame) -> None:
        """Show filter preview"""
        
    def get_example_filters(self) -> dict:
        """Get example filter templates"""
```

**Dependencies**: `streamlit`, `json_filter_parser`

**Estimated Time**: 3-4 hours

### Task 2.2: Integrate with Main Application
**File**: `stock_scanner_main.py`
**Components**:
- Add JSON filter option to Build Filters tab
- Replace existing filter builders with JSON option
- Maintain backward compatibility

**Key Changes**:
```python
def build_filters_tab():
    # Add JSON filter option
    filter_type = st.radio(
        "Filter Type",
        ["JSON Filter", "Pre-built Templates", "Custom Filter"],
        horizontal=True
    )
    
    if filter_type == "JSON Filter":
        json_filter_ui.render_json_editor()
```

**Dependencies**: `json_filter_ui`, `advanced_filter_engine`

**Estimated Time**: 2-3 hours

## Phase 3: Enhanced Features (Priority: Medium)

### Task 3.1: Extend Indicator Support
**File**: `indicators_module.py`
**Components**:
- Add offset support to indicators
- Add timeframe-based calculations
- Improve performance with caching

**Key Changes**:
```python
class TechnicalIndicators:
    def add_all_indicators(self, df: pd.DataFrame, offset: int = 0) -> pd.DataFrame:
        """Add all indicators with offset support"""
        
    def calculate_sma_offset(self, series: pd.Series, period: int, offset: int) -> pd.Series:
        """Calculate SMA with offset"""
        
    def calculate_ema_offset(self, series: pd.Series, period: int, offset: int) -> pd.Series:
        """Calculate EMA with offset"""
```

**Dependencies**: `pandas`

**Estimated Time**: 3-4 hours

### Task 3.2: Add Performance Optimization
**File**: `performance_optimizer.py` (new)
**Components**:
- Caching for indicator calculations
- Vectorized operations
- Memory optimization

**Key Methods**:
```python
class PerformanceOptimizer:
    @st.cache_data
    def cached_indicator_calculation(self, data: pd.DataFrame, indicator_config: dict) -> pd.Series:
        """Cached indicator calculation"""
        
    def optimize_memory_usage(self, data: pd.DataFrame) -> pd.DataFrame:
        """Optimize memory usage for large datasets"""
```

**Dependencies**: `pandas`, `streamlit`

**Estimated Time**: 2-3 hours

## Phase 4: Testing and Documentation (Priority: Medium)

### Task 4.1: Create Test Suite
**File**: `test_json_filters.py`
**Components**:
- Unit tests for JSON parser
- Integration tests for filter application
- Performance tests

**Key Test Cases**:
```python
def test_json_validation():
    """Test JSON schema validation"""
    
def test_operand_calculation():
    """Test operand calculation accuracy"""
    
def test_filter_application():
    """Test end-to-end filter application"""
    
def test_performance():
    """Test performance with large datasets"""
```

**Dependencies**: `pytest`, `pandas`

**Estimated Time**: 3-4 hours

### Task 4.2: Create Documentation and Examples
**File**: `json_filter_examples.md`
**Components**:
- Usage examples
- JSON format documentation
- Common filter patterns

**Content**:
- Basic filters (price comparisons)
- Advanced filters (indicator crossovers)
- Complex logic (multiple conditions)
- Performance tips

**Estimated Time**: 2-3 hours

## Total Estimated Time: 25-35 hours

## Implementation Timeline

### Week 1 (Days 1-5)
- **Day 1**: Task 1.1 - JSON Filter Parser
- **Day 2**: Task 1.2 - Operand Calculator
- **Day 3**: Task 1.3 - Advanced Filter Engine
- **Day 4**: Task 2.1 - JSON Filter UI
- **Day 5**: Task 2.2 - Main Application Integration

### Week 2 (Days 6-10)
- **Day 6**: Task 3.1 - Extend Indicator Support
- **Day 7**: Task 3.2 - Performance Optimization
- **Day 8**: Task 4.1 - Test Suite (Part 1)
- **Day 9**: Task 4.1 - Test Suite (Part 2)
- **Day 10**: Task 4.2 - Documentation

## Risk Assessment

### High Risk
- **JSON parsing complexity**: May require iterative refinement
- **Performance with large datasets**: Need careful optimization
- **Backward compatibility**: Ensure existing filters still work

### Medium Risk
- **Indicator calculation accuracy**: Need thorough testing
- **UI integration complexity**: May require multiple iterations

### Low Risk
- **Documentation**: Straightforward task
- **Testing**: Well-defined test cases

## Success Criteria

1. **Functional**: JSON filters work correctly with sample data
2. **Performance**: Handles large datasets efficiently
3. **Usability**: Intuitive JSON editor with good feedback
4. **Compatibility**: Existing filter system still works
5. **Test Coverage**: Comprehensive test suite
6. **Documentation**: Clear examples and usage guides

## Dependencies

### External Libraries
- `jsonschema` for JSON validation
- `pytest` for testing
- `streamlit` for UI components

### Internal Dependencies
- `indicators_module` for technical indicators
- `utils_module` for data processing
- `filters_module` for existing filter logic

## Next Steps

1. **Approve implementation plan**
2. **Set up development environment**
3. **Begin Phase 1 implementation**
4. **Regular progress reviews**
5. **Testing and refinement**
6. **Documentation and deployment**