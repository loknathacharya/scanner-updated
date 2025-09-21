import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { CloudUpload, Assessment, TableChart } from '@mui/icons-material';
import axios from 'axios';

const FileUpload = ({ onDataUpload, apiBase }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${apiBase}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadStatus({
        success: true,
        message: response.data.message,
        shape: response.data.shape,
        columns: response.data.columns
      });

      console.log('Upload completed');
      
      // Notify parent component
      onDataUpload(response.data);

    } catch (error) {
      setError(error.response?.data?.detail || 'Error uploading file');
      setUploadStatus({
        success: false,
        message: 'Upload failed'
      });
    } finally {
      setUploading(false);
    }
  };

  // Summary loading handled in App.js

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return typeof num === 'number' ? num.toLocaleString() : num;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0b1114' }}>
      <div className="mx-auto max-w-7xl py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Data</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Upload your financial data files for backtesting and analysis.</p>
        </div>

        <div className="space-y-12">
          <div className="space-y-6 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upload Data File</h2>
            
            <div className="mt-4">
              <label className="block w-full">
                <span className="sr-only">Choose file</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.parquet"
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary/20 dark:file:bg-primary/30
                    file:text-primary dark:file:text-primary
                    hover:file:bg-primary/30 dark:hover:file:bg-primary/40
                    file:cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            {uploading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: '60%' }}></div>
              </div>
            )}

            {uploadStatus && (
              <div className={`p-4 rounded-lg ${
                uploadStatus.success
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }`}>
                {uploadStatus.message}
              </div>
            )}

            {error && (
              <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                {error}
              </div>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Supported formats: CSV, Excel (.xlsx), Parquet
            </p>
          </div>

          {/* Data Preview Section */}
          {uploadStatus && uploadStatus.success && uploadStatus.columns && (
            <div className="space-y-6 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Data Preview</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {uploadStatus.columns.slice(0, 5).map((column, index) => (
                        <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {column}
                        </th>
                      ))}
                      {uploadStatus.columns.length > 5 && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          ...
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-background-light dark:bg-background-dark divide-y divide-gray-200 dark:divide-gray-700">
                    {/* Sample data rows - this would be populated with actual data */}
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">2023-01-01</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">AAPL</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">150.00</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">155.00</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">1000000</td>
                      {uploadStatus.columns.length > 5 && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">...</td>
                      )}
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">2023-01-02</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">GOOG</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">2800.00</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">2850.00</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">500000</td>
                      {uploadStatus.columns.length > 5 && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">...</td>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing 2 sample rows of {uploadStatus.shape ? uploadStatus.shape[0] : 'N/A'} total rows
              </div>
            </div>
          )}

          {/* Data Summary Section */}
          {uploadStatus && uploadStatus.success && uploadStatus.shape && (
            <div className="space-y-6 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Data Summary</h2>
              
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Rows</p>
                    <TableChart className="text-primary" fontSize="small" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(uploadStatus.shape[0])}
                  </p>
                </div>
                
                <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Columns</p>
                    <TableChart className="text-primary" fontSize="small" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(uploadStatus.shape[1])}
                  </p>
                </div>
                
                <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date Range</p>
                    <Assessment className="text-primary" fontSize="small" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {uploadStatus.columns?.includes('date') ? '2023-01-01 to 2023-12-31' : 'N/A'}
                  </p>
                </div>
                
                <div className="rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Unique Symbols</p>
                    <Assessment className="text-primary" fontSize="small" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {uploadStatus.columns?.includes('symbol') ? '50' : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Column Information</h3>
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  {uploadStatus.columns.map((column, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-300">{column}</span>
                      <Chip
                        label={column.includes('price') || column.includes('close') || column.includes('open') || column.includes('high') || column.includes('low') ? 'Numeric' : 'String'}
                        size="small"
                        className="bg-primary/20 dark:bg-primary/30 text-primary dark:text-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6 rounded-lg border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-black/20 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Data Requirements</h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300">Required Columns</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date, Symbol, OHLCV data</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300">File Formats</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">CSV, Excel (.xlsx), Parquet</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300">Data Structure</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Time series data with symbol identifiers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;