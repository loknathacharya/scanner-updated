#!/usr/bin/env node
/**
 * Simple test to verify the React frontend is accessible
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET',
  timeout: 5000
};

console.log('Testing React frontend accessibility...');

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Status Message: ${res.statusMessage}`);
  
  if (res.statusCode === 200) {
    console.log('✅ React frontend is accessible!');
    console.log('You can now open http://localhost:3000 in your browser');
  } else {
    console.log('⚠️  Frontend returned non-200 status');
  }
});

req.on('error', (error) => {
  if (error.code === 'ECONNREFUSED') {
    console.log('❌ Frontend server is not running');
    console.log('Please ensure npm start is running in the frontend directory');
  } else {
    console.log('❌ Error connecting to frontend:', error.message);
  }
});

req.on('timeout', () => {
  console.log('❌ Connection timed out');
  req.destroy();
});

req.end();