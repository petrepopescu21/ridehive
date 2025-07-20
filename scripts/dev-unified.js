#!/usr/bin/env node

const spawn = require('cross-spawn');
const chalk = require('chalk');

console.log(chalk.blue('🚀 Starting RideHive unified development server...'));
console.log(chalk.gray('This will start:'));
console.log(chalk.gray('  - PostgreSQL + Redis (Docker)'));
console.log(chalk.gray('  - Node.js API server on :3001'));
console.log(chalk.gray('  - React dev server on :5173'));
console.log(chalk.gray('  - Hot reload for both frontend and backend'));
console.log('');

// Start dependencies first
console.log(chalk.yellow('📦 Starting dependencies (PostgreSQL + Redis)...'));

const depsProcess = spawn('node', ['scripts/dev.js', 'deps'], {
  stdio: 'inherit',
  shell: true
});

depsProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(chalk.red('❌ Failed to start dependencies'));
    process.exit(1);
  }
  
  console.log(chalk.green('✅ Dependencies started'));
  console.log('');
  
  // Wait a moment for deps to be ready, then start dev servers
  setTimeout(() => {
    console.log(chalk.yellow('🔧 Starting development servers...'));
    
    // Start both server and web client concurrently
    const concurrentProcess = spawn('npx', [
      'concurrently',
      '--names', 'SERVER,WEB',
      '--prefix-colors', 'cyan,magenta',
      '--kill-others',
      '"cd server && npm run dev"',
      '"cd web-client && npm run dev"'
    ], {
      stdio: 'inherit',
      shell: true
    });
    
    concurrentProcess.on('close', (code) => {
      console.log(chalk.yellow('👋 Development servers stopped'));
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n🛑 Shutting down development servers...'));
      concurrentProcess.kill('SIGINT');
    });
    
    process.on('SIGTERM', () => {
      console.log(chalk.yellow('\n🛑 Shutting down development servers...'));
      concurrentProcess.kill('SIGTERM');
    });
    
  }, 2000); // Wait 2 seconds for deps to be ready
});

// Handle graceful shutdown for deps
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n🛑 Shutting down...'));
  depsProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n🛑 Shutting down...'));
  depsProcess.kill('SIGTERM');
});