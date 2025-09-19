# Migration Architecture: Streamlit to React

## 1. Introduction

This document outlines the architectural plan for migrating the Stock Scanner application from a Python + Streamlit setup to a Python + React architecture. The primary goal is to replace the Streamlit-based frontend with a modern, responsive React application while retaining the existing Python backend logic for data processing and filtering. The application will continue to be for individual use with local data storage.

## 2. Proposed Architecture

The new architecture will consist of two main components:

*   **React Frontend:** A single-page application (SPA) built with React that will provide the user interface.
*   **Python Backend:** A RESTful API server built with a framework like FastAPI that will expose the existing Python logic to the frontend.

This decoupled architecture offers several advantages:

*   **Improved User Experience:** A React frontend will provide a more interactive and responsive user experience compared to Streamlit.
*   **Scalability:** The decoupled nature allows the frontend and backend to be developed, deployed, and scaled independently.
*   **Flexibility:** The API-first approach allows for other clients (e.g., mobile apps) to be developed in the future.

### Architecture Diagram

```mermaid
graph TD
    subgraph Browser
        A[React Frontend]
    end

    subgraph Server
        B[Python Backend API <br> (FastAPI)]
    end

    subgraph Local Machine
        C[OHLCV Data Files <br> (CSV, Parquet, etc.)]
        D[Python Logic <br> (Filtering, Indicators, etc.)]
    end

    A -- HTTP Requests <br> (REST API) --> B
    B -- Accesses --> D
    B -- Reads --> C

```

## 3. Technology Stack

*   **Frontend:**
    *   **Framework:** React
    *   **UI Library:** Material-UI or a similar component library for a professional look and feel.
    *   **Charting:** A library like Plotly.js or Highcharts for interactive charts.
    *   **State Management:** React Context API or Redux for managing application state.
    *   **HTTP Client:** Axios or Fetch API for making API requests.
*   **Backend:**
    *   **Framework:** FastAPI (recommended for its speed and ease of use) or Flask.
    *   **Data Handling:** Pandas will continue to be used for data manipulation.
*   **Development:**
    *   **Package Manager:** `npm` or `yarn` for the frontend, `pip` for the backend.
    *   **Environment:** A virtual environment (e.g., `venv`) for Python dependencies.

## 4. API Design (High-Level)

The backend API will expose endpoints for the frontend to interact with. Here are some of the key endpoints:

*   `POST /api/upload`: Upload and process a new data file.
*   `GET /api/data/summary`: Get summary statistics of the processed data.
*   `POST /api/filters/apply`: Apply a filter (custom or JSON) to the data.
*   `GET /api/filters/saved`: Get a list of saved filters.
*   `POST /api/filters/saved`: Save a new filter.
*   `DELETE /api/filters/saved/{filter_name}`: Delete a saved filter.
*   `GET /api/chart/{symbol}`: Get data for a specific symbol to render a chart.

## 5. React Frontend Component Breakdown

The React application will be structured into a series of reusable components:

*   **`App.js`**: The main application component, responsible for routing and layout.
*   **`FileUpload.js`**: A component for uploading and processing data files.
*   **`DataPreview.js`**: A component to display a preview of the uploaded data and summary statistics.
*   **`FilterBuilder.js`**: The main component for building filters, with sub-components for:
    *   `TemplateFilters.js`: For pre-built filter templates.
    *   `CustomFilterBuilder.js`: For building custom filters with a dynamic UI.
    *   `JSONFilterEditor.js`: An editor for creating and validating JSON-based filters.
*   **`ResultsTable.js`**: A component to display the scan results in a sortable and paginated table.
*   **`StockChart.js`**: A component for displaying interactive OHLC charts.
*   **`Sidebar.js`**: A component for displaying saved filters and other tools.

## 6. Data Flow

1.  The user uploads a data file through the React frontend.
2.  The frontend sends the file to the `/api/upload` endpoint on the backend.
3.  The backend processes the data using the existing Python scripts and stores it in memory (or a temporary local cache).
4.  The user builds a filter using the React UI.
5.  The frontend sends the filter definition to the `/api/filters/apply` endpoint.
6.  The backend applies the filter to the processed data and returns the results.
7.  The frontend displays the results in the `ResultsTable` and allows for further analysis and charting.

## 7. Next Steps

The next step is to set up the development environment for both the frontend and backend, as outlined in the to-do list.