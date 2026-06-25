import { Card, CardContent, Typography, Box, IconButton, Avatar, Tooltip } from '@mui/material'
import { motion, useAnimation } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import Icon from 'src/@core/components/icon'

const CommunicationCard = ({ data, onArchiveToggle, onFavoriteToggle, onRead }) => {
  const {
    id,
    from_full_name,
    to_full_name,
    subject,
    communication_type_name,
    date,
    date_read,
    favorite,
    archive,
    from_profile_photo_path
  } = data

  const controls = useAnimation()
  const { t } = useTranslation()

  return (
    <Card
      component={motion.div}
      animate={controls}
      initial={{ x: 0, opacity: 1 }}
      sx={{
        mb: 2,
        mx: 2,
        p: 3,
        borderRadius: 4,
        boxShadow: 1,
        backgroundColor: date_read ? 'action.hover' : 'background.paper',
        transition: 'all 0.25s ease-in-out'
      }}
      onClick={() => onRead(id)}
    >
      <CardContent>
        <Box display='flex' alignItems='center' mb={2}>
          <Avatar src={from_profile_photo_path} sx={{ mr: 2 }} />
          <Box>
            <Typography variant='subtitle1' sx={{ mr: 3, fontWeight: 900, color: 'success.main' }}>
              {t('From')}
            </Typography>
            <Typography variant='subtitle2' sx={{ mr: 3, fontWeight: 400 }}>
              {from_full_name}
            </Typography>

            <Typography variant='subtitle1' sx={{ mr: 3, fontWeight: 900, color: 'warning.main' }}>
              {t('To')}
            </Typography>
            <Typography variant='subtitle2' sx={{ mr: 3, fontWeight: 400 }}>
              {to_full_name}
            </Typography>
          </Box>
        </Box>

        <Box mb={1}>
          <Typography variant='subtitle1' sx={{ mr: 3, fontWeight: 900, color: 'success.main' }}>
            {t('Affair')}
          </Typography>
          <Typography variant='subtitle2' sx={{ mr: 3, fontWeight: 400 }}>
            {subject || '-'}
          </Typography>

          <Typography variant='subtitle1' sx={{ mr: 3, fontWeight: 900, color: 'warning.main' }}>
            {t('Type')}
          </Typography>
          <Typography variant='subtitle2' sx={{ mr: 3, fontWeight: 400 }}>
            {communication_type_name || '-'}
          </Typography>
        </Box>

        <Box mb={1}>
          <Box
            sx={{
              display: 'flex',
              overflow: 'hidden',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around'
            }}
          >
            <Typography variant='subtitle1' sx={{ mr: 3, fontWeight: 900, color: 'success.main' }}>
              {t('Received')}
            </Typography>
            <Typography variant='subtitle2' sx={{ mr: 3, fontWeight: 400 }}>
              {date}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              overflow: 'hidden',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around'
            }}
          >
            <Typography variant='subtitle1' sx={{ mr: 3, fontWeight: 900, color: 'warning.main' }}>
              {t('Read')}:
            </Typography>
            <Typography variant='subtitle2' sx={{ mr: 3, fontWeight: 400 }}>
              {date_read}
            </Typography>
          </Box>
        </Box>

        <Box mt={2} display='flex' justifyContent='flex-end' gap={1}>
          <Tooltip title={favorite ? 'Unfavorite' : 'Favorite'}>
            <IconButton onClick={() => onFavoriteToggle?.(id, favorite)}>
              <Icon icon={favorite ? 'tabler:star-filled' : 'tabler:star'} color={favorite ? 'warning.main' : ''} />
            </IconButton>
          </Tooltip>
          <Tooltip title={archive ? 'Unarchive' : 'Archive'}>
            <IconButton onClick={() => onArchiveToggle?.(id, archive)}>
              <Icon icon={archive ? 'tabler:archive-off' : 'tabler:archive'} />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  )
}

export default CommunicationCard
