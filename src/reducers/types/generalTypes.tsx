export interface Alert {
  id: number
  name: string
  alias: string
}

export interface Language {
  id: number
  name: string
  alias: string
}

export interface Packet {
  id: number
  name: string
}

export interface PacketRole {
  id: number
  name: string
  packet_role_id: number
}

export interface Role {
  id: number
  name: string
}

export interface RolePermission {
  id: number
  name: string
  role_has_permission: number
  permission_id: number
}

export interface Permission {
  id: number
  name: string
}

export interface PricingPlan {
  id: number
  name: string
  base_price: number
  price_per_user: number
  min_user: number
  max_user: number
}

export interface Festival {
  id: number
  name: string
  date: Date
}

export interface Token {
  id: number
  token: string
  url: string
}

export interface FingerPrintDevice {
  id: number
  center_id: number
  device_number: number
  description: Date
  motive: number
}

export interface Service {
  id: number
  name: string
  center_id: number
  start: Date
  end: Date
  description: string
  user_has_service: number
  status: number
  alias: string
  color: string
}

export interface UserService {
  id: number
  name: string
}

export interface NotificationType {
  id: number
  name: string
  table_name: string
  model_rute: string
  active: number
}

export interface Gender {
  id: number
  name: string
}

export interface Country {
  id: number
  name: string
}

export interface Province {
  id: number
  name: string
}

export interface UserCompany {
  id: number
  name: string
}

export interface Dates {
  date: Date
}

export interface StorageFolder {
  occupied: number
  name: string
  icon: string
}

export interface DepartmentHour {
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

export interface InternalRecruitment {
  id: number
  name: string
  description: string
  status: number
  department_id: number
  requirements: string
  salary: number
}

export interface InternalRecruitmentInterview {
  id: number
  notes: string
  date: Date
}

export interface PaidHours {
  id: number
  full_name: string
  month: string
  paid: string
  hours: string
  profile_photo_path: string
}
export interface Menu {
  path: string
  badgeContent?: string
  badgeColor?: string
}

export interface Courtesy {
  id: number
  start: Date
  end: Date
  minutes: number
}
