// ** MUI Imports
import { Button } from '@mui/material'

// ** ThirdParty Components
import { useTranslation } from 'react-i18next'

// ** Utils Import
import { fetchPermission } from 'src/api/api'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import SearchBar from '../../components/SearchBar'
import Filter from '../../components/Filter'
import { useDispatch } from 'react-redux'
import { permissionActions } from 'src/reducers/management/PermissionReducer'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { Fragment, useContext } from 'react'
import Icon from 'src/@core/components/icon'

const PermissionsFilters = () => {
  // Traducciones
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // ** Selectors
  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const searchValue = useSelector((state: RootState) => state.permission.searchText)

  // Función para mostrar el formulario
  const toggleForm = async (permissionId: number | null) => {
    if (permissionId) {
      await fetchPermission(permissionId)
        .then(res => {
          dispatch(permissionActions.setPermission(res.data.data.permission))
          dispatch(permissionActions.setId(res.data.data.permission.id))
        })
        .catch(error => {
          handleError(error, logout)
        })
    } else {
      dispatch(permissionActions.setPermission(null))
      dispatch(permissionActions.setId(null))
    }
    dispatch(generalActions.setShowForm(true))
  }

  return (
    <Filter
      searchBar={
        <SearchBar
          value={searchValue}
          clearSearch={() => dispatch(permissionActions.setSearchText(''))}
          onChange={event => dispatch(permissionActions.setSearchText(event.target.value))}
        />
      }
      actions={
        <Fragment>
          {' '}
          {userPermissions.includes('global.permissions.create') && (
            <Button variant='contained' sx={{ mr: 4 }} type='submit' onClick={() => toggleForm(null)}>
              <Icon icon='tabler:plus' fontSize={20} />
              {t('New')}
            </Button>
          )}
        </Fragment>
      }
    ></Filter>
  )
}

export default PermissionsFilters
