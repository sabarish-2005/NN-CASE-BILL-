import { useLocation } from 'react-router-dom'
import { Menu, Sun, Moon, Bell } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'

const TITLES = {
  '/dashboard':  'Dashboard',
  '/bills':      'Bill History',
  '/bills/new':  'New Bill',
  '/customers':  'Customers',
  '/products':   'Products',
  '/labors':     'Labors',
  '/settings':   'Settings',
}

export default function TopBar() {
  const { dark, toggleDark, setSidebar } = useUIStore()
  const { user } = useAuthStore()
  const { pathname } = useLocation()
  const title = TITLES[pathname] || (pathname.includes('/bills/') ? 'Bill Details' : 'Billing System')

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 h-14 px-4 bg-white dark:bg-brand-900 border-b-2 border-gold-400/50 dark:border-gold-600/50">
      {/* Mobile menu */}
      <button onClick={() => setSidebar(true)} className="lg:hidden p-1.5 rounded text-gray-500 hover:text-gray-700 dark:text-brand-400">
        <Menu size={20} />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-black tracking-widest text-gold-500 uppercase">NACHIMUTHU NATRAYAN</div>
        <div className="text-base font-bold text-gray-900 dark:text-white leading-tight">{title}</div>
      </div>

      {/* Date */}
      <div className="hidden sm:block text-xs text-gray-400 dark:text-brand-400">
        {new Date().toLocaleDateString('en-IN', { weekday:'short', day:'2-digit', month:'short', year:'numeric' })}
      </div>

      {/* Dark toggle */}
      <button onClick={toggleDark}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-200 dark:border-brand-600 text-xs font-bold text-gray-600 dark:text-gold-400 bg-transparent hover:border-gold-400 transition-colors">
        {dark ? <Sun size={13} /> : <Moon size={13} />}
        <span className="hidden sm:inline">{dark ? 'Light' : 'Dark'}</span>
      </button>
    </header>
  )
}
