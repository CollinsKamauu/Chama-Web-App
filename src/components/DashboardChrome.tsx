import { type MouseEvent, type ReactNode, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  isMainNavItemActive,
  isSupportNavItemActive,
  SIDEBAR_MAIN_NAV,
  SIDEBAR_SUPPORT_ITEMS,
} from '../dashboard/navConfig'
import { useAuth } from '../context/AuthContext'

const SETTINGS_SIDEBAR_ITEM = SIDEBAR_SUPPORT_ITEMS.find((i) => i.label === 'Settings')
const INVITE_SIDEBAR_ITEM = SIDEBAR_SUPPORT_ITEMS.find((i) => i.label === 'Create Invite Code')

export type DashboardChromeProps = {
  children: ReactNode
  profileName: string
  onLogout: (evt?: MouseEvent<HTMLButtonElement>) => void
}

export function DashboardChrome({ children, profileName, onLogout }: DashboardChromeProps) {
  const { chamaOrganizationName } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!mobileMenuOpen) return undefined
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileMenuOpen])

  return (
    <div className="dashboardPage">
      <aside className="dashboardSidebar">
        <div className="sidebarBrand">
          <img src="/dashboard-icons/Chama App Demo Logo.svg" alt="" />
          <span>Chama App</span>
        </div>

        <div className="sidebarSection">
          <span className="sectionLabel">GENERAL</span>
          <nav className="menuList">
            {SIDEBAR_MAIN_NAV.map((item) => {
              const active = isMainNavItemActive(location.pathname, item)
              const icon = active ? item.iconActive : item.iconInactive
              const className = `menuItem${active ? ' active' : ''}`
              if (item.to) {
                return (
                  <Link key={item.label} to={item.to} className={className}>
                    <img src={icon} alt="" />
                    <span>{item.label}</span>
                  </Link>
                )
              }
              return (
                <button key={item.label} type="button" className={className}>
                  <img src={icon} alt="" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="sidebarSection support">
          <span className="sectionLabel">SUPPORT</span>
          <nav className="menuList">
            {SIDEBAR_SUPPORT_ITEMS.map((item) => {
              if (item.label === 'Log out') {
                return (
                  <button key={item.label} type="button" className="menuItem" onClick={onLogout}>
                    <img src={item.icon} alt="" />
                    <span>{item.label}</span>
                  </button>
                )
              }
              if (item.to) {
                const active = isSupportNavItemActive(location.pathname, item)
                const supportIcon = active && item.iconActive ? item.iconActive : item.icon
                return (
                  <Link key={item.label} to={item.to} className={`menuItem${active ? ' active' : ''}`}>
                    <img src={supportIcon} alt="" />
                    <span>{item.label}</span>
                  </Link>
                )
              }
              return (
                <button key={item.label} type="button" className="menuItem">
                  <img src={item.icon} alt="" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </aside>

      <section className="dashboardMain">
        <header className="mainHeader">
          <div className="mobileHeaderBrand">
            <Link className="mobileBrand" to="/" aria-label="Go to homepage">
              <img src="/dashboard-icons/Chama App Demo Logo.svg" alt="Chama App" />
              <span>Chama App</span>
            </Link>
            <button
              type="button"
              className="mobileMenuButton"
              aria-label="Open navigation"
              aria-haspopup="menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M4 6h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <h1>{chamaOrganizationName}</h1>
          <div className="searchWrap">
            <img src="/dashboard-icons/search.svg" alt="" />
            <input type="text" placeholder="Search" />
          </div>
          <div className="userInfo">
            <img className="userAvatar" src="/dashboard-icons/Account.svg" alt="" aria-hidden="true" />
            <div>
              <p className="userName">{profileName}</p>
              <p className="userRole">Treasurer</p>
            </div>
          </div>
        </header>

        {mobileMenuOpen ? (
          <div className="mobileMenuOverlay" role="presentation">
            <button
              type="button"
              className="mobileMenuBackdrop"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="mobileMenuPanel" role="menu" aria-label="Mobile menu">
              <div className="mobileMenuHeader">
                <Link
                  className="mobileBrand"
                  to="/"
                  aria-label="Go to homepage"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <img src="/dashboard-icons/Chama App Demo Logo.svg" alt="Chama App" />
                  <span>Chama App</span>
                </Link>
                <button
                  type="button"
                  className="mobileMenuClose"
                  aria-label="Close menu"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="mobileMenuItems">
                <Link
                  className="mobileMenuItem"
                  role="menuitem"
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <img
                    src={
                      SETTINGS_SIDEBAR_ITEM &&
                      SETTINGS_SIDEBAR_ITEM.to &&
                      isSupportNavItemActive(location.pathname, SETTINGS_SIDEBAR_ITEM) &&
                      SETTINGS_SIDEBAR_ITEM.iconActive
                        ? SETTINGS_SIDEBAR_ITEM.iconActive
                        : (SETTINGS_SIDEBAR_ITEM?.icon ?? '/dashboard-icons/Settings Inactive.svg')
                    }
                    alt=""
                    aria-hidden="true"
                  />
                  <span>Settings</span>
                </Link>
                <Link
                  className={`mobileMenuItem${location.pathname === '/create-invite-code' ? ' mobileMenuItemActive' : ''}`}
                  role="menuitem"
                  to="/create-invite-code"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <img
                    src={
                      INVITE_SIDEBAR_ITEM &&
                      INVITE_SIDEBAR_ITEM.to &&
                      isSupportNavItemActive(location.pathname, INVITE_SIDEBAR_ITEM) &&
                      INVITE_SIDEBAR_ITEM.iconActive
                        ? INVITE_SIDEBAR_ITEM.iconActive
                        : (INVITE_SIDEBAR_ITEM?.icon ?? '/dashboard-icons/Invite Code.svg')
                    }
                    alt=""
                    aria-hidden="true"
                  />
                  <span>Create Invite Code</span>
                </Link>
                <button
                  type="button"
                  className="mobileMenuItem"
                  role="menuitem"
                  onClick={(e) => {
                    setMobileMenuOpen(false)
                    onLogout(e)
                  }}
                >
                  <img src="/dashboard-icons/Sign Out Inactive 1.svg" alt="" aria-hidden="true" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {children}
      </section>

      <nav className="mobileNav" aria-label="Primary navigation">
        <Link
          to="/contributions"
          className={`mobileNavItem${location.pathname === '/contributions' ? ' mobileNavItemActive' : ''}`}
        >
          <img
            src={
              location.pathname === '/contributions'
                ? '/dashboard-icons/Contributions Active.svg'
                : '/dashboard-icons/Contributions Inactive.svg'
            }
            alt=""
            aria-hidden="true"
          />
          <span>Contributions</span>
        </Link>
        <Link
          to="/finances"
          className={`mobileNavItem${location.pathname === '/finances' ? ' mobileNavItemActive' : ''}`}
        >
          <img
            src={
              location.pathname === '/finances'
                ? '/dashboard-icons/Finances Active.svg'
                : '/dashboard-icons/Finances Inactive.svg'
            }
            alt=""
            aria-hidden="true"
          />
          <span>Finances</span>
        </Link>
        <Link
          to="/transfer-funds"
          className={`mobileNavItem${location.pathname === '/transfer-funds' ? ' mobileNavItemActive' : ''}`}
        >
          <img src="/dashboard-icons/Fund Transfer Inactive.svg" alt="" aria-hidden="true" />
          <span>Transfer Funds</span>
        </Link>
        <Link
          to="/members"
          className={`mobileNavItem${location.pathname === '/members' ? ' mobileNavItemActive' : ''}`}
        >
          <img
            src={
              location.pathname === '/members'
                ? '/dashboard-icons/Members Active.svg'
                : '/dashboard-icons/Members Inactive.svg'
            }
            alt=""
            aria-hidden="true"
          />
          <span>Members</span>
        </Link>
      </nav>
    </div>
  )
}
