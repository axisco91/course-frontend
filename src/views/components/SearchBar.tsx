// ** React Imports
import { ChangeEvent } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'

// ** ThirdParty Components
import { useTranslation } from 'react-i18next'

// ** Custom Component Import
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

interface Props {
  value: string
  clearSearch: () => void
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}

const SearchBar = (props: Props) => {
  // Traducciones
  const { t } = useTranslation()

  return (
    <CustomTextField
      fullWidth
      value={props.value}
      placeholder={t('Search') + '…'}
      onChange={props.onChange}
      InputProps={{
        startAdornment: (
          <Box sx={{ mr: 2, display: 'flex' }}>
            <Icon fontSize='1.25rem' icon='tabler:search' />
          </Box>
        ),
        endAdornment: (
          <IconButton size='small' title='Clear' aria-label='Clear' onClick={props.clearSearch}>
            <Icon fontSize='1.25rem' icon='tabler:x' />
          </IconButton>
        )
      }}
    />
  )
}

export default SearchBar
