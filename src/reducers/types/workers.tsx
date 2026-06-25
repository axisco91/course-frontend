import { DateType } from 'src/types/forms/reactDatepickerTypes'

export interface Worker {
  id: number
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
}

export interface ContractedWorker {
  id: number
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
  contract_id: number
  contract_name: string
  contract_start: DateType | null
  contract_end: DateType | null
}

export interface WorkerShift {
  id: number
  full_name: string
  name: string
  surname1: string
  surname2: string
  profile_photo_path: string | null
  center_user_shift_id: number | null
}

export interface ResumeWorker {
  id: number
  full_name: string
  name: string
  surname1: string
  surname2: string
  profile_photo_path: string | null
}
