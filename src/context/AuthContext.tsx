import { createContext, useCallback, useEffect, useRef, useState, ReactNode } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import authConfig from 'src/configs/auth'
import { getBasicUser, login, setUnauthorizedHandler } from 'src/api/api'
import { authActions } from 'src/reducers/users/AuthReducer'
import { AuthValuesType, LoginParams, ErrCallbackType, SuccessCallbackType, UserDataType } from './types'

const defaultProvider: AuthValuesType = {
  user: null,
  loading: true,
  initializationError: false,
  setUser: () => null,
  setLoading: () => Boolean,
  retryInitialization: () => Promise.resolve(),
  login: () => Promise.resolve(),
  logout: () => Promise.resolve()
}

const AuthContext = createContext(defaultProvider)

type Props = {
  children: ReactNode
}

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds))

const AuthProvider = ({ children }: Props) => {
  const dispatch = useDispatch()
  const router = useRouter()
  const { t } = useTranslation()
  const sessionExpirationInProgress = useRef(false)

  const [user, setUser] = useState<UserDataType | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializationError, setInitializationError] = useState(false)

  const clearSession = useCallback(() => {
    setUser(null)
    dispatch(authActions.resetAuth())
    window.localStorage.removeItem('userData')
    window.localStorage.removeItem(authConfig.storageTokenKeyName)
    window.localStorage.removeItem('verified')
  }, [dispatch])

  const handleSessionExpired = useCallback(() => {
    if (sessionExpirationInProgress.current) return

    sessionExpirationInProgress.current = true
    const returnUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`

    clearSession()
    setInitializationError(false)
    setLoading(false)

    void router.replace({
      pathname: '/login',
      query: returnUrl !== '/' && !returnUrl.startsWith('/login') ? { returnUrl } : undefined
    })
  }, [clearSession, router])

  const hydrateAuthenticatedUser = useCallback(
    (authenticatedUser: UserDataType) => {
      dispatch(authActions.setUser(authenticatedUser))
      dispatch(authActions.setAvatar(authenticatedUser.avatar ?? null))
      dispatch(authActions.setFullname(authenticatedUser.fullname))
      dispatch(authActions.setPermissions(authenticatedUser.permissions ?? []))
      setUser(authenticatedUser)
      window.localStorage.setItem('userData', JSON.stringify(authenticatedUser))
    },
    [dispatch]
  )

  const initializeAuth = useCallback(async (): Promise<void> => {
    setLoading(true)
    setInitializationError(false)
    sessionExpirationInProgress.current = false

    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    const storedUser = window.localStorage.getItem('userData')

    if (!storedToken) {
      clearSession()
      setLoading(false)

      return
    }

    let parsedStoredUser: Partial<UserDataType> = {}
    if (storedUser) {
      try {
        parsedStoredUser = JSON.parse(storedUser)
      } catch (error) {
        console.error('Error parsing stored user data', error)
        window.localStorage.removeItem('userData')
      }
    }

    try {
      let response

      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          response = await getBasicUser()
          break
        } catch (error: any) {
          const status = error?.response?.status
          const isTransient = !error?.response || status === 429 || status >= 500

          if (status === 401 || !isTransient || attempt === 2) throw error

          await wait(attempt === 0 ? 500 : 1000)
        }
      }

      const authenticatedUser = {
        ...parsedStoredUser,
        ...(response?.data?.data ?? {})
      } as UserDataType

      hydrateAuthenticatedUser(authenticatedUser)
      setLoading(false)
    } catch (error: any) {
      if (error?.response?.status === 401) {
        handleSessionExpired()

        return
      }

      console.error('Error restoring authenticated session', error)
      setUser(null)
      setInitializationError(true)
      setLoading(false)
    }
  }, [clearSession, handleSessionExpired, hydrateAuthenticatedUser])

  useEffect(() => setUnauthorizedHandler(handleSessionExpired), [handleSessionExpired])

  useEffect(() => {
    void initializeAuth()
  }, [initializeAuth])

  const handleLogin = (params: LoginParams, successCallback?: SuccessCallbackType, errorCallback?: ErrCallbackType) => {
    const formData = new FormData()
    formData.append('username', params.user)
    formData.append('password', params.password)
    formData.append('hostname', window.location.hostname)

    login(formData)
      .then(response => {
        if (!response.data.success) {
          errorCallback?.({ message: response.data.message })

          return
        }

        const authenticatedUser = response.data.data as UserDataType
        window.localStorage.setItem(authConfig.storageTokenKeyName, authenticatedUser.accessToken ?? '')
        dispatch(authActions.resetAuth())
        hydrateAuthenticatedUser(authenticatedUser)
        setInitializationError(false)
        sessionExpirationInProgress.current = false

        successCallback?.()
        void router.push('/home')
      })
      .catch(() => {
        errorCallback?.({ message: t('Username or password incorrect') })
      })
  }

  const handleLogout = () => {
    clearSession()
    setInitializationError(false)
    sessionExpirationInProgress.current = false
    void router.push('/login')
  }

  const values: AuthValuesType = {
    user,
    loading,
    initializationError,
    setUser,
    setLoading,
    retryInitialization: initializeAuth,
    login: handleLogin,
    logout: handleLogout
  }

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
