// ** React Imports
import { ReactNode, useEffect, useState } from 'react'

// ** Next Imports
import Head from 'next/head'
import { Router } from 'next/router'
import type { NextPage } from 'next'
import type { AppProps } from 'next/app'

import { Provider } from 'react-redux'
import store from '../reducers/store'

// ** Loader Import
import NProgress from 'nprogress'

// ** Emotion Imports
import { CacheProvider } from '@emotion/react'
import type { EmotionCache } from '@emotion/cache'

// ** Config Imports
import { defaultACLObj } from 'src/configs/acl'
import themeConfig from 'src/configs/themeConfig'

// ** Third Party Import
import { Toaster } from 'react-hot-toast'

// ** Component Imports
import UserLayout from 'src/layouts/UserLayout'
import AclGuard from 'src/@core/components/auth/AclGuard'
import ThemeComponent from 'src/theme/ThemeComponent'
import AuthGuard from 'src/@core/components/auth/AuthGuard'
import GuestGuard from 'src/@core/components/auth/GuestGuard'

// ** Contexts
import { AuthProvider } from 'src/context/AuthContext'
import { SettingsConsumer, SettingsProvider } from 'src/@core/context/settingsContext'

// ** Utils Imports
import { createEmotionCache } from 'src/@core/utils/create-emotion-cache'

// ** Prismjs Styles
import 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'

// ** React Perfect Scrollbar Style
import 'react-perfect-scrollbar/dist/css/styles.css'

import 'src/iconify-bundle/icons-bundle-react'

// ** Global css styles
import '../../styles/globals.css'
import {
  getActionTypes,
  getCnaes,
  getCompanyActivities,
  getCompanySettings,
  getCompanyTypes,
  getCourseStatuses,
  getCourseTypes,
  getExcludedDayTypes,
  getIncidenceTypes,
  getLevelStudies,
  getMainCompanyBasic,
  getOccupations,
  getOnLeaveTypes,
  getPayments,
  getProfessionalCategories,
  getProvinces,
  getQuoteGroups,
  getTrainingActionGroups,
  getTrainingActionLevels,
  getTutorings,
  logout
} from 'src/api/api'
import '../../styles/CustomSpinner.css'

import 'src/configs/i18n'
import { provinceActions } from 'src/reducers/general/ProvinceReducer'
import CustomSpinner from 'src/layouts/components/general/Spinner'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { registerLocales } from 'src/context/Traslations'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import StartupRedirect from 'src/components/StartupRedirect'
import { levelStudyActions } from 'src/reducers/general/LevelStudyReducer'
import { companyTypeActions } from 'src/reducers/company/CompanyTypeReducer'
import { companyActivityActions } from 'src/reducers/company/CompanyActivityReducer'
import { cnaeActions } from 'src/reducers/general/CnaeReducer'
import { quoteGroupActions } from 'src/reducers/general/QuoteGroupReducer'
import { courseTypeActions } from 'src/reducers/courses/CourseTypeReducer'
import { courseStatusActions } from 'src/reducers/courses/CourseStatusReducer'
import { professionalCategoryActions } from 'src/reducers/general/ProfessionalCategoryReducer'
import { incidenceTypeActions } from 'src/reducers/company/IncidenceTypeReducer'
import { actionTypeActions } from 'src/reducers/trainingActions/ActionTypeReducer'
import { trainingActionLevelActions } from 'src/reducers/trainingActions/TrainingActionLevelReducer'
import { trainingActionGroupActions } from 'src/reducers/trainingActions/TrainingActionGroupReducer'
import { tutoringActions } from 'src/reducers/trainingActions/TutoringReducer'
import { occupationActions } from 'src/reducers/trainingContracts/OccupationsReducer'
import { onLeaveActions } from 'src/reducers/trainingContracts/OnLeaveReducer'
import { paymentActions } from 'src/reducers/general/PaymentReducer'
import { excludedDayTypeActions } from 'src/reducers/trainingContracts/ExcludedDayTypeReducer'
import { layoutActions } from 'src/reducers/general/LayoutReducer'
import '@fullcalendar/common/main.css'
import { companySettingActions } from 'src/reducers/company/CompanySettingReducer'

// ** Extend App Props with Emotion
type ExtendedAppProps = AppProps & {
  Component: NextPage
  emotionCache: EmotionCache
}

type GuardProps = {
  authGuard: boolean
  guestGuard: boolean
  children: ReactNode
}

const clientSideEmotionCache = createEmotionCache()

// ** Pace Loader
if (themeConfig.routingLoader) {
  Router.events.on('routeChangeStart', () => {
    NProgress.start()
  })
  Router.events.on('routeChangeError', () => {
    NProgress.done()
  })
  Router.events.on('routeChangeComplete', () => {
    NProgress.done()
  })
}

