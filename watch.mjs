// `rsbuild build --watch` on the nested page, then two edits: does a later compilation deliver Inner?
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

const page = 'src/pages/nested.jsx'
const original = fs.readFileSync(page, 'utf8')

fs.rmSync('dist', { recursive: true, force: true })
const watcher = spawn('node_modules/.bin/rsbuild', ['build', '--watch'], {
  env: { ...process.env, VARIANT: 'nested' },
  stdio: 'ignore',
})

try {
  await nextManifest(0)
  report('first build ')

  for (const edit of [1, 2]) {
    const editedAt = Date.now()
    fs.writeFileSync(page, `${original}// edit ${edit}\n`)
    await nextManifest(editedAt)
    report(`after edit ${edit}`)
  }
} finally {
  fs.writeFileSync(page, original)
  watcher.kill()
}

// Waits until `onManifest` wrote dist/manifest.json after `time`.
async function nextManifest(time) {
  for (let i = 0; i < 200; i++) {
    if (fs.existsSync('dist/manifest.json') && fs.statSync('dist/manifest.json').mtimeMs > time) {
      await sleep(300)
      return
    }
    await sleep(100)
  }
  throw new Error('no new manifest after 20 s')
}

function report(label) {
  const manifest = JSON.parse(fs.readFileSync('dist/manifest.json', 'utf8')).index
  const delivered = Object.keys(manifest.clientManifest).map((file) => path.basename(file))
  const verdict = delivered.includes('Inner.jsx') ? 'OK ' : 'BUG'
  console.log(`${verdict} ${label}  client manifest: ${delivered.join(', ')}`)
}
