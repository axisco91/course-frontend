import { ElementType, forwardRef } from 'react'
import MuiAutocomplete, { AutocompleteProps } from '@mui/material/Autocomplete'
import { optionKey } from 'src/utils/festivalLabel'

const GuardedAutocomplete = forwardRef(
  <
    T,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends ElementType
  >(
    props: AutocompleteProps<T, Multiple, DisableClearable, FreeSolo, ChipComponent>,
    ref: any
  ) => {
    const { disabled, readOnly, onChange, onInputChange, onOpen, openOnFocus, renderOption, getOptionLabel, ...rest } =
      props
    const locked = Boolean(disabled || readOnly)

    return (
      <MuiAutocomplete
        {...rest}
        getOptionLabel={getOptionLabel}
        renderOption={
          renderOption ??
          ((optionProps, option) => {
            const { key, ...liProps } = optionProps as any
            const label = getOptionLabel ? getOptionLabel(option) : String((option as any)?.label ?? (option as any)?.name ?? '')

            return (
              <li {...liProps} key={optionKey(option) || key}>
                {label}
              </li>
            )
          })
        }
        ref={ref}
        disabled={disabled}
        readOnly={locked}
        openOnFocus={!locked && openOnFocus}
        onOpen={event => {
          if (locked) {
            event.preventDefault()

            return
          }

          onOpen?.(event)
        }}
        onChange={(event, value, reason, details) => {
          if (locked) {
            event.preventDefault()

            return
          }

          onChange?.(event, value, reason, details)
        }}
        onInputChange={(event, value, reason) => {
          if (locked) {
            event?.preventDefault()

            return
          }

          onInputChange?.(event, value, reason)
        }}
      />
    )
  }
) as typeof MuiAutocomplete

export default GuardedAutocomplete
