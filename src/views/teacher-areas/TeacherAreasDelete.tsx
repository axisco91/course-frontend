// TracingsDelete.tsx

// ** React Imports
import { Fragment, useContext } from 'react'

// ** API
import { deleteTeacherArea } from 'src/api/api'

// ** Redux
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// ** UI / Utils
import { toast } from 'react-hot-toast'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import DeleteElement from '../components/DeleteElement'

// ** Reducer
import { teacherAreaActions } from 'src/reducers/teachers/TeacherAreaReducer'

const TeacherAreasDelete = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const showEliminateDialog = useSelector((state: RootState) => state.teacherArea.showEliminateDialog)
  const id = useSelector((state: RootState) => state.teacherArea.id)

  const handleDelete = () => {
    if (!id) return

    deleteTeacherArea(id)
      .then(response => {
        if (response.data?.success) {
          dispatch(generalActions.addFilterButtonClickCount())
          toast.success(response.data?.message ?? 'Deleted')
          handleCloseDelete()
        }
      })
      .catch(error => {
        handleCloseDelete()
        handleError(error, logout)
      })
  }

  const handleCloseDelete = () => {
    dispatch(teacherAreaActions.setId(null))
    dispatch(teacherAreaActions.setShowEliminateDialog(false))
  }

  return (
    <Fragment>{showEliminateDialog && <DeleteElement onDelete={handleDelete} onClose={handleCloseDelete} />}</Fragment>
  )
}

export default TeacherAreasDelete
