import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

const useHasPermission = (requiredPermissions: string[]) => {
  const userPermissions = useSelector((state: RootState) => state.auth.permissions)

  const hasRequiredPermissions = requiredPermissions.every(permission => userPermissions.includes(permission))

  return hasRequiredPermissions
}

export default useHasPermission
