import React from 'react'
import Select from 'react-select'

interface CustomSelectFieldProps {
  value: any
  onChange: (value: any) => void
  label: string
  error: boolean
  helperText?: string
  options: Array<{ value: any; label: string }>
  disabled?: boolean
}

const CustomSelectField: React.FC<CustomSelectFieldProps> = ({
  value,
  onChange,
  label,
  error,
  helperText,
  options,
  disabled = false
}) => {
  const handleSelectChange = (selectedOption: { value: any; label: string } | null) => {
    if (disabled) return
    onChange(selectedOption?.value)
  }

  return (
    <div>
      <label>{label}</label>
      <Select
        value={options.find(opt => opt.value === value) ?? null}
        onChange={handleSelectChange}
        options={options}
        isClearable={!disabled}
        isDisabled={disabled}
      />
      {error && <span>{helperText}</span>}
    </div>
  )
}

export default CustomSelectField
