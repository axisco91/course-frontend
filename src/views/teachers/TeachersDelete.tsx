// ** React Imports
import { Fragment, useContext } from 'react'

// ** Utils Import
import { deleteTeacher } from 'src/api/api'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useDispatch } from 'react-redux'
import { toast } from 'react-hot-toast'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import DeleteElement from '../components/DeleteElement'
import { teacherActions } from 'src/reducers/teachers/TeacherReducer'

const TeachersDelete = () => {
  // Traducciones
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // ** Selectors
  const showEliminateDialog = useSelector((state: RootState) => state.teacher.showEliminateDialog)
  const id = useSelector((state: RootState) => state.teacher.id)

  // Realizamos las acciones del dialogo de eliminar
  const handleDelete = () => {
    if (!id) return
    deleteTeacher(id)
      .then(response => {
        // Vemos si nos da un success y lo indicamos
        if (response.data.success) {
          dispatch(generalActions.addFilterButtonClickCount())
          toast.success(response.data.message)
          handleCloseDelete()
        }
      })
      .catch(error => {
        handleCloseDelete()
        handleError(error, logout)
      })
  }

  // Cancelamos la eliminación
  const handleCloseDelete = () => {
    dispatch(teacherActions.setId(null))
    dispatch(teacherActions.setShowEliminateDialog(false))
  }

  return (
    <Fragment>{showEliminateDialog && <DeleteElement onDelete={handleDelete} onClose={handleCloseDelete} />}</Fragment>
  )
}

export default TeachersDelete
