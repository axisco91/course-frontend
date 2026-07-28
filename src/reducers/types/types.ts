import { CompanySetting } from './companyTypes'
import { ContractType, Contract } from './contractTypes'
import { Auth, User, UserRole } from './userTypes'
import {
  Country,
  Gender,
  Language,
  Menu,
  Packet,
  PacketRole,
  Permission,
  Role,
  RolePermission,
  UserCompany
} from './generalTypes'
import { DateType } from 'src/types/forms/reactDatepickerTypes'

export interface RootState {
  layout: {
    logo: string | null
    icon: string | null
    title: string
    backgroundImages: string[] | null
    languages: Language[]
    ip: string | null
  }
  auth: {
    id: number | null
    roles: string[] | null
    user: Auth & { role?: string }
    email: string | null
    fullname: string
    username: string | null
    avatar: string | null
    accessToken: string
    userSettings: string[]
    permissions: string[]
    language: string
    userCompanies: UserCompany[]
    accumulatedTime: string
    lastEntryStatus: string
    nextEntry: string
    accessUser: number
    pin: number
    userAbsenceRole: string
    administrator: number
    contracts: Contract[]
    contract: Contract
    contractId: number
    geolocation: number
    remote: number
    captureEntry: number
    hours: string
    worked: string
    accumulated: string
    breaks: []
    comment: string
    contractedHours: string
    monthHours: string
    workedHours: string
    accumulatedHours: string
    month: number
    year: number
    notifications: []
    status: number
    managerUser: number
    mustChangePassword: boolean
    complianceRegistration: boolean
    skip2FaPrompt: boolean
    documentApprover: number
  }
  companySetting: {
    companySettings: CompanySetting[]
  }
  gender: {
    genders: Gender[]
  }
  country: {
    countries: Country[]
  }
  province: {
    id: number
    provinces: []
    provincesWithFestivals: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  population: {
    id: number
    populations: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  quoteGroup: {
    id: number | null
    quoteGroups: []
    searchText: string
  }
  user: {
    id: number | null
    users: User[]
    user: User
    usersId: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  collaborator: {
    id: number | null
    collaborators: []
  }
  contractType: {
    id: number | null
    contractTypes: ContractType[]
    contractType: ContractType
  }
  packet: {
    id: number | null
    packets: Packet[]
    packet: Packet
    searchText: string
  }
  contract: {
    id: number
    contracts: Contract[]
    contract: Contract
    groupId: number
    subgroupId: number
    contractTypeId: number
    startStartDateRange: DateType
    endStartDateRange: DateType
    startEndDateRange: DateType
    endEndDateRange: DateType
    activeContracts: Contract[]
  }
  userRole: {
    id: number
    userRoles: UserRole[]
    userRole: UserRole
  }
  userCommission: {
    id: number
    userCommissions: []
  }
  packetRole: {
    id: number
    packetRoles: PacketRole[]
  }
  role: {
    id: number
    roles: Role[]
    role: Role
    searchText: string
  }
  rolePermission: {
    id: number
    rolePermissions: RolePermission[]
  }
  permission: {
    id: number
    permissions: Permission[]
    permission: Permission
    searchText: string
  }
  general: {
    filterButtonClickCount: number
    showForm: boolean
    showImportDialog: boolean
    showCreateDialog: boolean
    showConfirmDialog: boolean
    showCommentDialog: boolean
    showPosponeDialog: boolean
    showRejectDialog: boolean
    showReopenDialog: boolean
    showLicenseDialog: boolean
    showApplyDialog: boolean
    zoom: boolean
    homeCustomizations: any[]
    legalTexts: string
  }
  document: {
    id: number
    documents: []
    selectedDocument: any
    filters: []
    appliedFilters: []
    modalOpen: string | boolean
    modalMode: string
  }
  documentType: {
    documentTypes: []
  }
  menu: {
    menu: Menu[]
  }
  professionalCategory: {
    id: number
    professionalCategories: []
    modalOpen: string
    modalMode: string
  }
  professionalArea: {
    id: number
    professionalCategories: []
    modalOpen: string
    modalMode: string
  }
  professionalFamily: {
    id: number
    professionalCategories: []
    modalOpen: string
    modalMode: string
  }
  companyType: {
    id: number
    companyTypes: []
    modalOpen: string
    modalMode: string
  }
  companyActivity: {
    id: number
    companyActivities: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  levelStudy: {
    id: number
    levelStudies: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  cnae: {
    id: number
    cnaes: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  student: {
    id: number
    students: []
    filters: []
    appliedFilters: []
    modalOpen: string
    modalMode: string
  }
  potentialStudent: {
    id: number
    potentialStudents: []
    filters: []
    appliedFilters: []
    modalOpen: string
    modalMode: string
  }
  teacher: {
    id: number
    teachers: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  teacherArea: {
    id: number
    teacherAreas: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  course: {
    id: number
    courses: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  courseType: {
    id: number
    courseTypes: []
    modalOpen: string
    modalMode: string
  }
  courseStatus: {
    id: number
    courseStatuses: []
    modalOpen: string
    modalMode: string
  }
  trainingAction: {
    id: number
    trainingActions: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  trainingContract: {
    id: number
    trainingContracts: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
    totalAmount: 0
    totalCalculatedHours: 0
    elements: []
    specialties: []
    certifications: []
  }
  trainingContractStatus: {
    id: number
    trainingContractStatuses: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  communityFestival: {
    id: number
    communityFestivals: []
    currentCommunityFestival: any
    modalOpen: string | boolean
    modalMode: string
    filters: []
    appliedFilters: []
  }
  populationFestival: {
    id: number
    populationFestivals: []
    currentPopulationFestival: any
    modalOpen: string | boolean
    modalMode: string
    filters: []
    appliedFilters: []
  }
  trainingContractBonus: {
    id: number
    trainingContractBonuses: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  center: {
    id: number
    centers: []
    modalOpen: string
    modalMode: string
  }
  advisor: {
    id: number
    advisors: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  advisorCommission: {
    id: number
    advisorCommissions: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  bill: {
    id: number
    bills: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
    showTable: boolean
  }
  trainingContractBill: {
    id: number
    trainingContractBills: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  profit: {
    id: number
    profits: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  tracing: {
    id: number
    tracings: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  liquidation: {
    id: number
    liquidations: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  chore: {
    id: number
    chores: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  company: {
    id: number
    companies: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
    showClientDialog: boolean
    showProviderDialog: boolean
    showAdvisorDialog: boolean
  }
  mainCompany: {
    id: number | null
    companies: []
    filters: []
    appliedFilters: []
    modalOpen: string | boolean
    modalMode: string
    selectedCompany: any
  }
  potentialCompany: {
    id: number
    companies: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  companyObservation: {
    id: number
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
    showEliminateDialog: boolean
  }
  excludedDay: {
    id: number
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
    showEliminateDialog: boolean
  }
  festival: {
    id: number
    showEliminateDialog: boolean
  }
  excludedDayType: {
    id: number
    excludedDayTypes: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
    showEliminateDialog: boolean
  }
  companyIncidence: {
    id: number
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
    showEliminateDialog: boolean
  }
  incidenceType: {
    id: number
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  credit: {
    id: number
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
    showEliminateDialog: boolean
  }
  modality: {
    id: number
    modalities: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  certification: {
    id: number | null
    name: string
    certifications: []
    modalOpen: boolean
    modalMode: string
    filters: {
      code: string
      name: string
    }
    appliedFilters: {
      code: string
      name: string
    }
  }
  module: {
    id: number | null
    name: string
    modules: []
    modalOpen: boolean
    modalMode: string
    filters: {
      code: string
      name: string
    }
    appliedFilters: {
      code: string
      name: string
    }
  }
  trainingUnit: {
    id: number | null
    name: string
    trainingUnits: []
    modalOpen: boolean
    modalMode: string
    filters: {
      code: string
      name: string
    }
    appliedFilters: {
      code: string
      name: string
    }
  }
  provider: {
    id: number
    providers: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  courseOrigin: {
    id: number
    courseOrigins: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  actionType: {
    id: number
    actionTypes: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  trainingActionLevel: {
    id: number
    trainingActionLevels: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  trainingActionGroup: {
    id: number
    trainingActionGroups: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  tutoring: {
    id: number
    tutorings: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  webPlatform: {
    id: number
    webPlatforms: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  occupation: {
    id: number
    occupations: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  onLeave: {
    id: number
    onLeaves: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  examTutorial: {
    id: number
    examTutorials: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
  registration: {
    id: number
    registrations: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
    showEliminateDialog: boolean
  }
  payment: {
    id: number
    payments: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
    showEliminateDialog: boolean
  }
  trainingContractIncidence: {
    id: number
    trainingContractIncidences: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
    showEliminateDialog: boolean
  }
  nacionalFestival: {
    id: number
    nacionalFestivals: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
    showEliminateDialog: boolean
  }
  trainingContractSerie: {
    id: number
    trainingContractSeries: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
    showEliminateDialog: boolean
  }
  community: {
    id: number
    communities: []
    modalOpen: string
    modalMode: string
    filters: []
    appliedFilters: []
  }
}
