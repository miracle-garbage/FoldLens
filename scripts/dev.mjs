#!/usr/bin/env node
// Cross-platform development launcher for FoldLens.
//
// Starts the FastAPI backend and the Vite dev server, waits until the frontend
// answers, then opens the default browser. Node.js is already required by Vite,
// so this script has no extra dependencies.
//
// Linux / macOS: ./scripts/dev.sh   (or: node scripts/dev.mjs)
// Windows:       scripts\dev.cmd    (or: node scripts\dev.mjs)
//
// Options:
//   --no-open              do not open the browser
//   FOLDLENS_NO_OPEN=1     same as --no-open (useful for CI / headless runs)

import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const IS_WINDOWS = process.platform === 'win32'
// Vite binds to "localhost"; Windows may resolve that to IPv6 only, so probe
// every local form before deciding the frontend is not ready.
const FRONTEND_READY_URLS = [
  'http://localhost:5173/',
  'http://127.0.0.1:5173/',
  'http://[::1]:5173/',
]
const FRONTEND_URL = 'http://localhost:5173/'
const BACKEND_HEALTH_URL = 'http://127.0.0.1:8000/api/health'
const READY_TIMEOUT_MS = 60_000
const BACKEND_GRACE_MS = 5_000
const POLL_INTERVAL_MS = 300
const NO_OPEN =
  process.argv.includes('--no-open') || process.env.FOLDLENS_NO_OPEN === '1'

function requireSupportedNode() {
  const [major, minor] = process.versions.node.split('.').map(Number)
  const supported =
    (major === 20 && minor >= 19) ||
    (major === 22 && minor >= 12) ||
    major > 22
  if (!supported) {
    console.error(
      `Node ${process.versions.node} is not supported. ` +
        'Vite 8 requires ^20.19.0 || >=22.12.0.',
    )
    process.exit(1)
  }
}

function resolveUvicorn() {
  const venv = join(ROOT, 'backend', '.venv')
  const uvicorn = join(
    venv,
    IS_WINDOWS ? 'Scripts' : 'bin',
    IS_WINDOWS ? 'uvicorn.exe' : 'uvicorn',
  )
  if (existsSync(uvicorn)) {
    return { command: uvicorn, args: [] }
  }
  const python = join(
    venv,
    IS_WINDOWS ? 'Scripts' : 'bin',
    IS_WINDOWS ? 'python.exe' : 'python',
  )
  if (existsSync(python)) {
    return { command: python, args: ['-m', 'uvicorn'] }
  }
  return null
}

function npmCommand() {
  return IS_WINDOWS ? 'npm.cmd' : 'npm'
}

const children = []
let shuttingDown = false

function stopChild(child) {
  if (!child || child.exitCode !== null) {
    return
  }
  if (IS_WINDOWS) {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
    })
    return
  }
  try {
    process.kill(-child.pid, 'SIGTERM')
  } catch {
    try {
      child.kill('SIGTERM')
    } catch {
      // The process already exited.
    }
  }
}

function shutdown(code) {
  if (shuttingDown) {
    return
  }
  shuttingDown = true
  for (const child of children) {
    stopChild(child)
  }
  setTimeout(() => process.exit(code), 300).unref()
}

function launch(name, command, args, options) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    detached: !IS_WINDOWS,
    ...options,
  })
  children.push(child)
  child.on('error', (error) => {
    console.error(`${name} failed to start: ${error.message}`)
    shutdown(1)
  })
  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return
    }
    console.error(
      `${name} exited${signal ? ` (${signal})` : ''}; stopping FoldLens.`,
    )
    shutdown(code ?? 1)
  })
  return child
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function isReachable(url, timeoutMs = 1_500) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
    })
    return response.ok
  } catch {
    return false
  }
}

async function waitForAny(urls, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline && !shuttingDown) {
    for (const url of urls) {
      if (await isReachable(url, 800)) {
        return true
      }
    }
    await sleep(POLL_INTERVAL_MS)
  }
  return false
}

