// ** React Imports
import { useEffect, useState, useCallback, Fragment, useContext, useMemo, useRef } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import { DataGrid, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'
import { CardContent, Chip, IconButton, Tooltip } from '@mui/material'

// ** ThirdParty
import { useTranslation } from 'react-i18next'

// ** Redux
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// ** Icon
import Icon from 'src/@core/components/icon'

// ** Utils
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import LoadingDialog from 'src/views/components/LoadingDialog'

// API
import { getCourses } from 'src/api/api'

// Redux
import { courseActions } from 'src/reducers/courses/CourseReducer'

type SortType = 'asc' | 'desc' | undefined | null

const CoursesTable = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // ✅ refs para no meter funciones inestables en deps
  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)

  useEffect(() => {
    handleErrorRef.current = handleError
  }, [handleError])

  useEffect(() => {
    logoutRef.current = logout
  }, [logout])

  const filterButtonClickCount = useSelector((state: RootState) => state.general.filterButtonClickCount)
  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const appliedFilters = useSelector((state: RootState) => state.course.appliedFilters)
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.courses')
  const canEliminate = Array.isArray(userPermissions) && userPermissions.includes('eliminate.courses')

  const blurActiveElement = () => {
    const el = document.activeElement as HTMLElement | null
    if (el && typeof el.blur === 'function') el.blur()
  }

  const columns = useMemo(
    () => [
      {
        flex: 0.22,
        minWidth: 420,
        field: 'name',
        headerName: t('Name'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600 }}>
            {params.row?.display_name ?? params.row?.course_display_name ?? params.row?.label ?? params.row?.name ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.14,
        minWidth: 140,
        field: 'type',
        headerName: t('Type'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>
            {params.row?.course_type_name ?? params.row?.course_type?.name ?? params.row?.type ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.18,
        minWidth: 180,
        field: 'teacher',
        headerName: t('Teacher'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2' noWrap>
            {params.row?.teacher_name ??
              (params.row?.teacher
                ? `${params.row.teacher.name ?? ''} ${params.row.teacher.surname ?? ''}`.trim()
                : '')}
          </Typography>
        )
      },
      {
        flex: 0.14,
        minWidth: 140,
        field: 'beginning',
        headerName: t('Start date'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{params.row?.beginning ?? params.row?.start_date ?? ''}</Typography>
        )
      },
      {
        flex: 0.14,
        minWidth: 140,
        field: 'end',
        headerName: t('End date'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{params.row?.end ?? params.row?.end_date ?? ''}</Typography>
        )
      },
      {
        flex: 0.14,
        minWidth: 160,
        field: 'registrations_count',
        headerName: t('Registrations'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{params.row?.registrations_count ?? 0}</Typography>
        )
      },
      {
        flex: 0.14,
        minWidth: 150,
        field: 'status',
        headerName: t('Status'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const statusVal = Number(params.row?.course_status ?? params.row?.status ?? 0)
          const isImplanted = statusVal === 1

          return (
            <Chip
              label={isImplanted ? t('Implanted') : t('Pending')}
              color={isImplanted ? 'success' : 'warning'}
              variant='filled'
              size='small'
              sx={{ fontWeight: 600, minWidth: 95 }}
            />
          )
        }
      },
      {
        flex: 0.12,
        minWidth: 90,
        field: 'actions',
        headerName: t('Actions'),
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => {
          const id = params.row?.id ?? params.row?.value

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: 1 }}>
              {canUpdate && (
                <Tooltip title={t('Edit')} placement='top'>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation()
                      blurActiveElement()
                      dispatch(courseActions.setId(Number(id)))
                      dispatch(courseActions.openModal({ mode: 'edit' }))
                    }}
                  >
                    <Icon icon='tabler:pencil' fontSize={20} />
                  </IconButton>
                </Tooltip>
              )}

              {canEliminate && (
                <Tooltip title={t('Eliminate')} placement='top'>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation()
                      blurActiveElement()
                      dispatch(courseActions.setId(Number(id)))
                      dispatch(courseActions.setShowEliminateDialog(true))
                    }}
                  >
                    <Icon icon='tabler:trash' fontSize={20} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )
        }
      }
    ],
    [t, canUpdate, canEliminate, dispatch]
  )

  const [total, setTotal] = useState<number>(0)
  const [sort, setSort] = useState<SortType>('desc')
  const [rows, setRows] = useState<any[]>([])
  const [sortColumn, setSortColumn] = useState<string>('beginning')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 })
  const [loading, setLoading] = useState<boolean>(false)

  const fetchTableData = useCallback(async () => {
    setLoading(true)
    try {
      const current = paginationModel.page + 1
      const sortTable = (sort ?? 'asc') === 'asc' ? sortColumn : `-${sortColumn}`

      const res = await getCourses({
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable,
        ...appliedFilters
      })

      setTotal(res.data?.data?.meta?.total ?? 0)
      setRows(res.data?.data?.courses ?? res.data?.data?.data ?? [])
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
      setSort('desc')
      setSortColumn('beginning')

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
                const id = (params.row as any)?.id ?? (params.row as any)?.value ?? params.id
                dispatch(courseActions.setId(Number(id)))
                dispatch(courseActions.openModal({ mode: 'view' }))
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
              loading={loading}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Si quieres, puedes quitar esto y dejar solo loading del DataGrid */}
      {loading && <LoadingDialog />}
    </Fragment>
  )
}

export default CoursesTable
