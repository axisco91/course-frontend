// ** React Imports
import { Fragment, useContext } from 'react'

// ** Utils Import
import { destroyPermission } from 'src/api/api'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import DeleteElement from '../../components/DeleteElement'
import { useDispatch } from 'react-redux'
import { permissionActions } from 'src/reducers/management/PermissionReducer'
import { toast } from 'react-hot-toast'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

const PermissionsDelete = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // ** Selectors
  const id = useSelector((state: RootState) => state.permission.id)
  const showEliminateDialog = useSelector((state: RootState) => state.permission.showEliminateDialog)

  // Realizamos las acciones del dialogo de eliminar
  const handleDelete = () => {
    destroyPermission(id)
      .then(response => {
        // Vemos si nos da un success y lo indicamos
        if (response.data.success) {
          dispatch(generalActions.addFilterButtonClickCount())
          toast.success(response.data.message)
          handleCloseDelete()
        } else {
        }
      })
      .catch(error => {
        handleCloseDelete()
        handleError(error, logout)
      })
  }

  // Cancelamos la eliminación
  const handleCloseDelete = () => {
    dispatch(permissionActions.setId(null))
    dispatch(permissionActions.setShowEliminateDialog(false))
  }

  return (
    <Fragment>{showEliminateDialog && <DeleteElement onDelete={handleDelete} onClose={handleCloseDelete} />}</Fragment>
  )
}

export default PermissionsDelete
