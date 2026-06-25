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
import { getTeachers } from 'src/api/api'
import { teacherActions } from 'src/reducers/teachers/TeacherReducer'

type SortType = 'asc' | 'desc' | undefined | null

const TeachersTable = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // ✅ refs para no meter funciones inestables en deps
  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)

  const filterButtonClickCount = useSelector((state: RootState) => state.general.filterButtonClickCount)
  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const canView = Array.isArray(userPermissions) && userPermissions.includes('read.teachers')
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.teachers')
  const canEliminate = Array.isArray(userPermissions) && userPermissions.includes('eliminate.teachers')
  const appliedFilters = useSelector((state: RootState) => state.teacher.appliedFilters)

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
          {canView && (
            <Tooltip title={t('View')} placement='top'>
              <span>
                <IconButton
                  onClick={e => {
                    e.stopPropagation()
                    blurActiveElement()

                    const id = params.row.id ?? params.row.value
                    dispatch(teacherActions.setId(id))
                    dispatch(teacherActions.openModal({ mode: 'view' }))
                  }}
                  size='small'
                >
                  <Icon icon='tabler:eye' fontSize={20} />
                </IconButton>
              </span>
            </Tooltip>
          )}

          {canUpdate && (
            <Tooltip title={t('Edit')} placement='top'>
              <span>
                <IconButton
                  onClick={e => {
                    e.stopPropagation()
                    blurActiveElement()

                    const id = params.row.id ?? params.row.value
                    dispatch(teacherActions.setId(id))
                    dispatch(teacherActions.openModal({ mode: 'edit' }))
                  }}
                  size='small'
                >
                  <Icon icon='tabler:pencil' fontSize={20} />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {canEliminate && (
            <Tooltip title={t('Eliminate')} placement='top'>
              <IconButton
                onClick={e => {
                  e.stopPropagation()
                  blurActiveElement()
                  dispatch(teacherActions.setId(params.row.id))
                  dispatch(teacherActions.setShowEliminateDialog(true))
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

      const res = await getTeachers({
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable,
        ...appliedFilters
      })

      setTotal(res.data?.data?.meta?.total ?? 0)
      setRows(res.data?.data?.teachers ?? res.data?.data?.data ?? [])
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
              disableRowSelectionOnClick
              getRowId={row => row.id ?? row.value}
              onRowClick={params => {
                blurActiveElement()

                const id = (params.row as any).id ?? (params.row as any).value ?? params.id
                dispatch(teacherActions.setId(Number(id)))
                dispatch(teacherActions.openModal({ mode: 'view' }))
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

export default TeachersTable
