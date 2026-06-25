// DraggableIconButton.js
import { useDrag } from 'react-dnd'
import { IconButton } from '@mui/material'
import Icon from 'src/@core/components/icon'

interface DraggableIconButtonProps {
  onDrag: () => void
  icon: string
  additionalData: {
    shift_id: any
    type: string
  }
}

const DraggableIconButton: React.FC<DraggableIconButtonProps> = ({ onDrag, icon, additionalData }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'ICON_BUTTON',
    item: { type: 'ICON_BUTTON', additionalData },
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    })
  }))

  return (
    <IconButton
      ref={drag}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onMouseDown={onDrag} // Start the drag when the mouse is down on the IconButton
    >
      <Icon icon={`tabler:${icon}`} />
    </IconButton>
  )
}

export default DraggableIconButton
