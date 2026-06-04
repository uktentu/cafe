// Public-menu layout: injects the active theme's CSS custom properties on both
// the wrapper div AND :root so that body/html background tracks the theme color.
// This prevents the white "bounce" gap that appears when over-scrolling on mobile.
import { getConfig } from '@/lib/config'
import { themeCssVars, THEMES } from '@/lib/design-tokens'
import { themeFontVars, FONT_VARS_CLASS } from '@/lib/fonts'
import { getMenuData } from '@/lib/menu-data'
import { MenuRuntime } from '@/components/menu/MenuRuntime'

export default async function MenuLayout({ children }: { children: React.ReactNode }) {
  const { theme: envTheme, slug } = getConfig()
  const data = await getMenuData(slug)
  const business = data?.business ?? null
  const theme = business?.theme ?? envTheme

  const scheme = THEMES[theme]?.scheme ?? 'dark'
  const cssVars = {
    ...themeCssVars(theme, business?.theme_color),
    ...themeFontVars(theme),
  }

  // Serialize CSS vars for :root injection to fix body/html background on overscroll.
  const rootVarsString = Object.entries(cssVars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')

  const style = {
    ...cssVars,
    background: 'var(--bg)',
    color: 'var(--txt)',
    colorScheme: scheme,
    minHeight: '100svh',
    fontFamily: 'var(--font-body)',
  } as React.CSSProperties

  return (
    <>
      {/* Inject vars on :root so body/html bg = theme bg, preventing white overscroll gaps */}
      <style>{`:root{${rootVarsString}}html,body{background:var(--bg);color-scheme:${scheme}}`}</style>
      <div className={FONT_VARS_CLASS} style={style}>
        <MenuRuntime
          businessId={business?.id ?? ''}
          measurementId={business?.firebase_measurement_id ?? null}
        >
          {children}
        </MenuRuntime>
      </div>
    </>
  )
}
