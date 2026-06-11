'use client'

// "Our Story" strip — a branded about section that leans on the theme's display
// font and colour tokens so it reads as part of each template. Renders only when
// the owner has written a story (businesses.social_links.about). Light/dark themes
// get the right surface automatically via tokens.
import type { Business, Theme } from '@/types/database'
import { useLanguage } from './LanguageProvider'

export function OurStory({ business, theme }: { business: Business; theme: Theme }) {
  const { tUi } = useLanguage()
  const story = business.social_links?.about?.trim()
  if (!story) return null

  const heading = tUi('Our Story', 'Our Story')
  const upper = theme === 'mercado' || theme === 'bazaar' || theme === 'studio'

  return (
    <section
      aria-label="Our Story"
      className="px-6 py-10 lg:py-14"
      style={{ background: 'var(--sf1)', borderTop: '1px solid var(--bdr)', borderBottom: '1px solid var(--bdr)' }}
    >
      <div className="mx-auto max-w-2xl text-center">
        {/* brand ornament */}
        <div className="mb-4 flex items-center justify-center gap-2" aria-hidden="true">
          <span className="h-px w-8" style={{ background: 'var(--brand)' }} />
          <span className="h-1.5 w-1.5 rotate-45" style={{ background: 'var(--brand)' }} />
          <span className="h-px w-8" style={{ background: 'var(--brand)' }} />
        </div>

        <h2
          className="mb-4"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--txt)',
            fontSize: 'clamp(1.4rem, 6vw, 2.2rem)',
            lineHeight: 1.1,
            textTransform: upper ? 'uppercase' : 'none',
            letterSpacing: upper ? '0.04em' : '0',
          }}
        >
          {heading}
        </h2>

        <p
          className="whitespace-pre-line text-balance"
          style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--txt2)',
            fontSize: 'clamp(0.95rem, 3.5vw, 1.05rem)',
            lineHeight: 1.75,
          }}
        >
          {story}
        </p>
      </div>
    </section>
  )
}
