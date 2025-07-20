#!/usr/bin/env node

const { spawn } = require('cross-spawn');
const chalk = require('chalk');

// Helper functions for colored output
const log = {
  info: (msg) => console.log(chalk.blue('[INFO]'), msg),
  success: (msg) => console.log(chalk.green('[SUCCESS]'), msg),
  warning: (msg) => console.log(chalk.yellow('[WARNING]'), msg),
  error: (msg) => console.log(chalk.red('[ERROR]'), msg),
};

// Check if Docker is available
async function checkDocker() {
  return new Promise((resolve) => {
    const docker = spawn('docker', ['info'], { stdio: 'ignore' });
    docker.on('close', (code) => {
      resolve(code === 0);
    });
    docker.on('error', () => {
      resolve(false);
    });
  });
}

// Execute docker-compose command for dependencies only
function dockerComposeDeps(args, options = {}) {
  const composeArgs = [
    '-f', 'docker-compose.dev.yml',
    ...args
  ];
  
  return spawn('docker-compose', composeArgs, {
    stdio: 'inherit',
    ...options
  });
}

// Start dependencies (PostgreSQL + Redis)
async function startDeps() {
  log.info('Starting RideHive dependencies (PostgreSQL + Redis)...');
  
  const dockerAvailable = await checkDocker();
  if (!dockerAvailable) {
    log.error('Docker is not running or not installed. Please start Docker Desktop.');
    process.exit(1);
  }
  
  const child = dockerComposeDeps(['up', '-d']);
  
  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) {
        log.success('Dependencies started!');
        resolve();
      } else {
        log.error('Failed to start dependencies');
        reject(new Error(`Dependencies failed with code ${code}`));
      }
    });
  });
}

// Wait for dependencies to be ready
async function waitForDependencies() {
  log.info('Waiting for dependencies to be ready...');
  await new Promise(resolve => setTimeout(resolve, 8000));
}

// Start full development environment with mobile
async function startFullDev() {
  const platform = process.argv[2] || 'android'; // Default to android, can be 'ios'
  
  try {
    log.info('🚀 Starting RideHive Full Development Environment...');
    
    // Start dependencies first
    await startDeps();
    await waitForDependencies();
    
    log.success('✅ Dependencies ready! Starting all applications...');
    log.info('🌐 Services will be available at:');
    console.log('  📱 Mobile: Expo Dev Tools will open automatically');
    console.log('  🌐 Web Client: http://localhost:5173');
    console.log('  🚀 Server API: http://localhost:3001');
    console.log('  📚 API Docs: http://localhost:3001/api-docs');
    console.log('  🗄️ PostgreSQL: localhost:15432');
    console.log('  🔴 Redis: localhost:16379');
    console.log('');
    
    // Start all applications with concurrently (improved for PowerShell)
    const concurrentlyArgs = [
      '--names', 'SERVER,WEB,MOBILE',
      '--prefix-colors', 'red,green,blue',
      '--kill-others-on-fail',
      '--restart-tries', '0',  // Don't restart on failure
      '--success', 'first',    // Consider success when first process exits successfully
      '"cd server && npm run dev"',
      '"cd web-client && npm run dev"',
      `"cd RideHive && npm run ${platform}"`
    ];
    
    log.info('📦 Starting all services...');
    const child = spawn('npx', ['concurrently', ...concurrentlyArgs], {
      stdio: 'inherit',
      shell: process.platform === 'win32' // Use shell only on Windows
    });
    
    let isShuttingDown = false;
    
    // Enhanced process termination for PowerShell
    const cleanup = async (signal = 'SIGTERM') => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      
      log.info('🛑 Shutting down development environment...');
      
      try {
        // For Windows PowerShell, use taskkill to ensure proper cleanup
        if (process.platform === 'win32') {
          const { spawn } = require('child_process');
          
          // Kill the concurrently process tree
          if (child.pid) {
            spawn('taskkill', ['/pid', child.pid, '/t', '/f'], { stdio: 'ignore' });
          }
          
          // Give processes time to cleanup
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          child.kill(signal);
        }
      } catch (error) {
        log.warning(`Cleanup warning: ${error.message}`);
      }
      
      log.success('✅ Development environment stopped');
      process.exit(0);
    };
    
    // Handle Ctrl+C (SIGINT)
    process.on('SIGINT', () => cleanup('SIGINT'));
    
    // Handle termination (SIGTERM)  
    process.on('SIGTERM', () => cleanup('SIGTERM'));
    
    // Handle Windows-specific close event
    if (process.platform === 'win32') {
      process.on('beforeExit', () => cleanup());
    }
    
    child.on('close', (code) => {
      if (code !== 0) {
        log.error(`💥 Development environment exited with code ${code}`);
        process.exit(code);
      }
    });
    
    child.on('error', (error) => {
      log.error(`💥 Failed to start development environment: ${error.message}`);
      process.exit(1);
    });
    
  } catch (error) {
    log.error(`💥 Failed to start development environment: ${error.message}`);
    process.exit(1);
  }
}

// Show help
function showHelp() {
  console.log(chalk.cyan('🚀 RideHive Full Development Environment'));
  console.log('');
  console.log('Usage: npm run dev:full [platform]');
  console.log('       npm run dev:full:ios');
  console.log('       node scripts/dev-full.js [android|ios]');
  console.log('');
  console.log('This command will:');
  console.log('  1. ✅ Start Docker dependencies (PostgreSQL + Redis)');
  console.log('  2. 🚀 Start Node.js server (:3001)');
  console.log('  3. 🌐 Start React web client (:5173)');
  console.log('  4. 📱 Start React Native mobile app in emulator');
  console.log('');
  console.log('Platforms:');
  console.log('  android     Start Android emulator (default)');
  console.log('  ios         Start iOS simulator (macOS only)');
  console.log('');
  console.log('Examples:');
  console.log('  npm run dev:full        # Start with Android');
  console.log('  npm run dev:full:ios    # Start with iOS');
  console.log('');
  console.log('Press Ctrl+C to stop all services');
}

// Main script logic
async function main() {
  const command = process.argv[2];
  
  if (command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }
  
  // If command is a platform (android/ios), start full dev
  if (!command || command === 'android' || command === 'ios') {
    await startFullDev();
  } else {
    log.error(`Unknown platform: ${command}`);
    console.log('');
    showHelp();
    process.exit(1);
  }
}

// Handle errors
process.on('uncaughtException', (error) => {
  log.error(`💥 Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.error(`💥 Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main().catch((error) => {
    log.error(`💥 Script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };