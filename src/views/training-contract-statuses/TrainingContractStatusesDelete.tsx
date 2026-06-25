import { Fragment, useContext } from 'react'

import { deleteTrainingContractStatus } from 'src/api/api'

import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import { toast } from 'react-hot-toast'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import DeleteElement from '../components/DeleteElement'
import { trainingContractStatusActions } from 'src/reducers/trainingContracts/TrainingContractStatusReducer'

const TrainingContractStatusesDelete = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const showEliminateDialog = useSelector((state: RootState) => state.trainingContractStatus.showEliminateDialog)
  const id = useSelector((state: RootState) => state.trainingContractStatus.id)

  const handleDelete = () => {
    if (!id) return

    deleteTrainingContractStatus(id)
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
    dispatch(trainingContractStatusActions.setId(null))
    dispatch(trainingContractStatusActions.setShowEliminateDialog(false))
  }

  return <Fragment>{showEliminateDialog && <DeleteElement onDelete={handleDelete} onClose={handleCloseDelete} />}</Fragment>
}

export default TrainingContractStatusesDelete
