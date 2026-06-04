// Async-loaded Framer Motion feature bundle (gestures + layout + drag). Imported
// dynamically by MenuRuntime's <LazyMotion>, so this ~30KB stays OUT of the
// first-load JS — it streams in just after hydration. `m` components animate
// once it arrives.
import { domMax } from 'framer-motion'

export default domMax
