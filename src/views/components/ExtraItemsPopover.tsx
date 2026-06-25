import { Fragment, useState } from 'react'
import { Avatar, Box, Popover } from '@mui/material'

const ExtraItemsPopover = ({ extraItems, renderFunction, onItemClick, url, urlFunction }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = event => {
    setAnchorEl(event.currentTarget)
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setTimeout(() => {
      if (!isHovered) setAnchorEl(null)
    }, 300)
  }

  const open = Boolean(anchorEl)

  const handleClick = item => {
    if (onItemClick) {
      onItemClick(item)
      setAnchorEl(null)
    } else if (urlFunction) {
      window.open(urlFunction(item), '_blank')
      setAnchorEl(null)
    } else if (url) {
      window.open(url, '_blank')
      setAnchorEl(null)
    }
  }

  return (
    <>
      <Avatar
        sx={{ bgcolor: 'primary.main', ml: 2, cursor: 'pointer', width: 60, height: 60 }}
        onMouseEnter={handleMouseEnter}
      >
        +{extraItems.length}
      </Avatar>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        disableAutoFocus
        disableRestoreFocus
        PaperProps={{
          onMouseEnter: () => setIsHovered(true),
          onMouseLeave: () => {
            setIsHovered(false)
            handleMouseLeave()
          },
          sx: {
            pointerEvents: 'auto',
            overflow: 'auto',
            maxHeight: '300px'
          }
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
            gap: 1,
            p: 1,
            maxWidth: '300px',
            maxHeight: '250px',
            overflowY: 'auto'
          }}
        >
          {extraItems.map(item => (
            <Box key={item.id} onClick={() => handleClick(item)}>
              {renderFunction(item)}
            </Box>
          ))}
        </Box>
      </Popover>
    </>
  )
}

export default ExtraItemsPopover