function openWindowsBrowser(url) {
  // `start` is a cmd builtin. Passing an empty title as its own argument lets
  // Node quote it as "", which cmd needs so the URL is not treated as a title.
  // Fall back to the two other documented handlers if cmd cannot be spawned.
  const attempts = [
    {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', 'start', '', url],
    },
    { command: 'rundll32.exe', args: ['url.dll,FileProtocolHandler', url] },
    { command: 'explorer.exe', args: [url] },
  ]
  let index = 0

  const tryNext = () => {
    if (index >= attempts.length) {
      console.log(`Could not open a browser automatically. Open ${url} manually.`)
      return
    }
    const attempt = attempts[index++]
    let settled = false
    const fallback = () => {
      if (!settled) {
        settled = true
        tryNext()
      }
    }
    let child
    try {
      child = spawn(attempt.command, attempt.args, {
        stdio: 'ignore',
        // A detached hidden console can make `start` a no-op on some Windows
        // setups, so let the opener exit on its own.
        windowsHide: true,
      })
    } catch {
      fallback()
      return
    }
    child.on('error', fallback)
    child.on('exit', (code) => {
      // `start`/rundll32 exit 0 on success; explorer may exit 1 even after it
      // opened the URL, so only retry while another attempt remains.
      if (code !== 0 && index < attempts.length) {
        fallback()
      }
    })
    child.unref()
  }

  tryNext()
}

function openBrowser(url) {
  if (NO_OPEN) {
    console.log(`Auto-open disabled. Open ${url} in your browser.`)
    return
  }
  console.log(`Opening ${url} in your default browser...`)

  if (IS_WINDOWS) {
    openWindowsBrowser(url)
    return
  }

  const command = process.platform === 'darwin' ? 'open' : 'xdg-open'
  const child = spawn(command, [url], {
    stdio: 'ignore',
    detached: true,
    windowsHide: true,
  })
  child.on('error', () => {
    console.log(`Could not open a browser automatically. Open ${url} manually.`)
  })
  child.unref()
}

requireSupportedNode()
console.log(`Node ${process.version} — ${process.execPath}`)

const uvicorn = resolveUvicorn()
if (!uvicorn) {
  console.error(
    'Backend virtualenv missing. Run ./scripts/setup.sh (Linux/macOS) ' +
      'or scripts\\setup.cmd (Windows) first.',
  )
  process.exit(1)
}
if (!existsSync(join(ROOT, 'frontend', 'node_modules'))) {
  console.error(
    'Frontend dependencies missing. Run ./scripts/setup.sh (Linux/macOS) ' +
      'or scripts\\setup.cmd (Windows) first.',
  )
  process.exit(1)
}

process.on('SIGINT', () => {
  console.log('\nStopping FoldLens...')
  shutdown(0)
})
process.on('SIGTERM', () => shutdown(0))
if (!IS_WINDOWS) {
  process.on('SIGHUP', () => shutdown(0))
}

launch(
  'Backend',
  uvicorn.command,
  [...uvicorn.args, 'app.main:app', '--reload', '--host', '127.0.0.1', '--port', '8000'],
  { cwd: join(ROOT, 'backend') },
)

launch(
  'Frontend',
  npmCommand(),
  ['run', 'dev', '--', '--strictPort'],
  {
    cwd: join(ROOT, 'frontend'),
    // npm is a .cmd file on Windows; it has to run through the shell.
    shell: IS_WINDOWS,
  },
)

const frontendReady = await waitForAny(
  FRONTEND_READY_URLS,
  READY_TIMEOUT_MS,
)
if (!frontendReady) {
  console.warn(
    'The frontend did not answer on localhost / 127.0.0.1 / [::1] in time. ' +
      'The servers are still running; open ' +
      `${FRONTEND_URL} manually once Vite reports ready.`,
  )
} else {
  const backendReady = await waitForAny(
    [BACKEND_HEALTH_URL],
    BACKEND_GRACE_MS,
  )
  if (!backendReady) {
    console.warn(
      'The frontend is ready but the backend has not answered yet. ' +
        'The UI will show its loading/error states until it does.',
    )
  }
  console.log(`FoldLens is ready at ${FRONTEND_URL}`)
  openBrowser(FRONTEND_URL)
}
