// Public-menu layout: injects the active theme's CSS custom properties on both
// the wrapper div AND :root so that body/html background tracks the theme color.
// This prevents the white "bounce" gap that appears when over-scrolling on mobile.
import { getConfig } from '@/lib/config'
import { themeCssVars, THEMES, resolveTheme, INVERSE_THEMES } from '@/lib/design-tokens'
import { themeFontVars, FONT_VARS_CLASS } from '@/lib/fonts'
import { getMenuData } from '@/lib/menu-data'
import { MenuRuntime } from '@/components/menu/MenuRuntime'

export default async function MenuLayout({ children }: { children: React.ReactNode }) {
  const { theme: envTheme, slug, tier } = getConfig()
  const data = await getMenuData(slug)
  const business = data?.business ?? null
  const theme = resolveTheme(tier, business?.theme ?? envTheme)

  const scheme = THEMES[theme]?.scheme ?? 'dark'
  const inverseTheme = INVERSE_THEMES[theme] ?? 'mercado'

  const cssVars = {
    ...themeCssVars(theme, business?.theme_color),
    ...themeFontVars(theme),
  }
  
  const inverseVars = {
    ...themeCssVars(inverseTheme, business?.theme_color),
    ...themeFontVars(inverseTheme),
  }

  // Serialize CSS vars for :root injection
  const toStr = (obj: Record<string, string>) => Object.entries(obj).map(([k, v]) => `${k}:${v}`).join(';')
  const rootVarsString = toStr(cssVars)
  const inverseVarsString = toStr(inverseVars)

  const darkVarsStr = scheme === 'dark' ? rootVarsString : inverseVarsString
  const lightVarsStr = scheme === 'light' ? rootVarsString : inverseVarsString

  const style = {
    background: 'var(--bg)',
    color: 'var(--txt)',
    minHeight: '100svh',
    fontFamily: 'var(--font-body)',
  } as React.CSSProperties

  return (
    <>
      {/* Inject vars on :root so body/html bg = theme bg, and support dark/light overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root { ${rootVarsString}; color-scheme: ${scheme}; }
        :root.dark { ${darkVarsStr}; color-scheme: dark; }
        :root.light { ${lightVarsStr}; color-scheme: light; }
        html,body{background:var(--bg)}
      `}} />
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
