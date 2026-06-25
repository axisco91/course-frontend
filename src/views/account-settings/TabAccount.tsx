// ** React Imports
import { useState, ElementType, forwardRef } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import { styled } from '@mui/material/styles'
import MenuItem from '@mui/material/MenuItem'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button, { ButtonProps } from '@mui/material/Button'
import FormHelperText from '@mui/material/FormHelperText'

// ** Custom Component Import
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Third Party Imports
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import DatePicker from 'react-datepicker'
import { format } from 'date-fns'

// ** Icon Imports
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// ** Types
import { DateType } from 'src/types/forms/reactDatepickerTypes'

// ** Styled Components
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'
import { updateAuth } from 'src/api/api'
import { toast } from 'react-hot-toast'
import { normalSelectList } from 'src/context/formDataUtils'

// ** Third Party Imports
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import PlaceholderComponent from '../components/PlaceHolder'
import { useDispatch } from 'react-redux'
import { authActions } from 'src/reducers/users/AuthReducer'
import CropComponent from '../components/CropComponent'
import Icon from 'src/@core/components/icon'

// para las traducciones
type TranslationFunction = (key: string) => string

const ImgStyled = styled('img')(({ theme }) => ({
  width: 100,
  height: 100,
  marginRight: theme.spacing(6),
  borderRadius: '50%'
}))

const ButtonStyled = styled(Button)<ButtonProps & { component?: ElementType; htmlFor?: string }>(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    textAlign: 'center'
  }
}))

const ResetButtonStyled = styled(Button)<ButtonProps>(({ theme }) => ({
  marginLeft: theme.spacing(4),
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    marginLeft: 0,
    textAlign: 'center',
    marginTop: theme.spacing(2)
  }
}))

interface CustomInputProps {
  value: DateType
  label: string
}

const CustomInput = forwardRef(({ ...props }: CustomInputProps, ref) => {
  return <CustomTextField fullWidth inputRef={ref} {...props} sx={{ width: '100%' }} />
})

// Para controlar los validations
const schema = (t: TranslationFunction) => {
  const baseSchema = yup.object().shape({
    name: yup.string().required(t('Name is required')),
    surname1: yup.string().required(t('Surname is required')),
    email: yup.string().email(t('Invalid email address')).required(t('Email is required'))
  })

  return baseSchema
}

