// TracingsTable.tsx
import { useEffect, useState, useCallback, Fragment, useContext, useMemo, useRef } from 'react'

// ** MUI
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import { DataGrid, GridRenderCellParams, GridSortModel } from 'src/views/components/DataGrid'
import { CardContent, Chip, IconButton, Tooltip } from '@mui/material'

// ** i18n
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
import { getTracings } from 'src/api/api'

// Redux
import { tracingActions } from 'src/reducers/tracings/TracingReducer'
import { studentActions } from 'src/reducers/students/StudentReducer'
import { companyActions } from 'src/reducers/company/CompanyReducer'

type SortType = 'asc' | 'desc' | undefined | null

type TracingsTableProps = {
  fixedFilters?: Record<string, string | number | null | undefined>
  useGlobalFilters?: boolean
  active?: boolean
  hideCourseColumn?: boolean
}

const EMPTY_FILTERS: Record<string, string | number | null | undefined> = {}

const yesNoChip = (value: any, t: any) => {
  const v = String(value ?? '0')
  const isYes = v === '1' || v === 'true'

  return (
    <Chip
      label={isYes ? t('Yes') : t('No')}
      color={isYes ? 'success' : 'warning'}
      variant='filled'
      size='small'
      sx={{ fontWeight: 600, minWidth: 70 }}
    />
  )
}

const formatDateDDMMYYYY = (raw: any) => {
  if (!raw) return ''
  const s = String(raw).slice(0, 10) // yyyy-mm-dd
  const [y, m, d] = s.split('-')
  if (!y || !m || !d) return s

  return `${d}/${m}/${y}`
}

