'use server'
// Reached only from a client component. Its result renders a client component.
import { Inner } from './Inner.jsx'

export async function showInner() {
  return <Inner />
}
