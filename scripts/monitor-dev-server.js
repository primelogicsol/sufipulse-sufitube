#!/usr/bin/env node

const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHECK_INTERVAL = 5000; // Check every 5 seconds
const LOG_FILE = path.join(__dirname, '..', 'dev-server.log');

let isServerHealthy = false;
let restartCount = 0;
const MAX_RESTARTS = 3;
const RESTART_DELAY = 10000; // 10 seconds between restarts

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(LOG_FILE, logMessage);
}

function checkServerHealth() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 307); // 307 is redirect for trailing slash
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

function restartServer() {
  log('🔄 Attempting to restart development server...');
  restartCount++;

  if (restartCount > MAX_RESTARTS) {
    log('❌ Maximum restart attempts reached. Stopping monitor.');
    process.exit(1);
  }

  // Kill existing process
  exec('taskkill /F /IM node.exe /T 2>nul', (error) => {
    if (error) log(`⚠️  Error killing existing process: ${error.message}`);
  });

  // Wait then restart
  setTimeout(() => {
    log(`🚀 Restarting server (attempt ${restartCount}/${MAX_RESTARTS})...`);
    exec('npm run dev', { cwd: path.join(__dirname, '..') }, (error) => {
      if (error) {
        log(`❌ Failed to restart: ${error.message}`);
      }
    });
  }, RESTART_DELAY);
}

async function monitor() {
  const health = await checkServerHealth();

  if (health) {
    if (!isServerHealthy) {
      log('✅ Development server is healthy (http://localhost:3000)');
      isServerHealthy = true;
      restartCount = 0; // Reset counter
    }
  } else {
    if (isServerHealthy) {
      log('⚠️  Development server became unavailable!');
      isServerHealthy = false;
      restartServer();
    }
  }
}

function start() {
  log('🎯 Starting SufiPulse Development Monitor');
  log('📊 Health check interval: ' + CHECK_INTERVAL + 'ms');
  log('📝 Log file: ' + LOG_FILE);
  log('');

  // Initial check
  setInterval(monitor, CHECK_INTERVAL);
  monitor(); // First check immediately
}

// Graceful shutdown
process.on('SIGINT', () => {
  log('\n👋 Stopping monitor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n👋 Stopping monitor...');
  process.exit(0);
});

start();