const TracingsTable = ({
  fixedFilters = EMPTY_FILTERS,
  useGlobalFilters = true,
  active = true,
  hideCourseColumn = false
}: TracingsTableProps) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // refs
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
  const appliedFilters = useSelector((state: RootState) => state.tracing.appliedFilters)
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.tracings')
  const canEliminate = Array.isArray(userPermissions) && userPermissions.includes('eliminate.tracings')
  const canReadStudents = Array.isArray(userPermissions) && userPermissions.includes('read.students')
  const canReadCompanies = Array.isArray(userPermissions) && userPermissions.includes('read.companies')

  const blurActiveElement = () => {
    const el = document.activeElement as HTMLElement | null
    if (el && typeof el.blur === 'function') el.blur()
  }

  const allColumns = useMemo(
    () => [
      {
        flex: 0.28,
        minWidth: 500,
        field: 'course',
        headerName: t('Course'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const course = params.row?.course
          const trainingAction = course?.training_action ?? course?.trainingAction
          const formativeArea = trainingAction?.formative_action ?? ''
          const group = course?.group ?? ''
          const courseName = trainingAction?.name ?? course?.name ?? ''
          const actionAndGroup = [formativeArea, group].filter(Boolean).join('/')
          const courseLabel = [actionAndGroup, courseName].filter(Boolean).join(' - ')

          return (
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontWeight: 600 }}>
              {courseLabel || params.row?.course_label || params.row?.course_name || course || ''}
            </Typography>
          )
        }
      },
      {
        flex: 0.24,
        minWidth: 450,
        field: 'company',
        headerName: t('Company'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const companyId = params.row?.company_id ?? params.row?.company?.id ?? null

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <Typography noWrap variant='body2' sx={{ minWidth: 0, flex: 1 }}>
                {params.row?.company_name ?? params.row?.company?.name ?? params.row?.company ?? ''}
              </Typography>
              {canReadCompanies && companyId ? (
                <Tooltip title={t('View company')} placement='top'>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation()
                      blurActiveElement()
                      dispatch(companyActions.setId(Number(companyId)))
                      dispatch(companyActions.openModal({ mode: 'view', companyId: Number(companyId) }))
                    }}
                  >
                    <Icon icon='tabler:eye' fontSize={18} />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Box>
          )
        }
      },
      // Student column is optional, because in some cases it is already includded
      {
        flex: 0.18,
        minWidth: 350,
        field: 'student',
        headerName: t('Student'),
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams) => {
          const s = params.row?.student
          const studentId = params.row?.student_id ?? s?.id ?? null
          const label =
            params.row?.student_name ??
            (s ? `${s?.name ?? ''} ${s?.surname ?? s?.last_name ?? ''}`.trim() : params.row?.student ?? '')

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <Typography noWrap variant='body2' sx={{ minWidth: 0, flex: 1 }}>
                {label}
              </Typography>
              {canReadStudents && studentId ? (
                <Tooltip title={t('View student')} placement='top'>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation()
                      blurActiveElement()
                      dispatch(studentActions.setId(Number(studentId)))
                      dispatch(studentActions.openStudentModal({ mode: 'view', studentId: Number(studentId) }))
                    }}
                  >
                    <Icon icon='tabler:eye' fontSize={18} />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Box>
          )
        }
      },
      {
        flex: 0.12,
        minWidth: 150,
        field: 'status',
        headerName: t('Status'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{params.row?.course.course_status.name ?? ''}</Typography>
        )
      },
      {
        flex: 0.16,
        minWidth: 220,
        field: 'performed_hours',
        headerName: t('Performed hours'),
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>
            {`${params.row?.performed_hours ?? 0} / ${params.row?.total_hours ?? 0}`}
          </Typography>
        )
      },
      {
        flex: 0.18,
        minWidth: 250,
        field: 'performed_activities',
        headerName: t('Performed activities'),
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>
            {`${params.row?.performed_activities ?? 0} / ${
              params.row?.number_activities ?? params.row?.total_activities ?? 0
            }`}
          </Typography>
        )
      },
      {
        flex: 0.17,
        minWidth: 230,
        field: 'performed_units',
        headerName: t('Performed units'),
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>
            {`${params.row?.performed_units ?? 0} / ${params.row?.number_units ?? params.row?.total_units ?? 0}`}
          </Typography>
        )
      },
      {
        flex: 0.15,
        minWidth: 220,
        field: 'follow_up_date',
        headerName: t('Follow-up date'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{formatDateDDMMYYYY(params.row?.follow_up_date)}</Typography>
        )
      },
      {
        flex: 0.12,
        minWidth: 150,
        field: 'final_test',
        headerName: t('Final test'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{params.row?.final_test ?? ''}</Typography>
        )
      },
      {
        flex: 0.14,
        minWidth: 170,
        field: 'questionnaire',
        headerName: t('Questionnaire'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant='body2'>{params.row?.questionnaire ?? ''}</Typography>
        )
      },
      {
        flex: 0.12,
        minWidth: 150,
        field: 'welcome_message',
        headerName: t('Welcome'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => yesNoChip(params.row?.welcome_message, t)
      },
      {
        flex: 0.13,
        minWidth: 160,
        field: 'quarter_message',
        headerName: t('Message 25%'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => yesNoChip(params.row?.quarter_message, t)
      },
      {
        flex: 0.13,
        minWidth: 160,
        field: 'half_message',
        headerName: t('Message 50%'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => yesNoChip(params.row?.half_message, t)
      },
      {
        flex: 0.13,
        minWidth: 160,
        field: 'three_quarters_message',
        headerName: t('Message 75%'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => yesNoChip(params.row?.three_quarters_message, t)
      },
      {
        flex: 0.13,
        minWidth: 160,
        field: 'final_message',
        headerName: t('Finalization'),
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => yesNoChip(params.row?.final_message, t)
      },
      {
        flex: 0.12,
        minWidth: 100,
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
                      dispatch(tracingActions.setId(Number(id)))
                      dispatch(tracingActions.openModal({ mode: 'edit' }))
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
                      dispatch(tracingActions.setId(Number(id)))
                      dispatch(tracingActions.setShowEliminateDialog(true))
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
    [t, canUpdate, canEliminate, canReadStudents, canReadCompanies, dispatch]
  )

  const columns = useMemo(
    () => (hideCourseColumn ? allColumns.filter(column => column.field !== 'course') : allColumns),
    [allColumns, hideCourseColumn]
  )

  const [total, setTotal] = useState<number>(0)
  const [sort, setSort] = useState<SortType>('asc')
  const [rows, setRows] = useState<any[]>([])
  const [sortColumn, setSortColumn] = useState<string>('course')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState<boolean>(false)
  const requestIdRef = useRef(0)

  const requestFilters = useMemo(
    () => ({ ...(useGlobalFilters ? appliedFilters : {}), ...fixedFilters }),
    [appliedFilters, fixedFilters, useGlobalFilters]
  )

  const fetchTableData = useCallback(async () => {
    if (!active) return
    const requestId = ++requestIdRef.current
    setLoading(true)
    try {
      const current = paginationModel.page + 1
      const sortTable = (sort ?? 'asc') === 'asc' ? sortColumn : `-${sortColumn}`

      const res = await getTracings({
        perPage: paginationModel.pageSize,
        page: current,
        sort: sortTable,
        ...requestFilters
      })

      if (requestId === requestIdRef.current) {
        setTotal(res.data?.data?.meta?.total ?? 0)
        setRows(res.data?.data?.tracings ?? res.data?.data?.data ?? [])
      }
    } catch (error) {
      if (requestId === requestIdRef.current) handleErrorRef.current(error, logoutRef.current)
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [active, paginationModel.page, paginationModel.pageSize, sort, sortColumn, requestFilters])

  useEffect(() => {
    setPaginationModel(previous => (previous.page === 0 ? previous : { ...previous, page: 0 }))
  }, [requestFilters])

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
                const id = (params.row as any)?.id ?? (params.row as any)?.value ?? params.id
                dispatch(tracingActions.setId(Number(id)))
                dispatch(tracingActions.openModal({ mode: 'edit' }))
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
              pageSizeOptions={[10, 25, 50, 100]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              onPaginationModelChange={setPaginationModel}
              loading={loading}
            />
          </Box>
        </CardContent>
      </Card>

      {loading && <LoadingDialog />}
    </Fragment>
  )
}

export default TracingsTable
