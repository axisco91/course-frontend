import {
  DataGrid as MuiDataGrid,
  type DataGridProps,
  type GridSlotsComponent,
  type GridValidRowModel
} from '@mui/x-data-grid'
import DataGridPagination from './DataGridPagination'

export * from '@mui/x-data-grid'

const DataGrid = <R extends GridValidRowModel = any>({ slots, components, ...props }: DataGridProps<R>) => {
  return (
    <MuiDataGrid
      {...props}
      slots={{ pagination: DataGridPagination, ...slots }}
      components={{ Pagination: DataGridPagination, ...(components as Partial<GridSlotsComponent> | undefined) }}
    />
  )
}

export { DataGrid }
