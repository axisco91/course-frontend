import { AssociatedCompany } from './associatedCompanyTypes'
import { Department, Position, WorkGroup, WorkSubgroup } from './generalTypes'

export interface ContractType {
  id: number
  company_id: number
  name: string
}

export interface Contract {
  id: number
  name: string
  contract_type_id: number
  start: Date
  end: string
  position_id: number
  department_id: number
  work_group_id: number
  work_subgroup_id: number
  associated_company_id: number
  holidays_natural_days: number
  maximum_absence_period: string | null
  week_hours: number
  authorized_expense: number
  salary_cost: number
  price_km_company: number
  own_km_price: number
  comment: string
  monthly_gross_salary: number
  position: Position
  department: Department
  contract_type: ContractType
  work_group: WorkGroup
  work_subgroup: WorkSubgroup
  associated_company: AssociatedCompany
  hourly_rate: number
  daily_minutes: number
}
