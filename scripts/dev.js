#!/usr/bin/env node

const { spawn } = require('cross-spawn');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

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

// Execute docker-compose command for production
function dockerComposeProd(args, options = {}) {
  return spawn('docker-compose', args, {
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
        log.info('Dependencies available at:');
        console.log('  🗄️ PostgreSQL: localhost:15432');
        console.log('  🔴 Redis: localhost:16379');
        resolve();
      } else {
        log.error('Failed to start dependencies');
        reject(new Error(`Dependencies failed with code ${code}`));
      }
    });
  });
}

// Stop dependencies
async function stopDeps() {
  log.info('Stopping RideHive dependencies...');
  
  const child = dockerComposeDeps(['down']);
  
  return new Promise((resolve) => {
    child.on('close', (code) => {
      if (code === 0) {
        log.success('Dependencies stopped!');
      } else {
        log.error('Failed to stop dependencies');
      }
      resolve();
    });
  });
}

// Start Node.js applications natively
async function startApps() {
  log.info('Starting RideHive applications natively...');
  
  // Check if dependencies are running
  const depsStatus = await checkDependencies();
  if (!depsStatus) {
    log.warning('Dependencies not running. Starting them first...');
    await startDeps();
    // Wait a bit for dependencies to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  log.info('Launching server and web client with verbose logging...');
  
  // Start both server and web client concurrently with enhanced logging
  const child = spawn('npm', ['run', 'start:server'], { 
    stdio: 'inherit', 
    shell: true,
    detached: false 
  });
  
  // Start web client in parallel
  setTimeout(() => {
    const webChild = spawn('npm', ['run', 'start:web'], { 
      stdio: 'inherit', 
      shell: true,
      detached: false 
    });
    
    webChild.on('spawn', () => {
      log.success('Web client started successfully!');
    });
    
    webChild.on('error', (error) => {
      log.error(`Failed to start web client: ${error.message}`);
    });
  }, 2000);
  
  // Log process startup
  child.on('spawn', () => {
    log.success('Applications started successfully!');
    log.info('You should see server and web client logs below...');
  });
  
  child.on('error', (error) => {
    log.error(`Failed to start applications: ${error.message}`);
  });
  
  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Applications failed with code ${code}`));
      }
    });
  });
}

// Check if dependencies are running
async function checkDependencies() {
  return new Promise((resolve) => {
    const child = dockerComposeDeps(['ps', '-q']);
    let output = '';
    
    child.stdout?.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', (code) => {
      // If there are container IDs in output, dependencies are running
      resolve(code === 0 && output.trim().length > 0);
    });
  });
}

// Start full development environment
async function startDev() {
  try {
    log.info('Starting RideHive development environment...');
    
    const dockerAvailable = await checkDocker();
    if (!dockerAvailable) {
      log.error('Docker is not running or not installed. Please start Docker Desktop.');
      process.exit(1);
    }
    
    // Start dependencies first
    await startDeps();
    
    // Wait for dependencies to be ready
    log.info('Waiting for dependencies to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    log.success('Dependencies ready! Starting applications...');
    log.info('Services will be available at:');
    console.log('  🌐 Web Client: http://localhost:5173 (Vite dev server)');
    console.log('  🚀 Server API: http://localhost:3001');
    console.log('  📚 API Docs: http://localhost:3001/api-docs');
    console.log('  🗄️ PostgreSQL: localhost:15432');
    console.log('  🔴 Redis: localhost:16379');
    console.log('');
    
    // Start both server and web client applications
    log.info('Starting server and web client applications...');
    await startApps();
    
  } catch (error) {
    log.error(`Failed to start development environment: ${error.message}`);
    process.exit(1);
  }
}

// Stop development environment
async function stopDev() {
  log.info('Stopping RideHive development environment...');
  
  // Kill any running Node.js processes (server/web client)
  if (process.platform === 'win32') {
    spawn('taskkill', ['/F', '/IM', 'node.exe'], { stdio: 'ignore' });
  } else {
    spawn('pkill', ['-f', 'npm.*run.*(dev|start)'], { stdio: 'ignore' });
  }
  
  // Stop dependencies
  await stopDeps();
  
  log.success('Development environment stopped!');
}

// Restart development environment
async function restartDev() {
  log.info('Restarting RideHive development environment...');
  await stopDev();
  
  setTimeout(() => {
    startDev();
  }, 2000);
}

// Show logs for dependencies
function showLogs(service) {
  const args = service ? ['logs', '-f', service] : ['logs', '-f'];
  dockerComposeDeps(args);
}

// Show status
function showStatus() {
  log.info('RideHive Development Environment Status:');
  log.info('Dependencies (Docker):');
  dockerComposeDeps(['ps']);
  
  console.log('');
  log.info('Node.js Applications:');
  console.log('Run "ps aux | grep node" to see running Node.js processes');
}

// Clean up everything
async function clean() {
  log.warning('This will remove all containers, volumes, and images.');
  
  const shouldClean = process.argv.includes('--force') || process.argv.includes('-f');
  
  if (!shouldClean) {
    log.warning('Add --force or -f flag to confirm cleanup');
    log.info('Example: npm run dev:clean -- --force');
    return;
  }
  
  log.info('Cleaning up RideHive development environment...');
  
  // Stop all processes
  await stopDev();
  
  // Clean up Docker
  const child = dockerComposeDeps(['down', '-v', '--rmi', 'all']);
  
  child.on('close', (code) => {
    if (code === 0) {
      // Additional cleanup
      spawn('docker', ['system', 'prune', '-f'], { stdio: 'inherit' });
      log.success('Cleanup complete!');
    } else {
      log.error('Cleanup failed');
      process.exit(code);
    }
  });
}

// Reset database
async function resetDb() {
  const shouldReset = process.argv.includes('--force') || process.argv.includes('-f');
  
  if (!shouldReset) {
    log.warning('This will reset the database and lose all data.');
    log.warning('Add --force or -f flag to confirm reset');
    log.info('Example: npm run dev:reset-db -- --force');
    return;
  }
  
  log.info('Resetting database...');
  
  // Stop postgres
  const stop = dockerComposeDeps(['stop', 'postgres']);
  
  stop.on('close', () => {
    // Remove postgres container
    const rm = dockerComposeDeps(['rm', '-f', 'postgres']);
    
    rm.on('close', () => {
      // Remove volume
      const rmVol = spawn('docker', ['volume', 'rm', 'ridehive_postgres_dev_data'], { stdio: 'ignore' });
      
      rmVol.on('close', () => {
        // Start postgres again
        const startPg = dockerComposeDeps(['up', '-d', 'postgres']);
        
        startPg.on('close', () => {
          log.info('Waiting for database to be ready...');
          
          setTimeout(() => {
            log.success('Database reset complete!');
            log.info('You may need to restart your server application.');
          }, 10000);
        });
      });
    });
  });
}

// Run tests
function runTests() {
  log.info('Running tests...');
  log.info('Make sure your server and dependencies are running first.');
  
  const child = spawn('npm', ['test'], { stdio: 'inherit' });
  
  child.on('close', (code) => {
    if (code === 0) {
      log.success('Tests completed successfully!');
    } else {
      log.error('Tests failed');
      process.exit(code);
    }
  });
}

// Shell into container
function shell(service = 'postgres') {
  log.info(`Opening shell in ${service} container...`);
  
  // Try bash first, then sh
  const bashShell = dockerComposeDeps(['exec', service, '/bin/bash'], { stdio: 'inherit' });
  
  bashShell.on('error', () => {
    // Fallback to sh
    dockerComposeDeps(['exec', service, '/bin/sh'], { stdio: 'inherit' });
  });
}

// Show help
function showHelp() {
  console.log(chalk.cyan('RideHive Development Helper Script'));
  console.log(chalk.cyan('Native Node.js Development with Docker Dependencies'));
  console.log('');
  console.log('Usage: npm run dev:COMMAND or node scripts/dev.js COMMAND');
  console.log('');
  console.log('Commands:');
  console.log('  start       Start dependencies and show startup instructions');
  console.log('  stop        Stop development environment');
  console.log('  restart     Restart development environment');
  console.log('  deps        Start dependencies only (PostgreSQL + Redis)');
  console.log('  deps:stop   Stop dependencies only');
  console.log('  logs        Show dependency logs (optional: specify service name)');
  console.log('  status      Show environment status');
  console.log('  reset-db    Reset database (use --force)');
  console.log('  test        Run tests');
  console.log('  shell       Open shell in dependency container (default: postgres)');
  console.log('  help        Show this help message');
  console.log('');
  console.log('Development workflow:');
  console.log('  1. npm run dev              # Start dependencies');
  console.log('  2. npm run start:server     # In another terminal');
  console.log('  3. npm run start:web        # In another terminal');
  console.log('  OR: npx concurrently "npm run start:server" "npm run start:web"');
  console.log('');
  console.log('Examples:');
  console.log('  npm run dev:deps');
  console.log('  npm run dev:logs');
  console.log('  npm run dev:shell:postgres');
  console.log('  npm run dev:reset-db -- --force');
  console.log('  node scripts/dev.js logs postgres');
  console.log('  node scripts/dev.js shell redis');
}

// Main script logic
async function main() {
  const command = process.argv[2];
  const serviceArg = process.argv[3];
  
  switch (command) {
    case 'start':
      await startDev();
      break;
    case 'stop':
      await stopDev();
      break;
    case 'restart':
      await restartDev();
      break;
    case 'deps':
      await startDeps();
      break;
    case 'deps:stop':
      await stopDeps();
      break;
    case 'apps':
      await startApps();
      break;
    case 'logs':
      showLogs(serviceArg);
      break;
    case 'status':
      showStatus();
      break;
    case 'reset-db':
      await resetDb();
      break;
    case 'test':
      runTests();
      break;
    case 'shell':
      shell(serviceArg);
      break;
    case 'help':
    case '--help':
    case '-h':
    case undefined:
      showHelp();
      break;
    default:
      log.error(`Unknown command: ${command}`);
      console.log('');
      showHelp();
      process.exit(1);
  }
}

// Handle errors
process.on('uncaughtException', (error) => {
  log.error(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.error(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main().catch((error) => {
    log.error(`Script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };