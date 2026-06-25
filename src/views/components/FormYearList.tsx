import React, { Fragment, useState, useEffect } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'

import CustomTextField from './CustomTextField'
import { useTranslation } from 'react-i18next'

type YearItem = {
  id: number
  name: string
}

interface YearListProps {
  onChange: (year: number) => void
  selectedYear: number // Selected year prop
  type: string // Type of list (e.g. 'normal')
  errors?: any // Optional errors prop to handle validation errors
  years?: any
}

const FormYearList: React.FC<YearListProps> = ({ onChange, selectedYear, type, errors, years }) => {
  const { t } = useTranslation()
  const [year, setYear] = useState(selectedYear)

  useEffect(() => {
    setYear(selectedYear) // Update the local state when the selectedYear prop changes
  }, [selectedYear])

  // ** Generate list of the last 5 years
  const currentYear = new Date().getFullYear()
  let yearList: YearItem[] = []

  if (years) {
    yearList = years
  } else {
    for (let i = 0; i < 5; i++) {
      yearList.push({ id: currentYear - i, name: (currentYear - i).toString() })
    }
  }

  const handleChange = (selectedYear: YearItem) => {
    setYear(selectedYear.id)
    onChange(selectedYear.id)
  }

  // ** Conditional logic based on `type` prop
  if (type === 'normal') {
    yearList.unshift({ id: -1, name: t('All') }) // Add an "All" option if needed

    return (
      <Fragment>
        <Autocomplete
          autoHighlight
          sx={{ width: '100%', mr: 4 }} // Adjust width and margin to match TextField
          id='year'
          options={yearList}
          getOptionLabel={option => option.name || ''}
          renderInput={params => (
            <CustomTextField
              {...params}
              label={t('Year')}
              placeholder={t('Year')}
              error={Boolean(errors?.year)} // Error state handling for the 'normal' case
              helperText={errors?.year?.message} // Display error message
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              {option.name}
            </li>
          )}
          onChange={(event, newValue) => {
            handleChange(newValue as YearItem)
          }}
          value={yearList.find(item => item.id === year)}
          clearIcon={null} // Disable the clear icon if not needed
        />
      </Fragment>
    )
  } else {
    // Alternative layout (not 'normal' case)
    return (
      <Fragment>
        <Autocomplete
          autoHighlight
          sx={{ width: '100%', mr: 4 }}
          id='year'
          options={yearList}
          getOptionLabel={option => option.name || ''}
          renderInput={params => (
            <CustomTextField
              {...params}
              label={t('Year')}
              placeholder={t('Year')}
              error={Boolean(errors?.year)} // Error state handling for the 'normal' case
              helperText={errors?.year?.message} // Display error message
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              {option.name}
            </li>
          )}
          onChange={(event, newValue) => {
            handleChange(newValue as YearItem)
          }}
          value={yearList.find(item => item.id === year)}
          clearIcon={null}
        />
      </Fragment>
    )
  }
}

export default FormYearList
