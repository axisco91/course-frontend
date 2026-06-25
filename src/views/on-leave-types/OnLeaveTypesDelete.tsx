// TracingsDelete.tsx

// ** React Imports
import { Fragment, useContext } from 'react'

// ** API
import { deleteOnLeaveType } from 'src/api/api'

// ** Redux
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// ** UI / Utils
import { toast } from 'react-hot-toast'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import DeleteElement from '../components/DeleteElement'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { onLeaveActions } from 'src/reducers/trainingContracts/OnLeaveReducer'

// ** Reducer

const OnLeaveTypesDelete = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const showEliminateDialog = useSelector((state: RootState) => state.onLeave.showEliminateDialog)
  const id = useSelector((state: RootState) => state.onLeave.id)

  const handleDelete = () => {
    if (!id) return

    deleteOnLeaveType(id)
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
    dispatch(onLeaveActions.setId(null))
    dispatch(onLeaveActions.setShowEliminateDialog(false))
  }

  return (
    <Fragment>{showEliminateDialog && <DeleteElement onDelete={handleDelete} onClose={handleCloseDelete} />}</Fragment>
  )
}

export default OnLeaveTypesDelete
