import React, { Fragment, ReactElement, Ref, forwardRef, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton, { IconButtonProps } from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Switch from '@mui/material/Switch'
import { styled } from '@mui/material/styles'
import { Button, Dialog, DialogActions, DialogContent, Fade, FadeProps, FormControlLabel } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import { useTranslation } from 'react-i18next'

// For the dialog transition
const Transition = forwardRef(function Transition(
  props: FadeProps & { children?: ReactElement<any, any> },
  ref: Ref<unknown>
) {
  return <Fade ref={ref} {...props} />
})

// Custom close button styling
const CustomCloseButton = styled(IconButton)<IconButtonProps>(({ theme }) => ({
  top: 0,
  right: 0,
  color: 'grey.500',
  position: 'absolute',
  boxShadow: theme.shadows[2],
  transform: 'translate(10px, -10px)',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: `${theme.palette.background.paper} !important`,
  transition: 'transform 0.25s ease-in-out, box-shadow 0.25s ease-in-out',
  '&:hover': {
    transform: 'translate(7px, -5px)'
  }
}))

// Define the props for DaysDialog
interface ConfirmDialogProps {
  onClose: () => void
  onConfirm: (selectedDays: number[]) => void // Send the selected days as numbers (1 = Monday, ..., 7 = Sunday)
}

const DaysDialog: React.FC<ConfirmDialogProps> = ({ onClose, onConfirm }) => {
  const { t } = useTranslation()

  // State to track selected days (boolean array)
  const [selectedDays, setSelectedDays] = useState<boolean[]>(Array(7).fill(false)) // [false, false, ..., false]

  // Handle switch toggles
  const toggleDay = (index: number) => {
    const updatedDays = [...selectedDays]
    updatedDays[index] = !updatedDays[index]
    setSelectedDays(updatedDays)
  }

  // Confirm handler to map selected days to numbers and send them
  const handleConfirm = () => {
    const daysNumbers = selectedDays
      .map((isSelected, index) => (isSelected ? index + 1 : null)) // Map true values to day numbers
      .filter(day => day !== null) as number[] // Remove null values
    onConfirm(daysNumbers)
  }

  const handleCloseDialog = () => {
    onClose()
  }

  return (
    <Fragment>
      <Dialog
        fullWidth
        open={true}
        maxWidth='md'
        scroll='body'
        onClose={handleCloseDialog}
        TransitionComponent={Transition}
        onBackdropClick={handleCloseDialog}
        sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
      >
        <DialogContent
          sx={{
            pb: theme => `${theme.spacing(8)} !important`,
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pt: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <CustomCloseButton onClick={handleCloseDialog}>
            <Icon icon='tabler:x' fontSize='1.25rem' />
          </CustomCloseButton>
          <Box sx={{ mb: 8, textAlign: 'center' }}>
            <Typography variant='h3' sx={{ mb: 3 }}>
              {t('Select Days')}
            </Typography>
            {/* Switches for days */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
                <FormControlLabel
                  key={day}
                  control={<Switch checked={selectedDays[index]} onChange={() => toggleDay(index)} color='primary' />}
                  label={t(day)}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: 'center',
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pb: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <Button variant='tonal' color='secondary' onClick={handleConfirm}>
            {t('Ok')}
          </Button>
          <Button variant='tonal' color='secondary' onClick={handleCloseDialog}>
            {t('Cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  )
}

export default DaysDialog
