import { useRouter } from 'next/router'
import { ReactNode, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

interface PermissionProps {
  children: ReactNode | ReactNode[]
  requiredPermissions: string[] // Add a prop for required permissions
}

const Permission: React.FC<PermissionProps> = ({ children, requiredPermissions }) => {
  const router = useRouter()
  const userPermissions = useSelector((state: RootState) => state.auth.permissions)

  useEffect(() => {
    const hasRequiredPermissions = requiredPermissions.every(permission => userPermissions.includes(permission))

    if (!hasRequiredPermissions) {
      router.push('/unauthorized')
    }
  }, [requiredPermissions])

  return <>{children}</> // Render children directly
}

export default Permission
