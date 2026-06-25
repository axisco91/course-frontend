import { useEffect, useRef, type MouseEvent } from 'react'
import Pagination from '@mui/material/Pagination'
import {
  GridPagination,
  gridFilteredTopLevelRowCountSelector,
  gridPaginationModelSelector,
  useGridApiContext,
  useGridRootProps,
  useGridSelector
} from '@mui/x-data-grid'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

type DataGridPaginationActionsProps = {
  count: number
  page: number
  rowsPerPage: number
  onPageChange: (event: MouseEvent<HTMLButtonElement> | null, page: number) => void
}

const DataGridPaginationActions = ({ count, page, rowsPerPage, onPageChange }: DataGridPaginationActionsProps) => {
  const pageCount = count > 0 && rowsPerPage > 0 ? Math.ceil(count / rowsPerPage) : 0
  const currentPage = pageCount > 0 ? Math.min(page, pageCount - 1) : 0

  if (pageCount <= 1) return null

  return (
    <Pagination
      color='primary'
      count={pageCount}
      page={currentPage + 1}
      shape='rounded'
      size='small'
      showFirstButton
      showLastButton
      siblingCount={1}
      boundaryCount={1}
      onChange={(_, value) => onPageChange(null, value - 1)}
      sx={{
        '& .MuiPagination-ul': {
          justifyContent: 'center'
        }
      }}
    />
  )
}

const DataGridPagination = () => {
  const { t } = useTranslation()
  const apiRef = useGridApiContext()
  const rootProps = useGridRootProps()
  const filterButtonClickCount = useSelector((state: any) => state.general?.filterButtonClickCount ?? 0)
  const previousFilterButtonClickCount = useRef(filterButtonClickCount)
  const paginationModel = useGridSelector(apiRef, gridPaginationModelSelector)
  const visibleTopLevelRowCount = useGridSelector(apiRef, gridFilteredTopLevelRowCountSelector)
  const rowCount = rootProps.rowCount ?? visibleTopLevelRowCount ?? 0
  const pageCount = rowCount > 0 && paginationModel.pageSize > 0 ? Math.ceil(rowCount / paginationModel.pageSize) : 0

  useEffect(() => {
    if (previousFilterButtonClickCount.current === filterButtonClickCount) return

    previousFilterButtonClickCount.current = filterButtonClickCount

    if (paginationModel.page > 0) {
      apiRef.current.setPage(0)
    }
  }, [apiRef, filterButtonClickCount, paginationModel.page])

  useEffect(() => {
    if (pageCount === 0 && paginationModel.page > 0) {
      apiRef.current.setPage(0)

      return
    }

    if (pageCount > 0 && paginationModel.page > pageCount - 1) {
      apiRef.current.setPage(pageCount - 1)
    }
  }, [apiRef, pageCount, paginationModel.page])

  return (
    <GridPagination
      ActionsComponent={DataGridPaginationActions}
      labelRowsPerPage={`${t('Rows per page')}:`}
      labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${t('of')} ${count === -1 ? `${to}+` : count}`}
      sx={{
        '& .MuiTablePagination-toolbar': {
          flexWrap: 'wrap',
          rowGap: 2
        },
        '& .MuiTablePagination-actions': {
          ml: 2
        }
      }}
    />
  )
}

export default DataGridPagination
