// ** React Imports
import { useEffect, useState, useCallback, Fragment } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
import { DataGrid, GridColDef, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'

// ** ThirdParty Components
import { useTranslation } from 'react-i18next'
import format from 'date-fns/format'

// ** Types Imports
import { WorkerType } from 'src/types/workersType'

// ** Utils Import
import { fetchAccessLogs } from 'src/api/api'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { Box, Button, CardContent, Grid, Typography } from '@mui/material'
import SearchBar from '../components/SearchBar'

// ** Icon Imports
import Filter from '../components/Filter'

type SortType = 'asc' | 'desc' | undefined | null

const AccessLogsTable = () => {
  // Traducciones
  const { t } = useTranslation()

  // ** Selectors
  // Obtenemos el id de la empresa activa
  const activeCompanyId = useSelector((state: RootState) => state.activeCompany.id)
  let columns: GridColDef[]

  // Las columnas de la tabla de log de accesos
  columns = [
    {
      flex: 0.75,
      minWidth: 200,
      field: 'name',
      headerName: t('Name'),
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
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.user_name}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.75,
      minWidth: 110,
      field: 'surname1',
      headerName: t('Surname'),
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
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.user_surname1}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.75,
      minWidth: 110,
      field: 'surname2',
      headerName: t('Second Surname'),
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
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.user_surname2}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.75,
      minWidth: 110,
      field: 'user',
      headerName: t('User'),
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
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.user}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.75,
      minWidth: 110,
      field: 'company_name',
      headerName: t('Company Name'),
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
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.company_name}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.75,
      minWidth: 110,
      field: 'ip',
      headerName: t('Ip'),
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
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.ip}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.175,
      minWidth: 110,
      field: 'date',
      headerName: t('Date'),
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
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.date ? format(new Date(params.row.date), 'dd/MM/yyyy') : ''}
          </Typography>
        </Box>
      )
    }
  ]

  // ** States
  const [total, setTotal] = useState<number>(0)
  const [sort, setSort] = useState<SortType>('asc')
  const [rows, setRows] = useState<WorkerType[]>([])
  const [searchValue, setSearchValue] = useState<string>('')
  const [sortColumn, setSortColumn] = useState<string>('date')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [filterButtonClickCount, setFilterButtonClickCount] = useState(0)

  const fetchTableData = useCallback(
    async (sort: SortType, q: string, column: string) => {
      let sortTable = ''
      let current = 0

      // Vemos si es ascendente o descendente
      if (sort == 'asc') {
        sortTable = column
      } else {
        sortTable = '-' + column
      }
      current = paginationModel.page + 1

      // params para la llamda de logs
      const data = {
        company_id: activeCompanyId,
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable,
        search_text: q
      }

      // Hacemos la llamada de logs
      await fetchAccessLogs(data)
        .then(res => {
          // Guardamos los totales
          setTotal(res.data.data.meta.total)

          // Guardamos los logs
          setRows(res.data.data.access_logs)
        })
        .catch()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paginationModel]
  )

  useEffect(() => {
    // Con cada cambio se llamara el metodo para buscar los logs
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
      <Card>
        <CardContent>
          <Grid
            item
            xs={12}
            sm={12}
            sx={{
              textAlign: 'right',
              color: 'primary.main'
            }}
          ></Grid>
        </CardContent>
        <CardContent>
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
        </CardContent>
      </Card>
    </Fragment>
  )
}

export default AccessLogsTable
