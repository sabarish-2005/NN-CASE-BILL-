import Modal from './Modal'
export default function ConfirmDialog({ open, onClose, onConfirm, title='Confirm', message, danger=true, loading=false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 dark:text-brand-300 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={onConfirm} disabled={loading}
          className={danger ? 'btn-danger' : 'btn-gold'}>
          {loading ? 'Please wait...' : 'Confirm'}
        </button>
      </div>
    </Modal>
  )
}
