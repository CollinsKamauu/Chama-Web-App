export type SidebarSupportItem = {
  icon: string
  label: string
}

export type SidebarMainNavItem = {
  label: string
  /** When set, sidebar entry is a client-side link and can show active state. */
  to?: string
  iconActive: string
  iconInactive: string
}

export const SIDEBAR_MAIN_NAV: SidebarMainNavItem[] = [
  {
    label: 'Dashboard',
    to: '/',
    iconActive: '/dashboard-icons/Dashboard Active.svg',
    iconInactive: '/dashboard-icons/Dashboard Inactive.svg',
  },
  {
    label: 'Contributions',
    to: '/contributions',
    iconActive: '/dashboard-icons/Contributions Active.svg',
    iconInactive: '/dashboard-icons/Contributions Inactive.svg',
  },
  {
    label: 'Members',
    to: '/members',
    iconActive: '/dashboard-icons/Members Active.svg',
    iconInactive: '/dashboard-icons/Members Inactive.svg',
  },
  {
    label: 'Finances',
    iconActive: '/dashboard-icons/Finances Inactive.svg',
    iconInactive: '/dashboard-icons/Finances Inactive.svg',
  },
  {
    label: 'Transfer Funds',
    iconActive: '/dashboard-icons/Fund Transfer Inactive.svg',
    iconInactive: '/dashboard-icons/Fund Transfer Inactive.svg',
  },
]

export const SIDEBAR_SUPPORT_ITEMS: SidebarSupportItem[] = [
  {
    icon: '/dashboard-icons/Settings Inactive.svg',
    label: 'Settings',
  },
  {
    icon: '/dashboard-icons/Invite Code.svg',
    label: 'Create Invite Code',
  },
  {
    icon: '/dashboard-icons/Sign Out Inactive 1.svg',
    label: 'Log out',
  },
]

export function isMainNavItemActive(pathname: string, item: SidebarMainNavItem): boolean {
  if (!item.to) return false
  if (item.to === '/') return pathname === '/'
  return pathname === item.to
}
