import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { Layers, pluginRSC } from 'rsbuild-plugin-rsc'
import { RecordActionsFromClient, recordManifest } from './record.mjs'

// Which page the server entry renders: src/pages/<VARIANT>.jsx.
const variant = process.env.VARIANT ?? 'nested'
// Two-pass control: a module importing the action modules a previous build got back from
// the client (written by repro.mjs), so the server sees them before its handoff.
const seed = process.env.SEED_FILE ?? './src/no-seed.js'

export default defineConfig({
  plugins: [pluginReact(), pluginRSC()],
  resolve: {
    alias: { page: `./src/pages/${variant}.jsx`, seed },
  },
  output: { minify: false },
  environments: {
    server: {
      source: {
        entry: {
          index: { import: './src/entry.rsc.jsx', layer: Layers.rsc },
        },
      },
      output: { module: true, distPath: { root: 'dist/server' } },
      tools: {
        bundlerChain: recordManifest,
        rspack: { plugins: [new RecordActionsFromClient()] },
      },
    },
    client: {
      source: { entry: { index: './src/entry.client.jsx' } },
      output: { distPath: { root: 'dist/client' } },
    },
  },
})
