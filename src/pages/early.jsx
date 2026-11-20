// Control: the server itself renders Inner, so it is known before the handoff.
import { Outer } from '../Outer.jsx'
import { Inner } from '../Inner.jsx'

export function App() {
  return (
    <>
      <Outer />
      <Inner />
    </>
  )
}
