// ** MUI Theme Provider
import { deepmerge } from '@mui/utils'
import { PaletteMode, ThemeOptions } from '@mui/material'

// ** User Theme Options
import UserThemeOptions from 'src/layouts/UserThemeOptions'

// ** Type Import
import { Settings } from 'src/@core/context/settingsContext'

// ** Theme Override Imports
import palette from './palette'
import spacing from './spacing'
import shadows from './shadows'
import overrides from './overrides'
import typography from './typography'
import breakpoints from './breakpoints'

type CompanyTheme = {
  primary?: string
  secondary?: string
  success?: string
  warning?: string
  error?: string
}

const themeOptions = (settings: Settings, overrideMode: PaletteMode, companyTheme?: CompanyTheme): ThemeOptions => {
  // ** Vars
  const { skin, mode, direction, themeColor } = settings

  // ** Create New object before removing user component overrides and typography objects from userThemeOptions
  const userThemeConfig: ThemeOptions = Object.assign({}, UserThemeOptions())

  const basePalette = palette(mode === 'semi-dark' ? overrideMode : mode, skin)

  const mergedThemeConfig: ThemeOptions = deepmerge(
    {
      breakpoints: breakpoints(),
      direction,
      components: overrides(settings),
      palette: basePalette,
      ...spacing,
      shape: { borderRadius: 6 },
      mixins: { toolbar: { minHeight: 64 } },
      shadows: shadows(mode === 'semi-dark' ? overrideMode : mode),
      typography
    },
    userThemeConfig
  )

  // ✅ 1) Vuexy: aplica themeColor (primary/secondary/success...)
  const vuexyPrimary =
    mergedThemeConfig.palette && (mergedThemeConfig.palette as any)[themeColor]
      ? (mergedThemeConfig.palette as any)[themeColor]
      : basePalette.primary

  // ✅ 2) Company theme: si viene, pisa colores; si no viene, deja Vuexy
  const finalPalettePatch: ThemeOptions = {
    palette: {
      primary: {
        ...(vuexyPrimary ?? {}),
        ...(companyTheme?.primary ? { main: companyTheme.primary } : {})
      },
      ...(companyTheme?.secondary
        ? { secondary: { ...(mergedThemeConfig.palette?.secondary ?? {}), main: companyTheme.secondary } }
        : {}),
      ...(companyTheme?.success
        ? { success: { ...(mergedThemeConfig.palette?.success ?? {}), main: companyTheme.success } }
        : {}),
      ...(companyTheme?.warning
        ? { warning: { ...(mergedThemeConfig.palette?.warning ?? {}), main: companyTheme.warning } }
        : {}),
      ...(companyTheme?.error
        ? { error: { ...(mergedThemeConfig.palette?.error ?? {}), main: companyTheme.error } }
        : {})
    }
  }

  // ⚠️ Nota:
  // aquí hacemos deepmerge(mergedThemeConfig, finalPalettePatch)
  // para que se quede todo lo demás igual.
  return deepmerge(mergedThemeConfig, finalPalettePatch)
}

export default themeOptions
