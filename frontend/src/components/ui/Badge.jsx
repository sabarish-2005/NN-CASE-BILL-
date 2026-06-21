import { BILL_TYPES } from '../../utils'
export default function Badge({ type, size='sm' }) {
  const bt = BILL_TYPES[type] || BILL_TYPES.dc
  const p = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
  return (
    <span className={`badge font-black tracking-wider ${p}`}
      style={{ background:bt.bg, color:bt.color, borderColor:bt.color }}>
      {bt.short}
    </span>
  )
}
