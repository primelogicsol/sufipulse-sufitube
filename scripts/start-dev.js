#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting SufiPulse Development Server...\n');

// Clean up function
function cleanup() {
  console.log('\n🧹 Cleaning up...');
  try {
    // Kill any existing node processes on port 3005
    if (process.platform === 'win32') {
      execSync('taskkill /F /IM node.exe /T 2>nul', { stdio: 'ignore' });
    } else {
      execSync('pkill -f "next dev" || true', { stdio: 'ignore' });
    }
  } catch (error) {
    // Ignore errors during cleanup
  }
}

// Clean build cache
function cleanCache() {
  console.log('🗑️  Cleaning build cache...');
  const nextDir = path.join(__dirname, '..', '.next');
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
  }
}

// Check if port is available
function checkPort(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();

    server.listen(port, () => {
      server.close();
      resolve(true);
    });

    server.on('error', () => {
      resolve(false);
    });
  });
}

// Main startup function
async function startDev() {
  cleanup();
  cleanCache();

  // Check if port 3005 is available
  console.log('🔍 Checking port availability...');
  const portAvailable = await checkPort(3005);

  if (!portAvailable) {
    console.log('⚠️  Port 3005 is in use. Attempting to free it...');
    cleanup();
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('📦 Starting Next.js development server...\n');

  // Start the dev server
  const child = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..')
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...');
    child.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down gracefully...');
    child.kill('SIGTERM');
    process.exit(0);
  });

  child.on('close', (code) => {
    console.log(`\n📴 Development server exited with code ${code}`);
    process.exit(code);
  });

  child.on('error', (error) => {
    console.error('❌ Failed to start development server:', error);
    process.exit(1);
  });
}

startDev().catch((error) => {
  console.error('❌ Startup failed:', error);
  process.exit(1);
});