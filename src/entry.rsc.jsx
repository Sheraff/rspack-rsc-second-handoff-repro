// Server entry (react-server layer). Nothing here imports src/actions.jsx
// (except the two-pass control's seed).
import {
  loadServerAction,
  renderToReadableStream,
} from 'react-server-dom-rspack/server.node'
import { App } from 'page' // src/pages/<VARIANT>.jsx
import 'seed' // src/no-seed.js, except in the two-pass control

// Calls a server action the way a server handler does, and serializes what it returns.
export async function callAction(actionId) {
  const action = loadServerAction(actionId)
  const result = await action()
  return flightText(result)
}

export function renderPage() {
  return flightText(<App />)
}

async function flightText(node) {
  const errors = []
  const stream = renderToReadableStream(node, {
    onError(error) {
      errors.push(error.message)
    },
  })
  const text = await new Response(stream).text()
  return { text, errors }
}
