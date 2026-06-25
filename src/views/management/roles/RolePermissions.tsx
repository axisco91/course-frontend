// ** React Imports
import { useState, Fragment, useEffect, useContext } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Third Party Imports
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

// ** Icon Imports
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// ** Llamadas API
import { destroyRolePermission, storeRolePermission } from 'src/api/api'
import { FormControlLabel, Switch } from '@mui/material'
import { useDispatch } from 'react-redux'
import { rolePermissionActions } from 'src/reducers/general/RolePermissionReducer'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

const RolePermissions = () => {
  // Para el idioma
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // Obtenemos los datos
  const permissions = useSelector((state: RootState) => state.rolePermission.rolePermissions)
  const id = useSelector((state: RootState) => state.role.id)

  // array de los switches
  const [permissionsSwitches, setPermissionsSwitches] = useState<{
    [key: string]: { enabled: boolean; rolePermission: number }
  }>({})

  useEffect(() => {
    const initialSwitches: { [key: string]: { enabled: boolean; rolePermission: number; permissionId: number } } = {}
    permissions.forEach(permission => {
      // Comprueba si hay relación
      const enabled = !!permission.role_has_permission
      initialSwitches[permission.id] = {
        enabled,
        rolePermission: permission.role_has_permission,
        permissionId: permission.id
      }
    })
    setPermissionsSwitches(initialSwitches)
  }, [permissions])

  // Proceso de cambiar el estado del role
  const handleChange = (permissionId: number, rolePermission: number, checked: boolean) => {
    const formData = new FormData()
    formData.append('permission_id', permissionId ? permissionId.toString() : '')
    formData.append('role_id', id ? id.toString() : '')

    const data = {
      permission_id: permissionId,
      role_id: id
    }
    if (!rolePermission) {
      storeRolePermission(formData)
        .then(response => {
          // Vemos si nos da un success y lo indicamos
          if (response.data.success) {
            const rolePermission = 1

            // Al guardar en la bd lo marcamos correcto y guardamos su id para cuando lo eliminamos
            dispatch(rolePermissionActions.updateRolePermissionById({ permissionId, rolePermission }))

            setPermissionsSwitches(prev => ({
              ...prev,
              [permissionId]: {
                ...prev[permissionId],
                enabled: checked,
                rolePermission: 1
              }
            }))
            toast.success(response.data.message)
          }
        })
        .catch(error => {
          handleError(error, logout)
        })
    } else {
      destroyRolePermission(data)
        .then(response => {
          // Vemos si nos da un success y lo indicamos
          if (response.data.success) {
            toast.success(response.data.message)

            // Al ser eliminado de la bd lo desmarcamos
            const rolePermission = 0
            dispatch(rolePermissionActions.updateRolePermissionById({ permissionId, rolePermission }))
            setPermissionsSwitches(prevSwitches => ({
              ...prevSwitches,
              [permissionId]: {
                ...prevSwitches[permissionId],
                enabled: checked,
                rolePermission: 0
              }
            }))
          }
        })
        .catch(error => {
          handleError(error, logout)
        })
    }
  }

  const switchArray = () => {
    return permissions.map(permission => (
      <Grid item xs={12} sm={4} key={permission.id} sx={{ mt: 5 }}>
        <FormControlLabel
          labelPlacement='end'
          label={permission.name}
          control={
            <Switch
              checked={permissionsSwitches[permission.id]?.enabled || false}
              onChange={e => handleChange(permission.id, permission.role_has_permission, e.target.checked)}
            />
          }
        />
      </Grid>
    ))
  }

  return (
    <Fragment>
      <Grid container spacing={5}>
        {switchArray()}
      </Grid>
    </Fragment>
  )
}

export default RolePermissions
