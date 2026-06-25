import React, { ReactNode } from 'react'
import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

interface CustomAccordionProps {
  title: string
  children: ReactNode
  actions?: ReactNode
}

const CustomAccordion = ({ title, children, actions }: CustomAccordionProps) => {
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        borderRadius: 2,
        mb: 4,
        overflow: 'hidden',
        backgroundColor: 'background.paper',
        boxShadow: theme => theme.shadows[1]
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap'
        }}
      >
        <Typography variant='h6'>{t(title)}</Typography>

        {/* ✅ Botones a la derecha */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>{actions}</Box>
      </Box>

      {/* Body */}
      <Box sx={{ p: 3, pt: 0 }}>{children}</Box>
    </Box>
  )
}

export default CustomAccordion
