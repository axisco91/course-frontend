// ** React Imports
import { useEffect, useState, useCallback, Fragment } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { DataGrid, GridColDef, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'

// ** ThirdParty Components
import { useTranslation } from 'react-i18next'

// ** Utils Import
import { fetchErrorLogs } from 'src/api/api'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useDispatch } from 'react-redux'
import { departmentActions } from 'src/reducers/DepartmentReducer'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import LoadingDialog from '../components/LoadingDialog'

type SortType = 'asc' | 'desc' | undefined | null

const ErrorLogs = () => {
  // Traducciones
  const { t } = useTranslation()
  const dispatch = useDispatch()

  // ** Selectors
  // Obtenemos el id de la empresa activa
  const activeCompanyId = useSelector((state: RootState) => state.activeCompany.id)
  const searchValue = useSelector((state: RootState) => state.department.searchText)
  const filterButtonClickCount = useSelector((state: RootState) => state.general.filterButtonClickCount)
  const id = useSelector((state: RootState) => state.department.id)
  const showForm = useSelector((state: RootState) => state.general.showForm)

  // Las columnas de la tabla de trabajadores
  const columns: GridColDef[] = [
    {
      flex: 1,
      minWidth: 200,
      field: 'request',
      headerName: t('Request'),
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const { row } = params

        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            }}
          >
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600, alignItems: 'center' }}>
              {row.request_method} {row.request_url}
            </Typography>
          </Box>
        )
      }
    },
    {
      flex: 1,
      minWidth: 200,
      field: 'username',
      headerName: t('Username'),
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const { row } = params

        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            }}
          >
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600, alignItems: 'center' }}>
              {row.username}
            </Typography>
          </Box>
        )
      }
    },
    {
      flex: 1,
      minWidth: 200,
      field: 'message',
      headerName: t('Message'),
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const { row } = params

        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            }}
          >
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600, alignItems: 'center' }}>
              {row.message}
            </Typography>
          </Box>
        )
      }
    },
    {
      flex: 1,
      minWidth: 200,
      field: 'date',
      headerName: t('Date'),
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const { row } = params

        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            }}
          >
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600, alignItems: 'center' }}>
              {row.date}
            </Typography>
          </Box>
        )
      }
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

      // params para la llamada de departamentos
      const data = {
        company_id: activeCompanyId,
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable,
        search_text: q
      }

      // Hacemos la llamada de departamentos
      await fetchErrorLogs(data)
        .then(res => {
          // Guardamos los totales
          setTotal(res.data.data.meta.total)

          // Guardamos los departamentos
          setRows(res.data.data.error_logs)
          setLoading(false)
        })
        .catch()
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

export default ErrorLogs
