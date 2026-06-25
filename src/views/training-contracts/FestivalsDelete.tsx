import { Fragment, useContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { RootState } from 'src/reducers/types/types'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import DeleteElement from '../components/DeleteElement'
import { generalActions } from 'src/reducers/general/GeneralReducer'

// API
import { deleteTrainingContractFestival } from 'src/api/api'
import { festivalActions } from 'src/reducers/trainingContracts/FestivalReducer'

// reducer

const FestivalDelete = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const showEliminateDialog = useSelector((s: RootState) => (s as any).festival?.showEliminateDialog)
  const id = useSelector((s: RootState) => (s as any).festival?.id)

  const handleClose = () => {
    dispatch(festivalActions.setId(null))
    dispatch(festivalActions.setShowEliminateDialog(false))
  }

  const handleDelete = () => {
    if (!id) return

    deleteTrainingContractFestival(id)
      .then(res => {
        if (res.data?.success) {
          toast.success(res.data?.message ?? 'Deleted')
          dispatch(generalActions.addFilterButtonClickCount()) // ✅ refresca tabla
          handleClose()
        } else {
          toast.error(res.data?.message ?? 'Error')
        }
      })
      .catch(err => {
        handleClose()
        handleError(err, logout)
      })
  }

  return <Fragment>{showEliminateDialog && <DeleteElement onDelete={handleDelete} onClose={handleClose} />}</Fragment>
}

export default FestivalDelete
