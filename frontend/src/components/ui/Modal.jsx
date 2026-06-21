import { useEffect } from 'react'
import { X } from 'lucide-react'
export default function Modal({ open, onClose, title, children, size='md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  if (!open) return null
  const w = { sm:'max-w-sm', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl', full:'max-w-6xl' }[size]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
      <div className={`w-full ${w} bg-white dark:bg-brand-900 rounded-xl border border-gray-200 dark:border-brand-700 shadow-2xl animate-slide-up max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-brand-700">
          <div className="font-bold text-gray-900 dark:text-white">{title}</div>
          <button onClick={onClose} className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-brand-800">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </div>
    </div>
  )
}