const Guard = ({ children, authGuard, guestGuard }: GuardProps) => {
  if (guestGuard) {
    return <GuestGuard fallback={<CustomSpinner />}>{children}</GuestGuard>
  } else if (!guestGuard && !authGuard) {
    return <>{children}</>
  } else {
    return <AuthGuard fallback={<CustomSpinner />}>{children}</AuthGuard>
  }
}

// ** Configure JSS & ClassName
const App = (props: ExtendedAppProps) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props

  const { handleError } = useErrorHandler()

  // Variables
  const contentHeightFixed = Component.contentHeightFixed ?? false
  const getLayout =
    Component.getLayout ?? (page => <UserLayout contentHeightFixed={contentHeightFixed}>{page}</UserLayout>)

  const setConfig = Component.setConfig ?? undefined

  const authGuard = Component.authGuard ?? true
  const guestGuard = Component.guestGuard ?? false
  const aclAbilities = Component.acl ?? defaultACLObj

  const fallbackIcon = '/images/favicon.png'
  const [title, setTitle] = useState('Zona')
  const [favicon, setFavicon] = useState(fallbackIcon)

  // loading para datos iniciales de layout (logo, provincias, etc.)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    registerLocales()

    const interval = setInterval(() => {
      // console.log('Interval running')
    }, 1000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadLayoutCatalogs() {
    const results = await Promise.allSettled([
      getProvinces(),
      getProfessionalCategories(),
      getLevelStudies(),
      getCompanyTypes(),
      getCompanyActivities(),
      getCnaes(),
      getQuoteGroups(),
      getCourseTypes(),
      getCourseStatuses(),
      getIncidenceTypes(),
      getActionTypes(),
      getTrainingActionLevels(),
      getTrainingActionGroups(),
      getTutorings(),
      getOccupations(),
      getOnLeaveTypes(),
      getPayments(),
      getExcludedDayTypes(),
      getCompanySettings()
    ])

    const dispatchIfFulfilled = (result: PromiseSettledResult<any>, action: (value: any) => void) => {
      if (result.status === 'fulfilled') {
        action(result.value)
      }
    }

    dispatchIfFulfilled(results[0], response => store.dispatch(provinceActions.setProvinces(response.data.data.provinces)))
    dispatchIfFulfilled(results[1], response =>
      store.dispatch(
        professionalCategoryActions.setProfessionalCategories(response.data.data.professional_categories)
      )
    )
    dispatchIfFulfilled(results[2], response =>
      store.dispatch(levelStudyActions.setLevelStudies(response.data.data.level_studies))
    )
    dispatchIfFulfilled(results[3], response => store.dispatch(companyTypeActions.setCompanyTypes(response.data.data.company_types)))
    dispatchIfFulfilled(results[4], response =>
      store.dispatch(companyActivityActions.setCompanyActivities(response.data.data.company_activities))
    )
    dispatchIfFulfilled(results[5], response => store.dispatch(cnaeActions.setCnaes(response.data.data.cnaes)))
    dispatchIfFulfilled(results[6], response =>
      store.dispatch(quoteGroupActions.setQuoteGroups(response.data.data.quote_groups))
    )
    dispatchIfFulfilled(results[7], response =>
      store.dispatch(courseTypeActions.setCourseTypes(response.data.data.course_types))
    )
    dispatchIfFulfilled(results[8], response =>
      store.dispatch(courseStatusActions.setCourseStatuses(response.data.data.course_statuses))
    )
    dispatchIfFulfilled(results[9], response =>
      store.dispatch(incidenceTypeActions.setIncidenceTypes(response.data.data.incidence_types))
    )
    dispatchIfFulfilled(results[10], response =>
      store.dispatch(actionTypeActions.setActionTypes(response.data.data.action_types))
    )
    dispatchIfFulfilled(results[11], response =>
      store.dispatch(trainingActionLevelActions.setTrainingActionLevels(response.data.data.training_action_levels))
    )
    dispatchIfFulfilled(results[12], response =>
      store.dispatch(trainingActionGroupActions.setTrainingActionGroups(response.data.data.training_action_groups))
    )
    dispatchIfFulfilled(results[13], response => store.dispatch(tutoringActions.setTutorings(response.data.data.tutorings)))
    dispatchIfFulfilled(results[14], response =>
      store.dispatch(occupationActions.setOccupations(response.data.data.occupations))
    )
    dispatchIfFulfilled(results[15], response => store.dispatch(onLeaveActions.setOnLeaves(response.data.data.on_leave_types)))
    dispatchIfFulfilled(results[16], response => store.dispatch(paymentActions.setPayments(response.data.data.payments)))
    dispatchIfFulfilled(results[17], response =>
      store.dispatch(excludedDayTypeActions.setExcludedDayTypes(response.data.data.excluded_day_types))
    )
    dispatchIfFulfilled(results[18], response =>
      store.dispatch(companySettingActions.setCompanySettings(response.data.data.company_settings))
    )
  }

  async function fetchData() {
    try {
      const hostname = new URL(window.location.href).hostname

      const toAbsoluteAssetUrl = (asset: string | null | undefined) => {
        if (!asset) return fallbackIcon

        const value = String(asset).trim()
        if (!value) return fallbackIcon

        if (
          value.startsWith('http://') ||
          value.startsWith('https://') ||
          value.startsWith('data:') ||
          value.startsWith('blob:')
        ) {
          return value
        }

        if (value.startsWith('/images/')) return value

        const backendFromEnv = process.env.NEXT_PUBLIC_ASSET_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_URL || ''
        const apiOrigin = (
          backendFromEnv || (hostname === 'localhost' ? 'http://127.0.0.1:8001' : 'https://api.academypro.app')
        ).replace(/\/$/, '')

        const cleanedValue = value.replace(/^\//, '')
        const isStoragePath = cleanedValue.startsWith('storage/')
        const isPublicStoragePath = cleanedValue.startsWith('public/storage/')
        const forceStoragePrefix = process.env.NEXT_PUBLIC_FORCE_STORAGE_PREFIX !== 'false'

        // No forzamos /storage salvo que ya venga así o lo pidas por env.
        // Si viene "public/storage/...", lo normalizamos a "storage/...".
        const normalizedPath = isPublicStoragePath
          ? `/storage/${cleanedValue.replace(/^public\/storage\//, '')}`
          : isStoragePath || forceStoragePrefix
          ? `/storage/${cleanedValue.replace(/^storage\//, '')}`
          : `/${cleanedValue}`

        return `${apiOrigin}${normalizedPath}`
      }

      // Esta llamada no debe depender del resto de endpoints autenticados.
      const mainCompanyResponse = await getMainCompanyBasic({ hostname })
      const mc = mainCompanyResponse?.data?.data?.main_company ?? {}
      const companyTitle = mc.title || mc.name || 'Zona'
      const companyLogo = toAbsoluteAssetUrl(mc.logo)
      console.log(companyLogo)

      store.dispatch(
        layoutActions.setTheme({
          primary: mc.primary_color || '#7367F0',
          secondary: mc.secondary_color || '#A8AAAE',
          success: mc.success_color || '#28C76F',
          warning: mc.warning_color || '#FF9F43',
          error: mc.error_color || '#EA5455'
        })
      )
      setTitle(companyTitle)
      setFavicon(companyLogo)
      store.dispatch(layoutActions.setLogo(companyLogo))
      store.dispatch(layoutActions.setIcon(companyLogo))
      store.dispatch(layoutActions.setTitle(companyTitle))

      // En páginas públicas (authGuard=false) no pedimos catálogos protegidos.
      if (!authGuard) {
        return
      }

      void loadLayoutCatalogs().catch(error => {
        console.error('Error loading layout catalogs', error)
      })
    } catch (error) {
      console.log(error)

      // Ya no pasamos logout aquí, porque estamos fuera de AuthProvider
      handleError(error, logout)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Provider store={store}>
        <CacheProvider value={emotionCache}>
          <Head>
            <title>{title}</title>
            <meta name='description' content={title} />
            <meta name='keywords' content='Material Design, MUI, Admin Template, React Admin Template' />
            <meta name='viewport' content='initial-scale=1, width=device-width' />
            <meta name='google' content='notranslate'></meta>
            <link rel='shortcut icon' href={favicon} />
          </Head>

          <AuthProvider>
            <StartupRedirect />
            <SettingsProvider {...(setConfig ? { pageSettings: setConfig() } : {})}>
              <SettingsConsumer>
                {({ settings }) =>
                  loading ? (
                    <CustomSpinner />
                  ) : (
                    <ThemeComponent settings={settings}>
                      <Guard authGuard={authGuard} guestGuard={guestGuard}>
                        <AclGuard aclAbilities={aclAbilities} guestGuard={guestGuard} authGuard={authGuard}>
                          {getLayout(<Component {...pageProps} />)}
                        </AclGuard>
                      </Guard>
                      <Toaster
                        position={settings.toastPosition}
                        toastOptions={{ className: 'react-hot-toast' }}
                        containerStyle={{ zIndex: 2147483647 }}
                      />
                    </ThemeComponent>
                  )
                }
              </SettingsConsumer>
            </SettingsProvider>
          </AuthProvider>
        </CacheProvider>
      </Provider>
    </DndProvider>
  )
}

export default App
