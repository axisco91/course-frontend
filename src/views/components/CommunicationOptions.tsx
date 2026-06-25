import React, { Fragment } from 'react'
import { Box, Checkbox, IconButton, Tooltip } from '@mui/material'
import Icon from 'src/@core/components/icon'

const CommunicationOptions = ({
  rows,
  selectedCount,
  isAllSelected,
  isIndeterminate,
  onSelectAll,
  onArchive,
  onUnarchive,
  onRead,
  t
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    {rows.length > 0 && (
      <Checkbox
        onClick={e => e.stopPropagation()}
        onChange={e => onSelectAll(e.target.checked)}
        checked={isAllSelected}
        indeterminate={isIndeterminate}
        size='small'
      />
    )}
    {selectedCount > 0 && (
      <Fragment>
        <Tooltip title={t('Archive')}>
          <IconButton
            size='small'
            onClick={e => {
              e.stopPropagation()
              onArchive()
            }}
          >
            <Icon icon='tabler:archive' />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('Unarchive')}>
          <IconButton
            size='small'
            onClick={e => {
              e.stopPropagation()
              onUnarchive()
            }}
          >
            <Icon icon='tabler:archive-off' />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('Read')}>
          <IconButton
            size='small'
            onClick={e => {
              e.stopPropagation()
              onRead()
            }}
          >
            <Icon icon='tabler:mail-opened' />
          </IconButton>
        </Tooltip>
      </Fragment>
    )}
  </Box>
)

export default CommunicationOptions
