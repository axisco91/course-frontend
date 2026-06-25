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
import { fetchAllRoles } from 'src/api/api'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { IconButton, Tooltip } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { useRouter } from 'next/router'
import { useDispatch } from 'react-redux'
import { roleActions } from 'src/reducers/management/RoleReducer'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import LoadingDialog from 'src/views/components/LoadingDialog'

type SortType = 'asc' | 'desc' | undefined | null

const RolesTable = () => {
  // Traducciones
  const { t } = useTranslation()
  const router = useRouter()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // ** Selectors
  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const searchValue = useSelector((state: RootState) => state.role.searchText)
  const filterButtonClickCount = useSelector((state: RootState) => state.general.filterButtonClickCount)

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
          {userPermissions.includes('global.roles.update') && (
            <Tooltip title={t('Edit')} placement='top'>
              <IconButton onClick={() => router.push(`/general-settings/roles/edit/${params.row.id}`)}>
                <Icon icon='tabler:pencil' fontSize={20} />
              </IconButton>
            </Tooltip>
          )}
          {userPermissions.includes('global.roles.delete') && (
            <Tooltip title={t('Delete')} placement='top'>
              <IconButton
                onClick={() => {
                  dispatch(roleActions.setShowEliminateDialog(true))
                  dispatch(roleActions.setId(params.row.id))
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
  const [loading, setLoading] = useState<boolean>(false)

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

      // params para la llamada de roles
      const data = {
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable,
        search_text: q
      }

      // Hacemos la llamada de roles
      await fetchAllRoles(data)
        .then(res => {
          // Guardamos los totales
          setTotal(res.data.data.meta.total)

          // Guardamos los roles
          setRows(res.data.data.roles)
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
      {loading && <LoadingDialog />}
    </Fragment>
  )
}

export default RolesTable
