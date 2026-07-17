import { Fragment, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  Tooltip
} from '@mui/material'
import TableSortLabel from '@mui/material/TableSortLabel'

import Icon from 'src/@core/components/icon'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { RootState } from 'src/reducers/types/types'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import LoadingDialog from 'src/views/components/LoadingDialog'
import { getProfits } from 'src/api/api'

import { profitActions } from 'src/reducers/profits/ProfitReducer'

/* ===================== helpers ===================== */

type SortType = 'asc' | 'desc'

const money = (v: any) => {
  const n = Number(v ?? 0)
  if (Number.isNaN(n)) return '0.00'

  return n.toFixed(2)
}

/* ===================== detail panel ===================== */

const DetailPanel = ({ row, t }: { row: any; t: (k: string) => string }) => {
  const gridCols = '220px 120px 120px 120px 120px 140px 140px 180px 180px 120px 120px'
  const student = `${row?.student_name ?? ''} ${row?.student_surname ?? ''}`.trim()

  return (
    <Box sx={{ overflowX: 'auto', px: 4, py: 2, bgcolor: 'background.default' }}>
      <Box sx={{ minWidth: 1400 }}>
        {/* header */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: gridCols,
            py: 1,
            borderBottom: theme => `1px solid ${theme.palette.divider}`
          }}
        >
          {[
            'Student',
            'Price',
            'License',
            'Teacher',
            'Management',
            'Nebrija title',
            'Discount',
            'Collaborator commission',
            'Advisor commission',
            'Total',
            'Benefit'
          ].map(h => (
            <Typography key={h} variant='subtitle2' align='center'>
              {t(h)}
            </Typography>
          ))}
        </Box>

        {/* single row */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: gridCols,
            py: 1,
            borderBottom: theme => `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography variant='body2'>{student}</Typography>
          <Typography align='center'>{money(row?.price)}</Typography>
          <Typography align='center'>{money(row?.license)}</Typography>
          <Typography align='center'>{money(row?.teacher)}</Typography>
          <Typography align='center'>{money(row?.management)}</Typography>
          <Typography align='center'>{money(row?.nebrija_title)}</Typography>
          <Typography align='center'>{money(row?.discount)}</Typography>
          <Typography align='center'>{money(row?.collaborator_commission)}</Typography>
          <Typography align='center'>{money(row?.advisor_commission)}</Typography>
          <Typography align='center'>{money(row?.total)}</Typography>
          <Typography align='center'>{money(row?.benefits)}</Typography>
        </Box>
      </Box>
    </Box>
  )
}

/* ===================== main table ===================== */

const ProfitsTable = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)

  useEffect(() => {
    handleErrorRef.current = handleError
    logoutRef.current = logout
  }, [handleError, logout])

  const filterButtonClickCount = useSelector((state: RootState) => state.general.filterButtonClickCount)
  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const appliedFilters = useSelector((state: any) => state.profit.appliedFilters)

  const canUpdate = userPermissions?.includes('edit.courses')
  const canEliminate = userPermissions?.includes('eliminate.courses')

  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const [expanded, setExpanded] = useState<Set<number | string>>(new Set())

  const [sortColumn, setSortColumn] = useState('course')
  const [sort, setSort] = useState<SortType>('asc')

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  /* ===================== data ===================== */

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getProfits({
        page: page + 1,
        perPage: pageSize,
        sort: sort === 'asc' ? sortColumn : `-${sortColumn}`,
        ...appliedFilters
      })

      setRows(res.data?.data?.profits ?? [])
      setTotal(res.data?.data?.meta?.total ?? 0)
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sort, sortColumn, appliedFilters])

  useEffect(() => {
    fetchData()
  }, [fetchData, filterButtonClickCount])

  /* ===================== ui ===================== */

  const toggleSort = (field: string) => {
    if (sortColumn === field) {
      setSort(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(field)
      setSort('asc')
    }
  }

  return (
    <Fragment>
      <Card>
        <CardContent>
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell width={60} />

                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'course'}
                      direction={sort}
                      onClick={() => toggleSort('course')}
                    >
                      {t('Course')}
                    </TableSortLabel>
                  </TableCell>

                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'company'}
                      direction={sort}
                      onClick={() => toggleSort('company')}
                    >
                      {t('Company')}
                    </TableSortLabel>
                  </TableCell>

                  <TableCell align='center'>
                    <TableSortLabel active={sortColumn === 'year'} direction={sort} onClick={() => toggleSort('year')}>
                      {t('Year')}
                    </TableSortLabel>
                  </TableCell>

                  <TableCell align='center'>{t('Actions')}</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map(row => {
                  const id = row.id ?? row.value
                  const open = expanded.has(id)

                  return (
                    <Fragment key={id}>
                      <TableRow hover>
                        <TableCell>
                          <IconButton
                            size='small'
                            onClick={() =>
                              setExpanded(prev => {
                                const next = new Set(prev)
                                open ? next.delete(id) : next.add(id)

                                return next
                              })
                            }
                          >
                            <Icon icon={open ? 'tabler:chevron-down' : 'tabler:chevron-right'} />
                          </IconButton>
                        </TableCell>

                        <TableCell>
                          <Typography fontWeight={600}>{row.course_label ?? row.course ?? ''}</Typography>
                        </TableCell>

                        <TableCell>{row.company_name ?? row.company ?? ''}</TableCell>

                        <TableCell align='center'>{row.year ?? ''}</TableCell>

                        <TableCell align='center'>
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            {canUpdate && (
                              <Tooltip title={t('Edit')}>
                                <IconButton
                                  size='small'
                                  onClick={() => {
                                    dispatch(profitActions.setId(Number(id)))
                                    dispatch(profitActions.openModal({ mode: 'edit' }))
                                  }}
                                >
                                  <Icon icon='tabler:pencil' />
                                </IconButton>
                              </Tooltip>
                            )}

                            {canEliminate && (
                              <Tooltip title={t('Eliminate')}>
                                <IconButton
                                  size='small'
                                  onClick={() => {
                                    dispatch(profitActions.setId(Number(id)))
                                    dispatch(profitActions.setShowEliminateDialog(true))
                                  }}
                                >
                                  <Icon icon='tabler:trash' />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>

                      {/* detail */}
                      <TableRow>
                        <TableCell colSpan={5} sx={{ p: 0 }}>
                          <Collapse in={open} timeout='auto' unmountOnExit>
                            <DetailPanel row={row} t={t} />
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component='div'
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={e => {
              setPageSize(Number(e.target.value))
              setPage(0)
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </CardContent>
      </Card>

      {loading && <LoadingDialog />}
    </Fragment>
  )
}

export default ProfitsTable
