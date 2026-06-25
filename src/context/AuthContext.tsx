// ** React Imports
import { createContext, useEffect, useState, ReactNode, useContext } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Config
import authConfig from 'src/configs/auth'

// ** Types
import { AuthValuesType, LoginParams, ErrCallbackType, SuccessCallbackType, UserDataType } from './types'
import { getBasicUser, login } from 'src/api/api'
import { authActions } from 'src/reducers/users/AuthReducer'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useErrorHandler } from 'src/hooks/useErrorHandler'

// ** Defaults
const defaultProvider: AuthValuesType = {
  user: null,
  loading: true,
  setUser: () => null,
  setLoading: () => Boolean,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve()
}

const AuthContext = createContext(defaultProvider)

type Props = {
  children: ReactNode
}

const AuthProvider = ({ children }: Props) => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // ** States
  const [user, setUser] = useState<UserDataType | null>(defaultProvider.user)
  const [loading, setLoading] = useState<boolean>(defaultProvider.loading)

  // ** Hooks
  const router = useRouter()
  const { t } = useTranslation()

  useEffect(() => {
    const initAuth = async (): Promise<void> => {
      try {
        const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
        const storedUser = window.localStorage.getItem('userData')

        if (storedToken && storedUser) {
          // Mientras no uses fetchBasicUser, tiramos de lo que haya en localStorage
          try {
            const parsedUser = JSON.parse(storedUser)
            setUser(parsedUser)
          } catch (e) {
            console.error('Error parseando userData desde localStorage', e)
            localStorage.removeItem('userData')
          }
        } else {
          // Si no hay token, nos aseguramos de dejar el user a null
          setUser(null)
        }

        // Si más adelante quieres volver a usar fetchBasicUser, aquí sería algo tipo:
        if (storedToken) {
          setLoading(true)
          try {
            const response = await getBasicUser()

            // Guardar cosas en redux
            dispatch(authActions.setAvatar(response.data.data.avatar))
            dispatch(authActions.setFullname(response.data.data.fullname))
            dispatch(authActions.setPermissions(response.data.data.permissions))
          } catch (e) {
            // limpiar storage y redirigir a login si hace falta
          } finally {
            setLoading(false)
          }
        } else {
          setLoading(false)
        }
      } catch (error) {
        // Por si algún día quieres loguear errores aquí
        handleError(error, logout)
        setUser(null)
      } finally {
        // MUY IMPORTANTE: siempre pasamos loading a false
        setLoading(false)
      }
    }

    initAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = (params: LoginParams, successCallback?: SuccessCallbackType, errorCallback?: ErrCallbackType) => {
    const currentURL = window.location.href

    const formData = new FormData()
    formData.append('username', params.user)
    formData.append('password', params.password)
    formData.append('hostname', new URL(currentURL).hostname)

    login(formData)
      .then(async response => {
        if (response.data.success) {
          // Guardar token y datos

          window.localStorage.setItem(authConfig.storageTokenKeyName, response.data.data.accessToken)
          window.localStorage.setItem('userData', JSON.stringify(response.data.data))

          // Setear usuario en contexto
          setUser({ ...response.data.data })

          // Guardar cosas en redux
          dispatch(authActions.setAvatar(response.data.data.avatar))
          dispatch(authActions.setFullname(response.data.data.fullname))
          dispatch(authActions.setPermissions(response.data.data.permissions))

          // Si quieres que otras pantallas puedan decidir a dónde ir, llama también al callback:
          if (successCallback) successCallback()

          // Redirección por defecto al home
          router.push('/home')
        } else {
          if (errorCallback) {
            errorCallback({ message: response.data.message })
          }
        }
      })
      .catch(err => {
        if (errorCallback) errorCallback({ message: t('Username or password incorrect') })
      })
  }

  const handleLogout = () => {
    setUser(null)
    dispatch(authActions.setMustChangePassword(false))
    dispatch(authActions.setSkip2FaPrompt(true))
    window.localStorage.removeItem('userData')
    window.localStorage.removeItem(authConfig.storageTokenKeyName)
    window.localStorage.removeItem('verified')
    router.push('/login')
  }

  const values: AuthValuesType = {
    user,
    loading,
    setUser,
    setLoading,
    login: handleLogin,
    logout: handleLogout
  }

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