const TabAccount = () => {
  // ** State
  const dispatch = useDispatch()

  // Obtenemos en usuario que esta logeado
  const activeCompanyId = useSelector((state: RootState) => state.activeCompany.id)
  const user = useSelector((state: RootState) => state.auth.user)

  const [inputValue, setInputValue] = useState<string>('')
  const [imgSrc, setImgSrc] = useState<string>(user.profile_photo_path ? user.profile_photo_path : '')
  const [profilePhotoPath, setProfilePhotoPath] = useState<string>(
    user && user.profile_photo_path ? user.profile_photo_path : ''
  )
  const [dateOfBirth, setDateOfBirth] = useState<DateType>(
    user && user.date_of_birth ? new Date(user.date_of_birth + 'T00:00:00.000Z') : null
  )
  const { t, i18n } = useTranslation()

  // obtenemos los datos de los selects
  const genders = useSelector((state: RootState) => state.gender.genders)
  const countries = useSelector((state: RootState) => state.country.countries)
  const provinces = useSelector((state: RootState) => state.province.provinces)

  // Obtenemos los datos de inicio del usuario
  const defaultValues = {
    name: user.name,
    surname1: user.surname1,
    surname2: user.surname2,
    email: user.email,
    profile_photo_path: user.profile_photo_path ?? '',
    nif: user.nif,
    date_of_birth: user.date_of_birth,
    gender_id: user.gender_id ?? -1,
    country_id: user.country_id ?? -1,
    address: user.address ?? '',
    population: user.population ?? '',
    province_id: user.province_id ?? -1,
    post_code: user.post_code ?? '',
    phone_number: user.phone_number ?? '',
    naf: user.naf ?? '',
    iban: user.iban ?? '',
    last_company_id: user.last_company_id,
    company_id: user.last_company_id,
    image: null
  }

  // Creamos la lista de generos, paises y provincias
  const gendersList = normalSelectList(genders)

  const countriesList = normalSelectList(countries)

  const provincesList = normalSelectList(provinces)

  // Imagen que pasaremos para que haga el crop
  const [imgCrop, setImgCrop] = useState<string>('')

  // Abrir dialogo para manipular la imagen
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // ** Hooks
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues, resolver: yupResolver(schema(t)) })

  const handleInputImageChange = (file: any) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {
      reader.onload = () => {
        const result = reader.result as string
        setImgCrop(result)
      }
      setProfilePhotoPath(file.target.files[0])
      reader.readAsDataURL(files[0])
    }

    setIsDialogOpen(true)
  }

  const handleInputImageReset = () => {
    setInputValue('')
    const image = user.profile_photo_path ? user.profile_photo_path : '/images/avatars/1.png'
    setImgSrc(image)
  }

  // Función para guardar la imagen
  const handleCropSave = async (croppedImage: string) => {
    setImgSrc(croppedImage)
    const reader = new FileReader()
    const blob = await (await fetch(croppedImage)).blob()
    const file = new File([blob], 'image.jpeg', { type: 'image/jpeg' })
    reader.onload = () => {
      const result = reader.result as string
      setImgSrc(result) // Set the image source to the data URL
    }
    reader.readAsDataURL(file)
    setProfilePhotoPath(file)
  }

  const handleFormSubmit: SubmitHandler<any> = data => {
    // Creamos el formData y añadimos los elementos
    const formData = new FormData()
    formData.append('date_of_birth', dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : '')
    formData.append('name', data.name)
    formData.append('surname1', data.surname1)
    formData.append('surname2', data.surname2)
    formData.append('gender_id', data.gender_id !== -1 ? data.gender_id.toString() : '')
    formData.append('phone_number', data.phone_number)
    formData.append('address', data.address)
    formData.append('population', data.population)
    formData.append('country_id', data.country_id !== -1 ? data.country_id.toString() : '')
    formData.append('province_id', data.province_id !== -1 ? data.province_id.toString() : '')
    formData.append('post_code', data.post_code)
    formData.append('naf', data.naf)
    formData.append('iban', data.iban)
    formData.append('profile_photo_path', profilePhotoPath)
    formData.append('email', data.email)
    formData.append('company_id', activeCompanyId ? activeCompanyId.toString() : '')

    updateAuth(formData)
      .then(response => {
        dispatch(authActions.setAvatar(response.data.data.user.profile_photo_path))
        const successMessage = t('Data saved successfully!')
        toast.success(successMessage, {
          position: 'top-right'
        })
      })
      .catch(error => {
        console.error(error.response.data)
        if (error.response) {
          if (error.response.data.errors) {
            /*  const validationErrors = error.response.data.errors;
            Object.keys(validationErrors).forEach((fieldName) => {
              setError(fieldName as keyof Auth, {
                  type: 'manual',
                  message: validationErrors[fieldName][0]
                }
              );
            });*/
          } else {
            console.error('Network Error:', error.message)
            const errorMessage = t('Error with server try again later')
            toast.error(errorMessage, {
              position: 'top-right'
            })
          }
        } else {
          // Handle network error (e.g., no response from the server)
          console.error('Network Error:', error.message)
          const errorMessage = t('Error with server try again later')
          toast.error(errorMessage, {
            position: 'top-right'
          })
        }
      })
  }

  return (
    <DatePickerWrapper>
      <CropComponent
        open={isDialogOpen}
        handleClose={() => setIsDialogOpen(false)}
        imgSrc={imgCrop}
        handleSave={handleCropSave}
        aspect={16 / 16}
      />
      <Grid container spacing={6}>
        {/* Account Details Card */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title={t('Profile Details')} />
            <form onSubmit={handleSubmit(handleFormSubmit)}>
              <CardContent sx={{ pt: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {imgSrc !== '' ? (
                    <ImgStyled src={imgSrc} alt='Profile Pic' />
                  ) : (
                    <PlaceholderComponent src={''} sx={{ mr: 3, width: '4.875rem', height: '4.875rem' }} />
                  )}
                  <div>
                    <ButtonStyled component='label' variant='contained' htmlFor='profile_path_file'>
                      <Icon icon='tabler:upload' fontSize={20} />
                      {t('Upload New Photo')}
                      <input
                        hidden
                        type='file'
                        value={inputValue}
                        accept='image/png, image/jpeg'
                        onChange={handleInputImageChange}
                        id='profile_path_file'
                      />
                    </ButtonStyled>
                    <ResetButtonStyled color='secondary' variant='tonal' onClick={handleInputImageReset}>
                      <Icon icon='tabler:restore' fontSize={20} />
                      {t('Reset')}
                    </ResetButtonStyled>
                  </div>
                </Box>
              </CardContent>
              <Divider />
              <CardContent>
                <Grid container spacing={5}>
                  <Grid item xs={12} sm={3}>
                    <Controller
                      name='name'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <CustomTextField
                          fullWidth
                          value={value}
                          onChange={onChange}
                          label={t('Name')}
                          id='input-name'
                          placeholder={t('Name')}
                          error={Boolean(errors.name)}
                          {...(errors.name && { helperText: errors.name.message })}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Controller
                      name='surname1'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <CustomTextField
                          fullWidth
                          value={value}
                          onChange={onChange}
                          label={t('Surname 1')}
                          id='input-surname1'
                          placeholder={t('Surname 1')}
                          error={Boolean(errors.surname1)}
                          {...(errors.surname1 && { helperText: errors.surname1.message })}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Controller
                      name='surname2'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <CustomTextField
                          fullWidth
                          value={value}
                          onChange={onChange}
                          label={t('Surname 2')}
                          id='input-surname2'
                          placeholder={t('Surname 2')}
                          error={Boolean(errors.surname2)}
                          {...(errors.surname2 && { helperText: errors.surname2.message })}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Controller
                      name='email'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <CustomTextField
                          fullWidth
                          value={value}
                          onChange={onChange}
                          label={t('Personal email')}
                          placeholder={t('Personal email')}
                          id='input-email'
                          error={Boolean(errors.email)}
                          {...(errors.email && { helperText: errors.email.message })}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Controller
                      name='date_of_birth'
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          isClearable
                          id='date_of_birth'
                          dateFormat='dd/MM/yyyy'
                          selected={dateOfBirth}
                          onChange={date => {
                            field.onChange(date) // Update the form value when the date changes
                            setDateOfBirth(date) // Update the local 'date' state
                          }}
                          customInput={<CustomInput value={dateOfBirth} label={t('Date of Birth')} />}
                          calendarStartDay={1}
                          locale={i18n.language}
                          showMonthDropdown
                          showYearDropdown
                          scrollableYearDropdown
                          yearDropdownItemNumber={15}
                        />
                      )}
                    />
                    {errors.date_of_birth && <FormHelperText error>{errors.date_of_birth.message}</FormHelperText>}
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Controller
                      name='gender_id'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <CustomTextField
                          select
                          fullWidth
                          value={value}
                          onChange={onChange}
                          label={t('Gender')}
                          id='input-gender_id'
                          error={Boolean(errors.gender_id)}
                          {...(errors.gender_id && { helperText: errors.gender_id.message })}
                        >
                          <MenuItem value='-1'>
                            <em>{t('None')}</em>
                          </MenuItem>
                          {gendersList}
                        </CustomTextField>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Controller
                      name='country_id'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <CustomTextField
                          select
                          fullWidth
                          value={value}
                          onChange={onChange}
                          label={t('Country')}
                          id='input-country_id'
                          error={Boolean(errors.country_id)}
                          {...(errors.country_id && { helperText: errors.country_id.message })}
                        >
                          <MenuItem value='-1'>
                            <em>{t('None')}</em>
                          </MenuItem>
                          {countriesList}
                        </CustomTextField>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Controller
                      name='address'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <CustomTextField
                          fullWidth
                          value={value}
                          onChange={onChange}
                          label={t('Address')}
                          id='input-address'
                          placeholder={t('Address')}
                          error={Boolean(errors.address)}
                          {...(errors.address && { helperText: errors.address.message })}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Controller
                      name='province_id'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <CustomTextField
                          select
                          fullWidth
                          value={value}
                          onChange={onChange}
                          label={t('Province')}
                          id='input-province_id'
                          error={Boolean(errors.province_id)}
                          {...(errors.province_id && { helperText: errors.province_id.message })}
                        >
                          <MenuItem value='-1'>
                            <em>{t('None')}</em>
                          </MenuItem>
                          {provincesList}
                        </CustomTextField>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Controller
                      name='post_code'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <CustomTextField
                          fullWidth
                          value={value}
                          onChange={onChange}
                          label={t('Post Code')}
                          id='input-post_code'
                          placeholder={t('Post Code')}
                          error={Boolean(errors.post_code)}
                          {...(errors.post_code && { helperText: errors.post_code.message })}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Controller
                      name='phone_number'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <CustomTextField
                          fullWidth
                          value={value}
                          onChange={onChange}
                          label={t('Personal Phone Number')}
                          id='input-phone_number'
                          placeholder={t('Personal Phone Number')}
                          error={Boolean(errors.phone_number)}
                          {...(errors.phone_number && { helperText: errors.phone_number.message })}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Controller
                      name='naf'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <CustomTextField
                          fullWidth
                          value={value}
                          onChange={onChange}
                          label={t('Social Security Number')}
                          id='input-naf'
                          placeholder={t('Social Security Number')}
                          error={Boolean(errors.naf)}
                          {...(errors.naf && { helperText: errors.naf.message })}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Controller
                      name='iban'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <CustomTextField
                          fullWidth
                          value={value}
                          onChange={onChange}
                          label={t('Bank Account Number')}
                          id='input-iban'
                          placeholder={t('Bank Account Number')}
                          error={Boolean(errors.iban)}
                          {...(errors.iban && { helperText: errors.iban.message })}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ pt: theme => `${theme.spacing(6.5)} !important` }}>
                    <Button variant='contained' sx={{ mr: 4 }} type='submit'>
                      <Icon icon='tabler:device-floppy' fontSize={20} />
                      {t('Save Changes')}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </form>
          </Card>
        </Grid>
      </Grid>
    </DatePickerWrapper>
  )
}

export default TabAccount
