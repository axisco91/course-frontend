// ** React Imports
import { forwardRef } from 'react'
import CustomTextField from './CustomTextField'

// ** Custom Component Import

interface PickerProps {
  label?: string
  readOnly?: boolean
}

const PickersComponent = forwardRef(({ ...props }: PickerProps, ref) => {
  // ** Props
  const { label, readOnly } = props

  return (
    <CustomTextField
      {...props}
      disableAutoComplete
      inputRef={ref}
      label={label || ''}
      {...(readOnly && { inputProps: { readOnly: true } })}
    />
  )
})

export default PickersComponent
