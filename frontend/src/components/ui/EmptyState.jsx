export default function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon size={48} className="text-gray-200 dark:text-brand-700 mb-4" />}
      <div className="text-base font-bold text-gray-500 dark:text-brand-400">{title}</div>
      {desc && <div className="text-sm text-gray-400 dark:text-brand-500 mt-1">{desc}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
