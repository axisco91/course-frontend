// ** React Imports
import { useEffect, useState, useCallback, Fragment, useContext, useRef } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import { DataGrid, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'

// ** ThirdParty Components
import { useTranslation } from 'react-i18next'

// ** Types Imports
import { WorkerType } from 'src/types/workersType'

// ** Utils Import
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { CardContent, Chip, IconButton, Tooltip } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { useDispatch } from 'react-redux'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import LoadingDialog from 'src/views/components/LoadingDialog'
import { getStudents } from 'src/api/api'
import { studentActions } from 'src/reducers/students/StudentReducer'
type SortType = 'asc' | 'desc' | undefined | null

const StudentsTable = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // ✅ refs para no meter funciones inestables en deps
  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)

  const filterButtonClickCount = useSelector((state: RootState) => state.general.filterButtonClickCount)
  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.students')
  const canEliminate = Array.isArray(userPermissions) && userPermissions.includes('eliminate.students')
  const appliedFilters = useSelector((state: RootState) => state.student.appliedFilters)

  // ✅ evita warning aria-hidden (quita foco del DataGrid antes de abrir Dialog)
  const blurActiveElement = () => {
    const el = document.activeElement as HTMLElement | null
    if (el && typeof el.blur === 'function') el.blur()
  }

  const columns = [
    {
      flex: 0.25,
      minWidth: 200,
      field: 'name',
      headerName: t('Name'),
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const { row } = params

        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600 }}>
                {row.name} {row.surname}
              </Typography>
            </Box>
          </Box>
        )
      }
    },
    {
      flex: 0.175,
      minWidth: 110,
      field: 'dni',
      headerName: t('Nif'),
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.dni}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.175,
      minWidth: 110,
      field: 'telephone',
      headerName: t('Telephone'),
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.telephone}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.175,
      minWidth: 110,
      field: 'email',
      headerName: t('Email'),
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.email}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.175,
      minWidth: 110,
      field: 'company',
      headerName: t('Company'),
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.company}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.175,
      minWidth: 110,
      field: 'status',
      headerName: t('Status'),
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      align: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const isActive = params.row.active === 1

        return (
          <Chip
            label={isActive ? t('Active') : t('Inactive')}
            color={isActive ? 'success' : 'error'}
            variant='filled'
            size='small'
            sx={{
              fontWeight: 600,
              minWidth: 80
            }}
          />
        )
      }
    },

    {
      flex: 0.125,
      field: 'actions',
      minWidth: 80,
      headerName: t('Actions'),
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          {canUpdate && (
            <Tooltip title={t('Edit')} placement='top'>
              <IconButton
                onClick={e => {
                  e.stopPropagation()
                  blurActiveElement() // ✅ clave
                  dispatch(studentActions.openStudentModal({ mode: 'edit', studentId: params.row.id }))
                }}
              >
                <Icon icon='tabler:pencil' fontSize={20} />
              </IconButton>
            </Tooltip>
          )}
          {canEliminate && (
            <Tooltip title={t('Eliminate')} placement='top'>
              <IconButton
                onClick={e => {
                  e.stopPropagation()
                  blurActiveElement()
                  dispatch(studentActions.setId(params.row.id))
                  dispatch(studentActions.setShowEliminateDialog(true))
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

  const [total, setTotal] = useState<number>(0)
  const [sort, setSort] = useState<SortType>('asc')
  const [rows, setRows] = useState<WorkerType[]>([])
  const [sortColumn, setSortColumn] = useState<string>('full_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [loading, setLoading] = useState<boolean>(false)

  const fetchTableData = useCallback(async () => {
    setLoading(true)
    try {
      const current = paginationModel.page + 1
      const sortTable = (sort ?? 'asc') === 'asc' ? sortColumn : `-${sortColumn}`

      const res = await getStudents({
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable,
        ...appliedFilters
      })

      setTotal(res.data?.data?.meta?.total ?? 0)
      setRows(res.data?.data?.students ?? res.data?.data?.data ?? [])
      console.log(res.data)
    } catch (error) {
      handleErrorRef.current(error, logoutRef.current)
    } finally {
      setLoading(false)
    }
  }, [paginationModel.page, paginationModel.pageSize, sort, sortColumn, appliedFilters])

  useEffect(() => {
    fetchTableData()
  }, [fetchTableData, filterButtonClickCount])

  const handleSortModel = (model: GridSortModel) => {
    if (!model.length) {
      setSort('asc')
      setSortColumn('name')

      return
    }

    setSort(model[0].sort ?? 'asc')
    setSortColumn(model[0].field)
  }

  return (
    <Fragment>
      <Card>
        <CardContent>
          <Box>
            <DataGrid
              onRowClick={params => {
                blurActiveElement() // ✅ clave
                dispatch(studentActions.openStudentModal({ mode: 'view', studentId: params.row.id }))
              }}
              disableColumnFilter
              pagination
              autoHeight
              rows={rows}
              rowCount={total}
              columns={columns}
              sortingMode='server'
              sortingOrder={['asc', 'desc']}
              sortModel={[{ field: sortColumn, sort: sort ?? 'asc' }]}
              paginationMode='server'
              pageSizeOptions={[25, 50, 100]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              onPaginationModelChange={setPaginationModel}
            />
          </Box>
        </CardContent>
      </Card>

      {loading && <LoadingDialog />}
    </Fragment>
  )
}

export default StudentsTable
