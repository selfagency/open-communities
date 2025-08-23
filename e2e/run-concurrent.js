#!/usr/bin/env node
/*
  Lightweight concurrent runner that starts a preview server and Playwright
  and ensures all child processes are terminated when the runner receives
  SIGINT/SIGTERM or when any child exits.

  Usage: node e2e/run-concurrent.js
*/
const { spawn } = require('child_process');

const tasks = [
  { name: 'preview', cmd: 'pnpm run preview' },
  { name: 'playwright', cmd: 'bash -lc "sleep 5 && pnpm exec playwright test --config e2e/playwright.config.mjs"' }
];

const children = new Set();
let shuttingDown = false;

function start(task) {
  console.log(`[e2e-runner] starting ${task.name}: ${task.cmd}`);
  const child = spawn(task.cmd, { shell: true, stdio: 'inherit', detached: true });
  children.add(child);

  child.on('exit', (code, signal) => {
    children.delete(child);
    console.log(`[e2e-runner] ${task.name} exited code=${code} signal=${signal}`);
    // If any child exits, shut everything down and exit with its code (non-zero if signal)
    const exitCode = (code !== null) ? code : (signal ? 1 : 0);
    shutdown(exitCode);
  });

  child.on('error', (err) => {
    children.delete(child);
    console.error(`[e2e-runner] ${task.name} error:`, err);
    shutdown(1);
  });

  return child;
}

function killChild(child, signal='SIGTERM') {
  try {
    if (child.pid) {
      // kill the whole process group on POSIX by using negative pid
      process.kill(-child.pid, signal);
    }
  } catch (e) {
    try { child.kill(signal); } catch (e2) {}
  }
}

function shutdown(code=0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('[e2e-runner] shutting down children...');
  for (const c of Array.from(children)) {
    killChild(c, 'SIGTERM');
  }
  // give children a moment to exit, then force kill
  setTimeout(() => {
    for (const c of Array.from(children)) {
      killChild(c, 'SIGKILL');
    }
    process.exit(code);
  }, 500);
}

process.on('SIGINT', () => { console.log('[e2e-runner] SIGINT'); shutdown(130); });
process.on('SIGTERM', () => { console.log('[e2e-runner] SIGTERM'); shutdown(0); });
process.on('uncaughtException', (err) => { console.error(err); shutdown(1); });

// Start preview first, then start playwright after short delay (or immediately if you prefer)
start(tasks[0]);
setTimeout(() => start(tasks[1]), 5000);
