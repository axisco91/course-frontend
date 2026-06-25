// ** Type import
import { VerticalNavItemsType } from 'src/@core/layouts/types'
import { Menu } from 'src/reducers/types/generalTypes'

// ---- Tipos auxiliares locales para tipar items y permitir children recursivo
type NavItem = {
  title?: string
  sectionTitle?: string
  path?: string
  icon?: string
  subject?: string
  requiredPermissions?: string[]
  children?: NavItem[]
  [key: string]: any
}

// ---- Aplica overrides de UI (igual que tu función actual, con tipado)
const applyUIData = (menu: NavItem[], uiData: unknown): NavItem[] => {
  const arrayData = Array.isArray(uiData) ? uiData : (uiData as any)?.menu || []
  const uiMap = Object.fromEntries(arrayData.map((item: any) => [item.path, item]))

  return menu.map(item => {
    const updatedItem: NavItem = { ...item }

    if ('path' in item && item.path && uiMap[item.path]) {
      Object.assign(updatedItem, uiMap[item.path])
    }

    if ('children' in item && Array.isArray(item.children)) {
      updatedItem.children = applyUIData(item.children, uiData)
    }

    return updatedItem
  })
}

// ---- Helpers de permisos
const hasAnyPermission = (required: string[] | undefined, userPermissions: string[] = []) => {
  if (!required || required.length === 0) return true

  return required.some(p => userPermissions.includes(p))
}

/**
 * Filtra recursivamente por permisos.
 * - Si el item tiene hijos, los filtra primero.
 * - Conserva el padre si:
 *    a) él mismo tiene permisos, o
 *    b) aunque no los tenga, le quedan hijos visibles.
 */
// Si un item no define requiredPermissions, hereda las del padre.
const filterByPermissions = (
  items: NavItem[],
  userPermissions: string[],
  inheritedRequired?: string[] | null
): NavItem[] => {
  return items.reduce<NavItem[]>((acc, item) => {
    const effectiveRequired = item.requiredPermissions ?? inheritedRequired ?? []
    const selfAllowed = hasAnyPermission(effectiveRequired, userPermissions)

    // Si el padre no está permitido, ni él ni su subtree se muestran
    if (!selfAllowed) return acc

    const hasChildren = Array.isArray(item.children)
    const filteredChildren = hasChildren ? filterByPermissions(item.children, userPermissions, effectiveRequired) : undefined

    if (hasChildren && !item.path && filteredChildren?.length === 0) return acc

    acc.push({
      ...item,
      ...(filteredChildren ? { children: filteredChildren } : { children: undefined })
    })

    return acc
  }, [])
}

// ↑ Para evitar repetir todo el gigantesco menú dos veces, **no** usamos `buildBaseMenu`.
//   A continuación pegamos tu `baseMenu` tal cual dentro de `navigation()`.

