#!/usr/bin/env node
// Download the six bundled samples and their RCSB thumbnails.
// Existing files are kept unless --force is passed.
//
// Linux / macOS: ./scripts/fetch-samples.sh --force
// Windows:       scripts\fetch-samples.cmd --force
// Any platform:  node scripts/fetch-samples.mjs --force

import { mkdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const PDB_IDS = ['1CRN', '1UBQ', '1LYZ', '4HHB', '6M0J', '1L2Y']
const FORCE = process.argv.includes('--force')

async function hasContent(path) {
  try {
    const info = await stat(path)
    return info.size > 0
  } catch {
    return false
  }
}

async function download(url, path) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30_000),
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const bytes = new Uint8Array(await response.arrayBuffer())
      await writeFile(path, bytes)
      return
    } catch (error) {
      if (attempt === 3) {
        throw new Error(`${url}: ${error.message}`)
      }
    }
  }
}

async function keepOrFetch(label, url, path) {
  if (!FORCE && (await hasContent(path))) {
    console.log(`keep ${label}`)
    return
  }
  console.log(`fetch ${label}`)
  await download(url, path)
}

await mkdir(join(ROOT, 'data', 'samples'), { recursive: true })
await mkdir(join(ROOT, 'data', 'thumbnails'), { recursive: true })

try {
  for (const pdbId of PDB_IDS) {
    const lowerId = pdbId.toLowerCase()
    await keepOrFetch(
      `${pdbId}.cif`,
      `https://files.rcsb.org/download/${pdbId}.cif`,
      join(ROOT, 'data', 'samples', `${pdbId}.cif`),
    )
    await keepOrFetch(
      `${lowerId}_assembly-1.jpeg`,
      `https://cdn.rcsb.org/images/structures/${lowerId}_assembly-1.jpeg`,
      join(ROOT, 'data', 'thumbnails', `${lowerId}_assembly-1.jpeg`),
    )
  }
} catch (error) {
  console.error(`Could not download samples: ${error.message}`)
  console.error('The six samples are committed to the repository; a fresh clone already has them.')
  process.exit(1)
}

console.log('Samples ready in data/.')
