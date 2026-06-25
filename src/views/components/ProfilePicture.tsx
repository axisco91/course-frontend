import { styled } from '@mui/system'

const ProfilePicture = styled('img')(({ theme }) => ({
  width: 120,
  height: 120,
  borderRadius: '50%',
  border: `4px solid ${theme.palette.common.white}`,
  [theme.breakpoints.down('md')]: {
    marginBottom: theme.spacing(4)
  }
}))

export const ProfilePicture2 = styled('img')(({ theme }) => ({
  width: 75,
  height: 75,
  borderRadius: '50%',
  border: `4px solid ${theme.palette.common.white}`,
  alignContent: 'center',
  [theme.breakpoints.down('md')]: {
    marginBottom: theme.spacing(4)
  }
}))

export const ProfilePictureSmall = styled('img')(({ theme }) => ({
  width: 55,
  height: 55,
  borderRadius: '50%',
  border: `4px solid ${theme.palette.common.white}`,
  alignContent: 'center',
  [theme.breakpoints.down('md')]: {
    marginBottom: theme.spacing(4)
  }
}))

export default ProfilePicture
