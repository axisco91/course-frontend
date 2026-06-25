import { DateType } from 'src/types/forms/reactDatepickerTypes'

export interface Auth {
  name: string
  surname1: string
  surname2: string
  email: string
  profile_photo_path: string | null
  nif: string
  date_of_birth: string | null
  gender_id: number | null
  country_id: number | null
  address: string | null
  population: string | null
  province_id: string | null
  post_code: string | null
  phone_number: string | null
  naf: string | null
  iban: string | null
  last_company_id: number
  company_id: number
  image: File | null
}

export interface User {
  name: string
  surname1: string
  surname2: string
  username: string
  email: string
  profile_photo_path: string | null
  nif: string
  date_of_birth: DateType | null
  gender_id: number
  country_id: number
  address: string
  population: string
  province_id: number
  post_code: string
  phone_number: string
  naf: string
  iban: string
  center_id: number
  position_id: number
  department_id: number
  work_group_id: number
  work_subgroup_id: number
  associated_company_id: number
  time_zone_id: number
  contract_type_id: number
  start: DateType | null
  end: DateType | null
  company_email: string
  company_number: string
  night_schedule: number
  personalized_shift: number
  not_validate_nif: number
  holidays_natural_days: number
  maximum_absence_period: string | null
  week_hours: number
  authorized_expense: number
  salary_cost: number
  price_km_company: number
  own_km_price: number
  comment: string
  schedule_notification: number
  pin: string
  fingerprint_id: number
  full_name: string
  social_name: string
  company_role: string
}

export interface UserHour {
  id: number
  start: string
  end: Date
  monday: number
  tuesday: number
  wednesday: number
  thursday: number
  friday: number
  saturday: number
  sunday: number
}

export interface UserRole {
  id: number
  name: string
  user_has_role: number
}

export interface UserResume {
  id: number
  full_name: string
  name: string
  surname: string
  profile_photo_path: string
}

export interface UserSetting {
  id: number
  user_id: number
  company_id: number
  alias: string
  name: string
  default_value: number
  value: number
  user_user_setting_id: number
}
