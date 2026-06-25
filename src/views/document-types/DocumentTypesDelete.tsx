import { Fragment, useContext } from 'react'

import { deleteDocument } from 'src/api/api'

import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import { toast } from 'react-hot-toast'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import DeleteElement from '../components/DeleteElement'

import { documentActions } from 'src/reducers/general/DocumentReducer'

const DocumentTypesDelete = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const showEliminateDialog = useSelector((state: RootState) => state.document.showEliminateDialog)
  const id = useSelector((state: RootState) => state.document.id)

  const handleDelete = () => {
    if (!id) return

    deleteDocument(id)
      .then(response => {
        if (response.data?.success || response.status === 200) {
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
    dispatch(documentActions.setId(null))
    dispatch(documentActions.setShowEliminateDialog(false))
  }

  return <Fragment>{showEliminateDialog && <DeleteElement onDelete={handleDelete} onClose={handleCloseDelete} />}</Fragment>
}

export default DocumentTypesDelete
