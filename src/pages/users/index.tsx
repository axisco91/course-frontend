// TrainingContracts.tsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useContext, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import Permission from 'src/views/components/Permission'
import useHasPermission from 'src/context/hasPermission'
import { Card, CardContent } from '@mui/material'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

// ✅ API (solo si el modal necesita listas maestras; si no, puedes borrar todo este bloque)
import { getRoles, getTeachers } from 'src/api/api'
import { teacherActions } from 'src/reducers/teachers/TeacherReducer'
import { userActions } from 'src/reducers/users/UserReducer'
import UsersTable from 'src/views/Users/UsersTable'
import UsersModal from 'src/views/Users/UsersModel'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import UsersDelete from 'src/views/Users/UsersDelete'
import { roleActions } from 'src/reducers/management/RoleReducer'
import UserCommissionModal from 'src/views/Users/UserCommissionModal'
import UsersFilters from 'src/views/Users/UsersFilters'

const Users = () => {
  const { t } = useTranslation()
  const hasPermission = useHasPermission(['read.users'])
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const [show, setShow] = useState(false)
  const modalOpen = useSelector((state: RootState) => state.user.modalOpen)
  const modalMode = useSelector((state: RootState) => state.user.modalMode)
  const userId = useSelector((state: RootState) => state.user.id)

  // ✅ reset UI when entering the page
  useEffect(() => {
    dispatch(userActions.closeUserModal())
    dispatch(userActions.setId(null))
  }, [dispatch])

  // ✅ preload master data (SOLO si tu TrainingContractsModal lo necesita)
  useEffect(() => {
    let cancelled = false

    const fetchGeneralData = async () => {
      try {
        const [teachersRes, rolesRes] = await Promise.all([getTeachers({ show_inactive: 'false' }), getRoles()])

        if (cancelled) return

        dispatch(teacherActions.setTeachers(teachersRes.data.data.teachers))
        dispatch(roleActions.setRoles(rolesRes.data.data.roles))
      } catch (error) {
        if (!cancelled) handleError(error, logout)
      } finally {
        if (!cancelled) setShow(true)
      }
    }

    if (hasPermission) fetchGeneralData()
    else setShow(true)

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission, dispatch])

  return (
    <Permission requiredPermissions={['read.users']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          {show && (
            <Card>
              <CardContent>
                <UsersFilters />
              </CardContent>

              <CardContent>
                <UsersTable />
              </CardContent>

              <UsersDelete />

              <UsersModal
                open={modalOpen}
                mode={modalMode}
                userId={userId}
                onClose={() => dispatch(userActions.closeUserModal())}
              />
              <UserCommissionModal />
            </Card>
          )}
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Users
