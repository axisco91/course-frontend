// AdvisorsDelete.tsx
import { Fragment, useContext } from 'react'

// ✅ API (cambia el nombre si tu endpoint se llama distinto)
import { deleteAdvisor } from 'src/api/api'

// ✅ Redux
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// ✅ UI / Utils
import { toast } from 'react-hot-toast'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import DeleteElement from '../components/DeleteElement'
import { advisorActions } from 'src/reducers/advisors/AdvisorReducer'

const AdvisorsDelete = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // ✅ global delete dialog
  const showEliminateDialog = useSelector((state: RootState) => state.advisor.showEliminateDialog)

  // ✅ advisor id (from advisor slice)
  const id = useSelector((state: RootState) => state.advisor.id)

  const handleDelete = () => {
    if (!id) return

    deleteAdvisor(id)
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
    dispatch(advisorActions.setId(null))
    dispatch(advisorActions.setShowEliminateDialog(false))
  }

  return (
    <Fragment>{showEliminateDialog && <DeleteElement onDelete={handleDelete} onClose={handleCloseDelete} />}</Fragment>
  )
}

export default AdvisorsDelete
