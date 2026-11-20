'use client'
// The only importer of the server action.
import { showInner } from './actions.jsx'

export function Outer() {
  return <button onClick={() => showInner()}>outer</button>
}
