#!/usr/bin/env node
// Cross-platform one-time dependency setup for FoldLens.
//
// Linux / macOS: ./scripts/setup.sh   (or: node scripts/setup.mjs)
// Windows:       scripts\setup.cmd    (or: node scripts/setup.mjs)
//
// Python is managed exclusively through uv (see docs/ENVIRONMENT.md).

import { spawnSync } from 'node:child_process'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const IS_WINDOWS = process.platform === 'win32'

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

function findUv() {
  const candidates = [
    process.env.UV_BIN,
    process.env.FOLDLENS_UV,
    join(homedir(), '.local', 'bin', IS_WINDOWS ? 'uv.exe' : 'uv'),
    'uv',
  ].filter(Boolean)
  for (const candidate of candidates) {
    const result = spawnSync(candidate, ['--version'], { stdio: 'ignore' })
    if (result.status === 0) {
      return candidate
    }
  }
  return null
}

function run(label, command, args, cwd) {
  console.log(`==> ${label}`)
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: IS_WINDOWS && /npm(\.cmd)?$/i.test(command),
  })
  if (result.error) {
    console.error(`${label} failed: ${result.error.message}`)
    process.exit(1)
  }
  if (result.status !== 0) {
    console.error(`${label} failed with exit code ${result.status}.`)
    process.exit(result.status ?? 1)
  }
}

requireSupportedNode()
console.log(`Node ${process.version} — ${process.execPath}`)

const uv = findUv()
if (!uv) {
  console.error('uv was not found.')
  if (IS_WINDOWS) {
    console.error(
      'Install it with PowerShell:\n' +
        '  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"\n' +
        'Then reopen the terminal, or set UV_BIN to the uv.exe path.',
    )
  } else {
    console.error(
      'Install it with:\n' +
        '  curl -LsSf https://astral.sh/uv/install.sh | sh\n' +
        'Then reopen the terminal, or set UV_BIN to the uv path.',
    )
  }
  process.exit(1)
}

run(
  'Backend',
  uv,
  ['sync', '--locked', '--extra', 'dev', '--python', '3.12'],
  join(ROOT, 'backend'),
)

run(
  'Frontend',
  IS_WINDOWS ? 'npm.cmd' : 'npm',
  ['install'],
  join(ROOT, 'frontend'),
)

run(
  'Samples',
  process.execPath,
  [join(ROOT, 'scripts', 'fetch-samples.mjs')],
  ROOT,
)

console.log('')
console.log('Setup complete.')
console.log(
  IS_WINDOWS
    ? 'Start with: scripts\\dev.cmd'
    : 'Start with: ./scripts/dev.sh',
)
