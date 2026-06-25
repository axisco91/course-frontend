import React, { Fragment, useState, useEffect } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import CustomTextField from './CustomTextField'
import { useTranslation } from 'react-i18next'

type MonthItem = {
  id: number
  name: string
}

interface MonthListProps {
  onChange: (month: number) => void
  selectedMonth: number // Add selectedMonth prop
  type: string
  errors?: any // Optional errors prop to pass down validation errors
}

const FormMonthList: React.FC<MonthListProps> = ({ onChange, selectedMonth, type, errors }) => {
  const { t } = useTranslation()
  const [month, setMonth] = useState(selectedMonth)

  useEffect(() => {
    setMonth(selectedMonth) // Update the local state when the selectedMonth prop changes
  }, [selectedMonth])

  const monthList = [
    { id: 1, name: t('January') },
    { id: 2, name: t('February') },
    { id: 3, name: t('March') },
    { id: 4, name: t('April') },
    { id: 5, name: t('May') },
    { id: 6, name: t('June') },
    { id: 7, name: t('July') },
    { id: 8, name: t('August') },
    { id: 9, name: t('September') },
    { id: 10, name: t('October') },
    { id: 11, name: t('November') },
    { id: 12, name: t('December') }
  ]

  const handleChange = (selectedMonth: MonthItem) => {
    setMonth(selectedMonth.id)
    onChange(selectedMonth.id)
  }

  // ** Conditional logic based on `type` prop
  if (type === 'normal') {
    monthList.unshift({ id: -1, name: t('All') }) // Add an "All" option if needed

    return (
      <Fragment>
        <Autocomplete
          autoHighlight
          sx={{ width: '100%', mr: 4 }} // Adjust width and margin to match TextField
          id='month'
          options={monthList}
          getOptionLabel={option => option.name || ''}
          renderInput={params => (
            <CustomTextField
              {...params}
              label={t('Month')}
              placeholder={t('Month')}
              error={Boolean(errors?.month)} // Error handling for 'normal' case
              helperText={errors?.month?.message} // Display error message
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              {option.name}
            </li>
          )}
          onChange={(event, newValue) => {
            handleChange(newValue as MonthItem)
          }}
          value={monthList.find(item => item.id === month)}
          clearIcon={null} // Set clearIcon to null
        />
      </Fragment>
    )
  } else {
    return (
      <Fragment>
        <Autocomplete
          autoHighlight
          sx={{ width: '100%', mr: 4 }}
          id='month'
          options={monthList}
          getOptionLabel={option => option.name || ''}
          renderInput={params => (
            <CustomTextField
              {...params}
              label={t('Month')}
              placeholder={t('Month')}
              error={Boolean(errors?.month)} // Error handling for 'normal' case
              helperText={errors?.month?.message} // Display error message
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              {option.name}
            </li>
          )}
          onChange={(event, newValue) => {
            handleChange(newValue as MonthItem)
          }}
          value={monthList.find(item => item.id === month)}
          clearIcon={null} // Set clearIcon to null
        />
      </Fragment>
    )
  }
}

export default FormMonthList
