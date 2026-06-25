// reducers/store.ts
import { configureStore } from '@reduxjs/toolkit'
import LayoutReducer from './general/LayoutReducer'
import AuthReducer from './users/AuthReducer'
import GenderReducer from './general/GenderReducer'
import CountryReducer from './general/CountryReducer'
import CompanyReducer from './company/CompanyReducer'
import QuoteGroupReducer from './general/QuoteGroupReducer'
import UserReducer from './users/UserReducer'
import RoleReducer from './management/RoleReducer'
import UserRoleReducer from './users/UserRoleReducer'
import RolePermissionReducer from './general/RolePermissionReducer'
import PermissionReducer from './management/PermissionReducer'
import GeneralReducer from './general/GeneralReducer'
import MainCompanyReducer from './management/MainCompanyReducer'
import MenuReducer from './general/MenuReducer'
import ProfessionalCategoryReducer from './general/ProfessionalCategoryReducer'
import LevelStudyReducer from './general/LevelStudyReducer'
import CompanyTypeReducer from './company/CompanyTypeReducer'
import CompanyObservationReducer from './company/CompanyObservationReducer'
import CompanyActivityReducer from './company/CompanyActivityReducer'
import CompanyIncidenceReducer from './company/CompanyIncidenceReducer'
import IncidenceTypeReducer from './company/IncidenceTypeReducer'
import CnaeReducer from './general/CnaeReducer'
import StudentReducer from './students/StudentReducer'
import TeacherReducer from './teachers/TeacherReducer'
import TeacherAreaReducer from './teachers/TeacherAreaReducer'
import CourseReducer from './courses/CourseReducer'
import CourseTypeReducer from './courses/CourseTypeReducer'
import CourseStatusReducer from './courses/CourseStatusReducer'
import RegistrationReducer from './courses/RegistrationReducer'
import TrainingActionReducer from './trainingActions/TrainingActionReducer'
import ActionTypeReducer from './trainingActions/ActionTypeReducer'
import TrainingActionLevelReducer from './trainingActions/TrainingActionLevelReducer'
import TrainingActionGroupReducer from './trainingActions/TrainingActionGroupReducer'
import TutoringReducer from './trainingActions/TutoringReducer'
import WebPlatformReducer from './trainingActions/WebPlatformReducer'
import TrainingContractReducer from './trainingContracts/TrainingContractReducer'
import TrainingContractStatusReducer from './trainingContracts/TrainingContractStatusReducer'
import CenterReducer from './centers/CenterReducer'
import AdvisorReducer from './advisors/AdvisorReducer'
import AdvisorCommissionReducer from './advisors/AdvisorCommissionReducer'
import BillReducer from './bills/BillReducer'
import TrainingContractBillReducer from './bills/TrainingContractBillReducer'
import TracingReducer from './tracings/TracingReducer'
import LiquidationReducer from './liquidations/LiquidationReducer'
import ChoreReducer from './chores/ChoreReducer'
import PopulationReducer from './general/PopulationReducer'
import CollaboratorReducer from './users/CollaboratorReducer'
import ProfessionalAreaReducer from './general/ProfessionalAreaReducer'
import ProfessionalFamilyReducer from './general/ProfessionalFamilyReducer'
import ModalityReducer from './general/ModalityReducer'
import CertificationReducer from './general/CertificationReducer'
import ModuleReducer from './general/ModuleReducer'
import TrainingUnitReducer from './general/TrainingUnitReducer'
import ProviderReducer from './company/ProviderReducer'
import CreditReducer from './company/CreditReducer'
import CourseOriginReducer from './courses/CourseOriginReducer'
import ProfitReducer from './profits/ProfitReducer'
import OccupationReducer from './trainingContracts/OccupationsReducer'
import OnLeaveReducer from './trainingContracts/OnLeaveReducer'
import ExamTutorialReducer from './trainingContracts/ExamTutorialReducer'
import PaymentReducer from './general/PaymentReducer'
import ExcludedDayReducer from './trainingContracts/ExcludedDayReducer'
import ExcludedDayTypeReducer from './trainingContracts/ExcludedDayTypeReducer'
import FestivalReducer from './trainingContracts/FestivalReducer'
import CommunityReducer from './trainingContracts/CommunityReducer'
import ProvinceReducer from './general/ProvinceReducer'
import TrainingContractIncidenceReducer from './trainingContracts/TrainingContractIncidenceReducer'
import TrainingContractBonusReducer from './trainingContracts/TrainingContractBonusReducer'
import PotentialCompanyReducer from './company/PotentialCompanyReducer'
import PotentialStudentReducer from './students/PotentialStudentReducer'
import UserCommissionReducer from './users/UserCommissionReducer'
import TrainingContractSerieReducer from './trainingContracts/TrainingContractSerieReducer'
import NacionalFestivalReducer from './trainingContracts/NacionalFestivalReducer'
import CommunityFestivalReducer from './trainingContracts/CommunityFestivalReducer'
import PopulationFestivalReducer from './trainingContracts/PopulationFestivalReducer'
import CompanySettingReducer from './company/CompanySettingReducer'
import DocumentReducer from './general/DocumentReducer'
import DocumentTypeReducer from './general/DocumentTypeReducer'

