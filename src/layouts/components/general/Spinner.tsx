import React from 'react'
import Box, { BoxProps } from '@mui/material/Box'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { CircularProgress } from '@mui/material'

const CustomSpinner = ({ sx }: { sx?: BoxProps['sx'] }) => {
  // obtenemos el logo
  const logo = useSelector((state: RootState) => state.layout.logo)

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        ...sx
      }}
    >
      {/*logo && <img src={logo} width={300} />*/}
      {logo && <img src={'/images/logo-rrhh-nueva.png'} width={300} />}
      <CircularProgress disableShrink sx={{ mt: 6 }} />
    </Box>
  )
}

export default CustomSpinner
