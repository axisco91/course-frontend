// ** React Imports
import { useEffect, useState, useCallback, Fragment, useContext } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { DataGrid, GridColDef, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'

// ** ThirdParty Components
import { useTranslation } from 'react-i18next'

// ** Types Imports
import { WorkerType } from 'src/types/workersType'

// ** Utils Import
import { fetchPermission, fetchPermissions } from 'src/api/api'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { IconButton, Tooltip } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import PermissionForm from './PermissionForm'
import { useDispatch } from 'react-redux'
import { permissionActions } from 'src/reducers/management/PermissionReducer'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import LoadingDialog from 'src/views/components/LoadingDialog'

type SortType = 'asc' | 'desc' | undefined | null

const PermissionsTable = () => {
  // Traducciones
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // ** Selectors
  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const id = useSelector((state: RootState) => state.permission.id)
  const searchValue = useSelector((state: RootState) => state.permission.searchText)
  const filterButtonClickCount = useSelector((state: RootState) => state.general.filterButtonClickCount)
  const showForm = useSelector((state: RootState) => state.general.showForm)

  // Las columnas de la tabla de los centros
  const columns: GridColDef[] = [
    {
      flex: 0.75,
      minWidth: 200,
      field: 'name',
      headerName: t('Name'),
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%'
          }}
        >
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600 }}>
            {params.row.name}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.29,
      field: 'actions',
      minWidth: 20,
      headerName: t('Actions'),
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%'
          }}
        >
          {userPermissions.includes('global.permissions.update') && (
            <Tooltip title={t('Edit')} placement='top'>
              <IconButton
                onClick={() => {
                  dispatch(permissionActions.setId(params.row.id))
                  toggleForm(params.row.id)
                }}
              >
                <Icon icon='tabler:pencil' fontSize={20} />
              </IconButton>
            </Tooltip>
          )}
          {userPermissions.includes('admin.general.delete') && (
            <Tooltip title={t('Delete')} placement='top'>
              <IconButton
                onClick={() => {
                  dispatch(permissionActions.setShowEliminateDialog(true))
                  dispatch(permissionActions.setId(params.row.id))
                }}
              >
                <Icon icon='tabler:trash' fontSize={20} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    }
  ]

  // ** States
  const [total, setTotal] = useState<number>(0)
  const [sort, setSort] = useState<SortType>('asc')
  const [rows, setRows] = useState<WorkerType[]>([])
  const [sortColumn, setSortColumn] = useState<string>('name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [title, setTitle] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  // Función para mostrar el formulario
  const toggleForm = async (permissionId: number | null) => {
    if (permissionId) {
      await fetchPermission(permissionId)
        .then(res => {
          dispatch(permissionActions.setPermission(res.data.data.permission))
          dispatch(permissionActions.setId(res.data.data.permission.id))
        })
        .catch(error => {
          handleError(error, logout)
        })
    }
    dispatch(generalActions.setShowForm(true))
  }

  const fetchTableData = useCallback(
    async (sort: SortType, q: string, column: string) => {
      setLoading(true)
      let sortTable = ''
      let current = 0

      // Vemos si es ascendente o descendente
      if (sort == 'asc') {
        sortTable = column
      } else {
        sortTable = '-' + column
      }
      current = paginationModel.page + 1

      // params para la llamada de usuarios
      const data = {
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable,
        search_text: q
      }

      // Hacemos la llamada de usuarios
      await fetchPermissions(data)
        .then(res => {
          // Guardamos los totales
          setTotal(res.data.data.meta.total)

          // Guardamos los usuarios
          setRows(res.data.data.permissions)
          setLoading(false)
        })
        .catch(error => {
          handleError(error, logout)
          setLoading(false)
        })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paginationModel]
  )

  useEffect(() => {
    // Con cada cambio se llamara el método para buscar los trabajadores
    fetchTableData(sort, searchValue, sortColumn)
  }, [fetchTableData, sort, sortColumn, filterButtonClickCount])

  const handleSortModel = (newModel: GridSortModel) => {
    if (newModel.length === 0) return
    const newSort = newModel[0].sort
    const newColumn = newModel[0].field

    setSort(newSort)
    setSortColumn(newColumn)
    fetchTableData(newModel[0].sort, searchValue, newModel[0].field)
  }

  // Proceso que realiza al cerrar el dialogo de crear o editar
  const handleCloseForm = () => {
    dispatch(permissionActions.setPermission(null))
    dispatch(permissionActions.setId(null))
    dispatch(generalActions.setShowForm(false))
    setTitle('')
    dispatch(permissionActions.setId(null))
  }

  // Proceso que realiza al guardar el dialogo de crear o editar
  const handleSaveForm = () => {
    fetchTableData(sort, searchValue, sortColumn)
    dispatch(permissionActions.setPermission(null))
    dispatch(permissionActions.setId(null))
    handleCloseForm()
  }

  return (
    <Fragment>
      <DataGrid
        disableColumnFilter
        autoHeight
        pagination
        rows={rows}
        rowCount={total}
        columns={columns}
        sortingMode='server'
        sortModel={[{ field: sortColumn, sort: sort ?? 'asc' }]}
        paginationMode='server'
        pageSizeOptions={[25, 50, 100]}
        paginationModel={paginationModel}
        onSortModelChange={handleSortModel}
        onPaginationModelChange={setPaginationModel}
      />
      {showForm && (
        <PermissionForm
          title={title}
          setId={dispatch(permissionActions.setId)}
          id={id}
          onClose={handleCloseForm}
          onSave={handleSaveForm}
        />
      )}
      {loading && <LoadingDialog />}
    </Fragment>
  )
}

export default PermissionsTable
