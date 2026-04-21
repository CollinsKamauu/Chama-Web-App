export type SidebarSupportItem = {
  /** Shown when the item is not active (or only icon when `iconActive` omitted). */
  icon: string
  /** When set and the route is active, sidebar uses this icon (e.g. Settings). */
  iconActive?: string
  label: string
  /** When set, sidebar entry is a client-side link (e.g. Settings). */
  to?: string
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
    to: '/finances',
    iconActive: '/dashboard-icons/Finances Active.svg',
    iconInactive: '/dashboard-icons/Finances Inactive.svg',
  },
  {
    label: 'Transfer Funds',
    to: '/transfer-funds',
    iconActive: '/dashboard-icons/Fund Transfer Active.svg',
    iconInactive: '/dashboard-icons/Fund Transfer Inactive.svg',
  },
]

export const SIDEBAR_SUPPORT_ITEMS: SidebarSupportItem[] = [
  {
    icon: '/dashboard-icons/Settings Inactive.svg',
    iconActive: '/dashboard-icons/Settings Active.svg',
    label: 'Settings',
    to: '/settings',
  },
  {
    icon: '/dashboard-icons/Invite Code.svg',
    iconActive: '/dashboard-icons/Invite Code Active.svg',
    label: 'Create Invite Code',
    to: '/create-invite-code',
  },
  {
    icon: '/dashboard-icons/Sign Out Inactive 1.svg',
    label: 'Log out',
  },
]

export function isMainNavItemActive(pathname: string, item: SidebarMainNavItem): boolean {
  if (!item.to) return false
  if (item.to === '/') return pathname === '/'
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export function isSupportNavItemActive(pathname: string, item: SidebarSupportItem): boolean {
  if (!item.to) return false
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}


