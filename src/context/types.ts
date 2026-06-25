export type ErrCallbackType = (err: { [key: string]: string }) => void
export type SuccessCallbackType = /*unresolved*/ any

export type LoginParams = {
  user: string
  password: string
  rememberMe?: boolean
}

export type UserDataType = {
  id: number
  role: []
  user: string
  email: string
  fullName: string
  username: string
  password: string
  avatar?: string | null
  accessToken: string
  permissions: []
  default_access: number
}

export type AuthValuesType = {
  loading: boolean
  logout: () => void
  user: UserDataType | null
  setLoading: (value: boolean) => void
  setUser: (value: UserDataType | null) => void
  login: (params: LoginParams, successCallback?: SuccessCallbackType, errorCallback?: ErrCallbackType) => void
}

export type LoadingValuesType = {
  loading: boolean
  setLoading: (value: boolean) => void
}
