import { Country, Province } from './generalTypes'

export interface Company {
  id: number
  name: string
  cif: string
  address: string
  population: string | null
  province_id: number | null
  country_id: number | null
  post_code: string
  telephone: string
  email: string
  logo: string
  active: number
  schedule_notification: number
  number_absence_request: number
  province: Province
  country: Country
  hourly_rate: number
  daily_minutes: number
}

export interface CompanyHour {
  id: number
  start: Date
  end: Date
  monday: number
  tuesday: number
  wednesday: number
  thursday: number
  friday: number
  saturday: number
  sunday: number
}

export interface CompanyAlert {
  id: number
  name: string
  alias: string
  company_alert_id: number
}

export interface CompanySetting {
  id: number
  company_id: number
  alias: string
  name: string
  default_value: number
  value: number
  company_company_setting_id: number
}

export interface CompanyPacket {
  id: number
  name: string
  company_packet_id: number
}

export interface CompanyPricing {
  id: number
  name: string
  company_pricing_id: number
}
