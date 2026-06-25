// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'

// ** Third Party Imports
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useEffect, useState } from 'react'
import { fetchRole, fetchRolePermissions } from 'src/api/api'
import { useRouter } from 'next/router'
import CustomSpinner from 'src/layouts/components/general/Spinner'
import Permission from 'src/views/components/Permission'
import { CardContent } from '@mui/material'
import { roleActions } from 'src/reducers/management/RoleReducer'
import RoleForm from 'src/views/management/roles/RoleForm'
import RolePermissions from 'src/views/management/roles/RolePermissions'
import { rolePermissionActions } from 'src/reducers/general/RolePermissionReducer'
import useHasPermission from 'src/context/hasPermission'

const Role = () => {
  // Para el idioma
  const { t } = useTranslation()
  const router = useRouter()
  const hasPermission = useHasPermission(['global.roles.update'])
  const id = router.query.id
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [loading, setLoading] = useState(true)

  // Obtenemos los datos que hace falta para los filtros
  useEffect(() => {
    const fetchGeneralData = async () => {
      if (id !== '0') {
        try {
          const [roleRes, PermissionRes] = await Promise.all([fetchRole(id), fetchRolePermissions({ role_id: id })])
          dispatch(roleActions.setRole(roleRes.data.data.role))
          dispatch(roleActions.setId(roleRes.data.data.role.id))
          dispatch(rolePermissionActions.setRolePermissions(PermissionRes.data.data.role_permissions))
        } catch (error) {
          router.push(`/404`)
        } finally {
          setIsLoading(false)
        }
      } else {
        dispatch(roleActions.setId(null))
        dispatch(roleActions.setRole(null))
      }
      setLoading(false)
    }

    // hacemos este if para que solo se haga las llamada una vez y Prevenir descargar datos y luego dando error
    if (loading && hasPermission) {
      fetchGeneralData()
    }
  })

  if (isLoading) {
    return <CustomSpinner />
  }

  return (
    <Permission requiredPermissions={['global.roles.update']}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title={t('Edit Roles')}></CardHeader>
            <CardContent>
              <RoleForm />
              <RolePermissions />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Role
