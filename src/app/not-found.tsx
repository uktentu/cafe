import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center" style={{ fontFamily: 'var(--font-display)', background: 'var(--bg)', color: 'var(--txt)' }}>
      <h2 className="mb-4 text-4xl font-bold">404 - Not Found</h2>
      <p className="mb-8" style={{ color: 'var(--txt2)' }}>Could not find requested resource</p>
      <Link 
        href="/"
        className="rounded-full px-6 py-3 font-semibold transition-transform hover:scale-105 active:scale-95"
        style={{ background: 'var(--brand)', color: 'var(--bg)' }}
      >
        Return Home
      </Link>
    </div>
  )
}
