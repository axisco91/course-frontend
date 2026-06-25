// ** React Imports
import { Fragment, useContext } from 'react'

// ** Utils Import
import { deleteStudent } from 'src/api/api'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useDispatch } from 'react-redux'
import { toast } from 'react-hot-toast'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import DeleteElement from '../components/DeleteElement'
import { studentActions } from 'src/reducers/students/StudentReducer'

const StudentsDelete = () => {
  // Traducciones
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // ** Selectors
  const showEliminateDialog = useSelector((state: RootState) => state.student.showEliminateDialog)
  const id = useSelector((state: RootState) => state.student.id)

  // Realizamos las acciones del dialogo de eliminar
  const handleDelete = () => {
    if (!id) return
    deleteStudent(id)
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
    dispatch(studentActions.setId(null))
    dispatch(studentActions.setShowEliminateDialog(false))
  }

  return (
    <Fragment>{showEliminateDialog && <DeleteElement onDelete={handleDelete} onClose={handleCloseDelete} />}</Fragment>
  )
}

export default StudentsDelete