const store = configureStore({
  reducer: {
    layout: LayoutReducer,
    auth: AuthReducer,
    gender: GenderReducer,
    country: CountryReducer,
    province: ProvinceReducer,
    quoteGroup: QuoteGroupReducer,
    user: UserReducer,
    role: RoleReducer,
    company: CompanyReducer,
    userRole: UserRoleReducer,
    rolePermission: RolePermissionReducer,
    permission: PermissionReducer,
    general: GeneralReducer,
    document: DocumentReducer,
    documentType: DocumentTypeReducer,
    mainCompany: MainCompanyReducer,
    menu: MenuReducer,
    professionalCategory: ProfessionalCategoryReducer,
    levelStudy: LevelStudyReducer,
    companyType: CompanyTypeReducer,
    companyActivity: CompanyActivityReducer,
    cnae: CnaeReducer,
    student: StudentReducer,
    teacher: TeacherReducer,
    teacherArea: TeacherAreaReducer,
    course: CourseReducer,
    courseType: CourseTypeReducer,
    courseStatus: CourseStatusReducer,
    trainingAction: TrainingActionReducer,
    trainingContract: TrainingContractReducer,
    trainingContractStatus: TrainingContractStatusReducer,
    center: CenterReducer,
    advisor: AdvisorReducer,
    advisorCommission: AdvisorCommissionReducer,
    bill: BillReducer,
    tracing: TracingReducer,
    liquidation: LiquidationReducer,
    chore: ChoreReducer,
    population: PopulationReducer,
    collaborator: CollaboratorReducer,
    professionalArea: ProfessionalAreaReducer,
    professionalFamily: ProfessionalFamilyReducer,
    modality: ModalityReducer,
    certification: CertificationReducer,
    module: ModuleReducer,
    trainingUnit: TrainingUnitReducer,
    provider: ProviderReducer,
    courseOrigin: CourseOriginReducer,
    profit: ProfitReducer,
    companyObservation: CompanyObservationReducer,
    companyIncidence: CompanyIncidenceReducer,
    incidenceType: IncidenceTypeReducer,
    credit: CreditReducer,
    actionType: ActionTypeReducer,
    trainingActionLevel: TrainingActionLevelReducer,
    trainingActionGroup: TrainingActionGroupReducer,
    tutoring: TutoringReducer,
    webPlatform: WebPlatformReducer,
    occupation: OccupationReducer,
    onLeave: OnLeaveReducer,
    examTutorial: ExamTutorialReducer,
    registration: RegistrationReducer,
    payment: PaymentReducer,
    trainingContractBill: TrainingContractBillReducer,
    excludedDay: ExcludedDayReducer,
    excludedDayType: ExcludedDayTypeReducer,
    festival: FestivalReducer,
    community: CommunityReducer,
    trainingContractIncidence: TrainingContractIncidenceReducer,
    trainingContractBonus: TrainingContractBonusReducer,
    potentialCompany: PotentialCompanyReducer,
    potentialStudent: PotentialStudentReducer,
    userCommission: UserCommissionReducer,
    trainingContractSerie: TrainingContractSerieReducer,
    nacionalFestival: NacionalFestivalReducer,
    communityFestival: CommunityFestivalReducer,
    populationFestival: PopulationFestivalReducer,
    companySetting: CompanySettingReducer
  }
})

export default store
