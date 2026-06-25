import { Fragment, useContext } from 'react'

import { deletePopulationFestival } from 'src/api/api'

import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import { toast } from 'react-hot-toast'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import DeleteElement from '../components/DeleteElement'
import { populationFestivalActions } from 'src/reducers/trainingContracts/PopulationFestivalReducer'

const PopulationFestivalsDelete = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const showEliminateDialog = useSelector((state: RootState) => (state as any).populationFestival?.showEliminateDialog)
  const id = useSelector((state: RootState) => (state as any).populationFestival?.id)

  const handleDelete = () => {
    if (!id) return

    deletePopulationFestival(id)
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
    dispatch(populationFestivalActions.setId(null))
    dispatch(populationFestivalActions.setShowEliminateDialog(false))
  }

  return <Fragment>{showEliminateDialog && <DeleteElement onDelete={handleDelete} onClose={handleCloseDelete} />}</Fragment>
}

export default PopulationFestivalsDelete
