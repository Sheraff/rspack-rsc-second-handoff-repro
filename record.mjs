// Test instrumentation only: writes what the server compilation handed off and got back.
import fs from 'node:fs'

// The delivered side: the manifest Rspack passes to `onManifest`.
export function recordManifest(chain) {
  chain.plugin('rsc-server').tap(([options]) => [
    {
      ...options,
      onManifest(manifest) {
        writeJson('dist/manifest.json', manifest)
      },
    },
  ])
}

// The action modules the client handed back to the server (Rspack adds them through
// `builtin:rsc-action-entry-loader?actions=...&from-client=true`).
export class RecordActionsFromClient {
  apply(compiler) {
    compiler.hooks.done.tap('RecordActionsFromClient', (stats) => {
      const files = new Set()
      for (const module of stats.compilation.modules) {
        const request = module.identifier()
        const match = /rsc-action-entry-loader\?actions=([^&!]*)&from-client=true/.exec(request)
        if (match) {
          const actions = JSON.parse(decodeURIComponent(match[1]))
          for (const file of Object.keys(actions)) {
            files.add(file)
          }
        }
      }
      writeJson('dist/actions-from-client.json', [...files])
    })
  }
}

function writeJson(file, value) {
  fs.mkdirSync('dist', { recursive: true })
  fs.writeFileSync(file, JSON.stringify(value, null, 2))
}
