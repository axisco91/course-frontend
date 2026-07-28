export type ErrCallbackType = (err: { [key: string]: string }) => void
export type SuccessCallbackType = /*unresolved*/ any

export type LoginParams = {
  user: string
  password: string
  rememberMe?: boolean
}

export type UserDataType = {
  id?: number
  role: string
  user?: string
  email: string
  fullname: string
  username: string
  avatar?: string | null
  accessToken?: string
  permissions: string[]
  default_access?: number
}

export type AuthValuesType = {
  loading: boolean
  initializationError: boolean
  logout: () => void
  retryInitialization: () => Promise<void>
  user: UserDataType | null
  setLoading: (value: boolean) => void
  setUser: (value: UserDataType | null) => void
  login: (params: LoginParams, successCallback?: SuccessCallbackType, errorCallback?: ErrCallbackType) => void
}

export type LoadingValuesType = {
  loading: boolean
  setLoading: (value: boolean) => void
}
