import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FilePlus2, ClipboardList, Users, Package, Settings, LogOut, ChevronLeft, Zap, Briefcase } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { BILL_TYPES } from '../../utils'

const NAV = [
  { to:'/dashboard',  icon: LayoutDashboard, label:'Dashboard' },
  { to:'/bills/new',  icon: FilePlus2,        label:'New Bill'  },
  { to:'/bills',      icon: ClipboardList,    label:'Bill History' },
  { to:'/customers',  icon: Users,            label:'Customers' },
  { to:'/products',   icon: Package,          label:'Products'  },
  { to:'/labors',     icon: Briefcase,        label:'Labors'    },
  { to:'/settings',   icon: Settings,         label:'Settings'  },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-brand-900 border-r border-brand-700 transition-all duration-300 ${sidebarOpen ? 'w-56' : 'w-14'}`}>

      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-brand-700">
        {sidebarOpen && (
          <div className="animate-fade-in">
            <div className="text-xl font-black tracking-widest text-gold-400 leading-none">⚜ NN</div>
            <div className="text-[9px] text-brand-400 tracking-widest mt-0.5">BILLING SYSTEM</div>
          </div>
        )}
        <button onClick={toggleSidebar} className="p-1.5 rounded text-brand-400 hover:text-gold-400 hover:bg-brand-800 transition-colors ml-auto">
          <ChevronLeft size={16} className={`transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `sidebar-btn ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center !px-2' : ''}`
            }>
            <Icon size={16} className="flex-shrink-0" />
            {sidebarOpen && <span className="animate-fade-in truncate">{label}</span>}
          </NavLink>
        ))}

        {/* Quick Create */}
        {sidebarOpen && (
          <div className="pt-3">
            <div className="text-[9px] text-brand-600 tracking-widest font-bold px-2 pb-1">QUICK CREATE</div>
            {Object.entries(BILL_TYPES).map(([k, bt]) => (
              <button key={k} onClick={() => navigate(`/bills/new?type=${k}`)}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-brand-400 hover:text-gold-400 rounded transition-colors">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: bt.color }} />
                {bt.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* User Footer */}
      <div className="border-t border-brand-700 p-2">
        {sidebarOpen ? (
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-brand-900 font-black text-xs flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-brand-400 truncate">{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="p-1 text-brand-500 hover:text-red-400 transition-colors" title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} className="w-full flex justify-center p-2 text-brand-500 hover:text-red-400 transition-colors" title="Logout">
            <LogOut size={14} />
          </button>
        )}
      </div>
    </aside>
  )
}