// ---- FUNCIÓN principal
const navigation = (userPermissions: string[], menuUIData: Menu[]): VerticalNavItemsType => {
  // === TU MENÚ BASE – pegado tal cual (no toco textos, paths ni requiredPermissions) ===
  const baseMenu: NavItem[] = [
    {
      title: 'Students',
      path: '/students',
      subject: 'students-page',
      icon: 'tabler:school',
      requiredPermissions: ['read.students']
    },
    {
      title: 'Teachers',
      path: '/teachers',
      subject: 'teachers-page',
      icon: 'tabler:chalkboard',
      requiredPermissions: ['read.teachers']
    },
    {
      title: 'Companies',
      path: '/companies',
      subject: 'companies-page',
      icon: 'tabler:building',
      requiredPermissions: ['read.companies']
    },
    {
      title: 'Advisors',
      path: '/advisors',
      subject: 'advisors-page',
      icon: 'tabler:briefcase',
      requiredPermissions: ['read.advisors']
    },
    {
      title: 'Training Actions',
      path: '/training-actions',
      subject: 'advisors-page',
      icon: 'tabler:books',
      requiredPermissions: ['read.training_actions']
    },
    {
      title: 'Training Contracts',
      path: '/training-contracts',
      subject: 'trainong-contracts-page',
      icon: 'tabler:file-description',
      requiredPermissions: ['read.training_contracts']
    },
    {
      title: 'Courses',
      path: '/courses',
      subject: 'courses-page',
      icon: 'tabler:book',
      requiredPermissions: ['read.courses']
    },
    {
      title: 'Chores',
      path: '/chores',
      subject: 'chores-page',
      icon: 'tabler:checklist',
      requiredPermissions: ['read.chores']
    },
    {
      title: 'Tracings',
      path: '/tracings',
      subject: 'tracings-page',
      icon: 'tabler:timeline',
      requiredPermissions: ['read.tracings']
    },
    {
      title: 'Bills',
      path: '/bills',
      subject: 'bills-page',
      icon: 'tabler:file-invoice',
      requiredPermissions: ['read.bills']
    },
    {
      title: 'Profits',
      path: '/profits',
      subject: 'profits-page',
      icon: 'tabler:chart-line',
      requiredPermissions: ['read.profits']
    },
    {
      title: 'Liquidations',
      path: '/liquidations',
      subject: 'liquidations-page',
      icon: 'tabler:cash',
      requiredPermissions: ['read.liquidations']
    },
    {
      title: 'Potential Students',
      path: '/potential-students',
      subject: 'potential-students-page',
      icon: 'tabler:user-search',
      requiredPermissions: ['read.potential_students']
    },
    {
      title: 'Potential Companies',
      path: '/potential-companies',
      subject: 'potential-companies-page',
      icon: 'tabler:building-plus',
      requiredPermissions: ['read.potential_companies']
    },
    {
      title: 'Management',
      icon: 'tabler:settings',
      children: [
        {
          title: 'Users',
          icon: 'tabler:user-cog',
          children: [
            {
              title: 'Users',
              path: '/users',
              subject: 'users-page',
              requiredPermissions: ['read.users']
            },
            {
              title: 'Roles',
              path: '/general-settings/roles',
              subject: 'roles-page',
              requiredPermissions: ['global.roles.index']
            },
            {
              title: 'Permissions',
              path: '/general-settings/permissions',
              subject: 'permissions-page',
              requiredPermissions: ['global.roles.index']
            },
            {
              title: 'Access Logs',
              path: '/general-settings/access-logs',
              subject: 'access-logs-page',
              requiredPermissions: ['global.generalSettings.index']
            }
          ]
        },
        {
          title: 'Certifications',
          icon: 'tabler:certificate',
          children: [
            {
              title: 'Certifications',
              path: '/certifications',
              subject: 'certifications-page'
            },
            {
              title: 'Modules',
              path: '/modules',
              subject: 'modules-page'
            },
            {
              title: 'Training Units',
              path: '/training-units',
              subject: 'training-units-page'
            }
          ],
          requiredPermissions: ['read.management']
        },
        {
          title: 'Students',
          icon: 'tabler:users-group',
          children: [
            {
              title: 'Professional Categories',
              path: '/professional-categories',
              subject: 'professional-categories-page'
            },
            {
              title: 'Level Studies',
              path: '/level-studies',
              subject: 'level-studies-page'
            }
          ],
          requiredPermissions: ['read.management']
        },
        {
          title: 'Teachers',
          icon: 'tabler:chalkboard',
          children: [
            {
              title: 'Teacher Areas',
              path: '/teacher-areas',
              subject: 'teacher-areas-page'
            }
          ],
          requiredPermissions: ['read.management']
        },
        {
          title: 'Companies',
          icon: 'tabler:building-factory-2',
          children: [
            {
              title: 'Cnaes',
              path: '/cnaes',
              subject: 'cnaes-page'
            },
            {
              title: 'Company Types',
              path: '/company-types',
              subject: 'company-types-page'
            },
            {
              title: 'Providers',
              path: '/providers',
              subject: 'providers-page'
            },
            {
              title: 'Centers',
              path: '/centers',
              subject: 'centers-page'
            }
          ],
          requiredPermissions: ['read.management']
        },
        {
          title: 'Incidences',
          icon: 'tabler:alert-circle',
          children: [
            {
              title: 'Incidence Types',
              path: '/incidence-types',
              subject: 'incidence-types-page'
            }
          ],
          requiredPermissions: ['read.management']
        },
        {
          title: 'Formative Actions',
          icon: 'tabler:books',
          children: [
            {
              title: 'Professional Areas',
              path: '/professional-areas',
              subject: 'professional-areas-page'
            },
            {
              title: 'Action Types',
              path: '/action-types',
              subject: 'action-types-page'
            },
            {
              title: 'Professional Families',
              path: '/professional-families',
              subject: 'professional-families-page'
            },
            {
              title: 'Modalities',
              path: '/modalities',
              subject: 'modalities-page'
            },
            {
              title: 'Training Action Levels',
              path: '/training-action-levels',
              subject: 'training-action-levels-page'
            },
            {
              title: 'Training Action Groups',
              path: '/training-action-groups',
              subject: 'training-action-groups-page'
            },
            {
              title: 'Tutorings',
              path: '/tutorings',
              subject: 'tutorings-page'
            },
            {
              title: 'Web Platforms',
              path: '/web-platforms',
              subject: 'web-platforms-page'
            }
          ],
          requiredPermissions: ['read.management']
        },
        {
          title: 'Bills',
          icon: 'tabler:file-invoice',
          children: [
            {
              title: 'Payments',
              path: '/payments',
              subject: 'payments-page'
            },
            {
              title: 'Series',
              path: '/series',
              subject: 'series-page'
            }
          ],
          requiredPermissions: ['read.management']
        },
        {
          title: 'Documents',
          icon: 'tabler:files',
          children: [
            {
              title: 'Document Types',
              path: '/document-types',
              subject: 'document-types-page'
            }
          ],
          requiredPermissions: ['read.management']
        },
        {
          title: 'Training Contracts',
          icon: 'tabler:file-description',
          children: [
            {
              title: 'Training Contract Statuses',
              path: '/training-contract-statuses',
              subject: 'training-contract-statuses-page'
            },
            {
              title: 'Occupations',
              path: '/occupations',
              subject: 'occupations-page'
            },
            {
              title: 'On Leave Types',
              path: '/on-leave-types',
              subject: 'on-leave-types-page'
            },
            {
              title: 'Festivals',
              path: '/festivals',
              subject: 'nacional-festivals-page'
            },
            {
              title: 'Community Festivals',
              path: '/community-festivals',
              subject: 'community-festivals-page'
            },
            {
              title: 'Population Festivals',
              path: '/population-festivals',
              subject: 'population-festivals-page'
            },
            {
              title: 'Populations',
              path: '/populations',
              subject: 'populations-page'
            },
            {
              title: 'Communities',
              path: '/communities',
              subject: 'communities-page'
            }
          ],
          requiredPermissions: ['read.management']
        },
        {
          title: 'Companies',
          icon: 'tabler:files',
          children: [
            {
              title: 'Companies',
              path: '/main-companies',
              subject: 'main-companies-page'
            }
          ],
          requiredPermissions: ['read.main_companies']
        }
      ]
    }
  ]

  // 1) Aplica overrides de UI
  const enrichedMenu = applyUIData(baseMenu, menuUIData)

  // 2) Filtro por permisos (RECURSIVO)
  const finalMenu = filterByPermissions(enrichedMenu, userPermissions)

  return finalMenu as VerticalNavItemsType
}

export default navigation
