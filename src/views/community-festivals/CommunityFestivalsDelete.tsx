import { Fragment, useContext } from 'react'

import { deleteCommunityFestival } from 'src/api/api'

import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import { toast } from 'react-hot-toast'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import DeleteElement from '../components/DeleteElement'
import { communityFestivalActions } from 'src/reducers/trainingContracts/CommunityFestivalReducer'

const CommunityFestivalsDelete = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const showEliminateDialog = useSelector((state: RootState) => (state as any).communityFestival?.showEliminateDialog)
  const id = useSelector((state: RootState) => (state as any).communityFestival?.id)

  const handleDelete = () => {
    if (!id) return

    deleteCommunityFestival(id)
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
    dispatch(communityFestivalActions.setId(null))
    dispatch(communityFestivalActions.setShowEliminateDialog(false))
  }

  return <Fragment>{showEliminateDialog && <DeleteElement onDelete={handleDelete} onClose={handleCloseDelete} />}</Fragment>
}

export default CommunityFestivalsDelete
