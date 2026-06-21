import { useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'

export default function Layout() {
  const { isAuth } = useAuthStore()
  const { dark, sidebarOpen } = useUIStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  if (!isAuth) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-950 flex">
      <Sidebar />
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-39 bg-black/60"
          onClick={() => useUIStore.getState().setSidebar(false)} />
      )}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarOpen ? 'lg:ml-56' : 'lg:ml-14'}`}>
        <TopBar />
        <main className="flex-1 p-4 overflow-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
