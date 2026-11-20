// Builds the app with `rsbuild build`, then calls the server action from the built server bundle
// and prints what Rspack delivered to the client manifest.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const mode = process.argv[2] ?? 'repro'

if (mode === 'repro') {
  await check('nested', 'the action renders Inner, nothing else does')
  await check('twin', 'a client component also renders Inner')
} else if (mode === 'control') {
  await check('early', 'the server also renders Inner itself')
  await twoPass()
}

// Builds once and reports.
async function check(variant, label, seedFile) {
  build(variant, seedFile)
  const delivered = deliveredClientReferences()
  const server = await importServer()
  const page = await server.renderPage()
  const action = await callShowInner(server)
  const ok = page.errors.length === 0 && action.errors.length === 0
  console.log(`${ok ? 'OK ' : 'BUG'} ${variant.padEnd(8)} ${label}`)
  console.log(`    client manifest: ${delivered.join(', ')}`)
  console.log(`    Inner in client JS: ${innerInClientJs() ? 'yes' : 'no'}`)
  for (const error of page.errors) {
    console.log(`    page: ${error}`)
  }
  for (const error of action.errors) {
    console.log(`    showInner(): ${error}`)
  }
}

// Second complete build, seeded with the action modules the first build got back from
// the client after its handoff: the server entry imports them, so the server sees them before.
async function twoPass() {
  build('nested')
  const files = readJson('dist/actions-from-client.json')
  const seedFile = path.resolve('.seed/seed.js')
  fs.mkdirSync('.seed', { recursive: true })
  fs.writeFileSync(seedFile, files.map((file) => `import ${JSON.stringify(file)}\n`).join(''))
  await check('nested', 'second build, seeded from the first', seedFile)
}

function build(variant, seedFile) {
  fs.rmSync('dist', { recursive: true, force: true })
  const env = { ...process.env, VARIANT: variant }
  if (seedFile) {
    env.SEED_FILE = seedFile
  }
  execFileSync('node_modules/.bin/rsbuild', ['build'], { env, stdio: 'ignore' })
}

// File names of the client references Rspack passed to `onManifest` (entry `index`).
function deliveredClientReferences() {
  const manifest = readJson('dist/manifest.json').index
  return Object.keys(manifest.clientManifest).map((file) => path.basename(file))
}

function importServer() {
  return import(`${pathToFileURL('dist/server/index.js')}?${Date.now()}`)
}

// Calls the `showInner` server action the way a request handler does and serializes its result.
function callShowInner(server) {
  const manifest = readJson('dist/manifest.json').index
  const [actionId] = Object.keys(manifest.serverManifest)
  return server.callAction(actionId)
}

function innerInClientJs() {
  const dir = 'dist/client/static/js'
  const files = fs.readdirSync(dir, { recursive: true }).filter((file) => file.endsWith('.js'))
  return files.some((file) => fs.readFileSync(path.join(dir, file), 'utf8').includes('"inner"'))
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}
