import React from 'react'
import Typography from '@mui/material/Typography'
import { useDrop } from 'react-dnd'
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'

interface EmptyCellProps {
  cellKey: string
  onDrop: (item: any, cellKey: string) => void
  isHovered: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: () => void
  name: string
  icon?: string
}

const EmptyCell: React.FC<EmptyCellProps> = ({
  cellKey,
  onDrop,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
  name,
  icon
}) => {
  const [, drop] = useDrop(() => ({
    accept: 'ICON_BUTTON', // Specify the type that can be dropped here
    drop: item => onDrop(item, cellKey) // Handle the drop event
  }))

  return (
    <Box
      ref={drop}
      sx={{
        width: '120px !important',
        height: '80px',
        transition: 'background-color 0.3s ease',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'flex-start', // Align items at the top
        justifyContent: 'flex-end' // Align items to the right
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <Typography
        noWrap
        variant='body2'
        sx={{
          fontWeight: 600,
          width: '30px',
          textAlign: 'center',
          margin: '2px',
          fontSize: '10px',
          padding: '2px'
        }}
      >
        {name}
      </Typography>
      {icon && (
        <Icon
          icon={icon}
          style={{
            width: '10px'
          }}
        />
      )}
    </Box>
  )
}

export default EmptyCell
