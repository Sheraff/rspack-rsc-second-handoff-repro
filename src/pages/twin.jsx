// Plain-client twin: an ordinary client component also renders Inner.
import { Outer } from '../Outer.jsx'
import { Twin } from '../Twin.jsx'

export function App() {
  return (
    <>
      <Outer />
      <Twin />
    </>
  )
}
