import { IconButton, MenuItem, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'
import { useTranslation } from 'react-i18next'
import CustomTextField from 'src/@core/components/mui/text-field'
import Icon from 'src/@core/components/icon'

interface Props {
  pageSize: number
  onChangeRowSize: (pageSize: number) => void
  page: number // índice actual (0-based)
  onChangePage: (page: number, pageSize: number) => void
  from: number
  to: number
  lastPage: number // TOTAL de páginas (1-based)
  total: number
}

const CustomPagination: React.FC<Props> = ({
  pageSize,
  onChangeRowSize,
  page,
  onChangePage,
  from,
  to,
  lastPage,
  total
}) => {
  const { t } = useTranslation()

  // estado de navegación: con page 0-based y lastPage 1-based
  const hasPrev = page > 0
  const hasNext = page + 1 < lastPage

  const goFirst = () => {
    if (hasPrev) onChangePage(0, pageSize)
  }
  const goPrev = () => {
    if (hasPrev) onChangePage(page - 1, pageSize)
  }
  const goNext = () => {
    if (hasNext) onChangePage(page + 1, pageSize)
  }
  const goLast = () => {
    if (hasNext) onChangePage(lastPage - 1, pageSize)
  } // última = índice total-1

  const handleSelectChange = (value: number) => {
    onChangeRowSize(value) // en el padre ya reseteas page a 0
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        mt: '10px',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 1.5
      }}
    >
      <Typography sx={{ mr: 1 }}>{t('Rows per page')}:</Typography>

      <CustomTextField
        select
        value={pageSize}
        onChange={e => handleSelectChange(Number(e.target.value))}
        sx={{ minWidth: 90 }}
      >
        <MenuItem sx={{ py: 2 }} value={5}>
          5
        </MenuItem>
        <MenuItem sx={{ py: 2 }} value={10}>
          10
        </MenuItem>
        <MenuItem sx={{ py: 2 }} value={20}>
          20
        </MenuItem>
        <MenuItem sx={{ py: 2 }} value={50}>
          50
        </MenuItem>
        <MenuItem sx={{ py: 2 }} value={100}>
          100
        </MenuItem>
      </CustomTextField>

      <Typography sx={{ mx: 1 }}>
        {from}-{to} {t('of')} {total}
      </Typography>

      {/* Primera */}
      <IconButton disabled={!hasPrev} onClick={goFirst} aria-label='Primera página'>
        <Icon icon='tabler:chevrons-left' fontSize={20} />
      </IconButton>

      {/* Anterior */}
      <IconButton disabled={!hasPrev} onClick={goPrev} aria-label='Anterior'>
        <Icon icon='tabler:chevron-left' fontSize={20} />
      </IconButton>

      {/* Siguiente */}
      <IconButton disabled={!hasNext} onClick={goNext} aria-label='Siguiente'>
        <Icon icon='tabler:chevron-right' fontSize={20} />
      </IconButton>

      {/* Última */}
      <IconButton disabled={!hasNext} onClick={goLast} aria-label='Última página'>
        <Icon icon='tabler:chevrons-right' fontSize={20} />
      </IconButton>
    </Box>
  )
}

export default CustomPagination
