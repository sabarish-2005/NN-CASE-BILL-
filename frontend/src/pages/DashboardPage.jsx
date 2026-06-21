import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, Receipt, Users, Package, ArrowRight, Printer } from 'lucide-react'
import { billService } from '../services/billService'
import { BILL_TYPES, fmtCurrency, fmtCurrencyShort, fmtDate } from '../utils'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({ queryKey:['stats'], queryFn: billService.getStats, refetchInterval: 60000 })
  const stats = data?.stats || {}

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={32} className="text-gold-400" />
    </div>
  )

  const statCards = [
    { label:'Total Revenue',  value:`₹${fmtCurrencyShort(stats.totalRevenue)}`,  sub:'All time', color:'#c9a227', icon:TrendingUp },
    { label:'This Month',     value:`₹${fmtCurrencyShort(stats.monthRevenue)}`,  sub:`${stats.monthBills||0} bills`, color:'#22c55e', icon:Receipt },
    { label:'Total Bills',    value: stats.totalBills||0,                          sub:'All time', color:'#3b82f6', icon:Receipt },
    { label:'Month Bills',    value: stats.monthBills||0,                          sub:'This month', color:'#a855f7', icon:Package },
  ]

  const chartData = stats.monthlyTrend || []

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ label, value, sub, color, icon:Icon }) => (
          <div key={label} className="stat-card" style={{ borderLeftColor: color }}>
            <div className="flex items-start justify-between mb-2">
              <div className="text-xs text-gray-500 dark:text-brand-400 font-semibold tracking-wide uppercase">{label}</div>
              <Icon size={16} style={{ color }} />
            </div>
            <div className="text-2xl font-black" style={{ color }}>{value}</div>
            <div className="text-xs text-gray-400 dark:text-brand-500 mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* Chart + Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card">
          <div className="card-header">⚜ Monthly Revenue Trend</div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-brand-700" />
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'#6b7280' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v) => [`₹${fmtCurrency(v)}`, 'Revenue']}
                  contentStyle={{ background:'#0a2e1a', border:'1px solid #c9a227', borderRadius:6, fontSize:12, color:'#e0b84a' }} />
                <Bar dataKey="revenue" fill="#c9a227" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bill Type Breakdown */}
        <div className="card">
          <div className="card-header">⚜ By Type</div>
          <div className="p-0">
            {Object.entries(BILL_TYPES).map(([k, bt]) => {
              const entry = stats.byType?.find(b => b._id === k) || {}
              return (
                <div key={k} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-brand-800 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: bt.color }} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{bt.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black" style={{ color: bt.color }}>{entry.count||0}</div>
                    {entry.revenue > 0 && <div className="text-[10px] text-gray-400">₹{fmtCurrencyShort(entry.revenue)}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick Create + Recent Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Create */}
        <div className="card">
          <div className="card-header">⚜ Quick Create Bill</div>
          <div className="card-body grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(BILL_TYPES).map(([k, bt]) => (
              <button key={k} onClick={() => navigate(`/bills/new?type=${k}`)}
                className="py-3 px-2 rounded-lg border-2 text-center text-xs font-black transition-all hover:scale-105"
                style={{ borderColor:bt.color, background:bt.bg, color:bt.color }}>
                + {bt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Bills */}
        <div className="card overflow-hidden">
          <div className="card-header justify-between">
            <span>⚜ Recent Bills</span>
            <button onClick={() => navigate('/bills')} className="text-xs text-gold-300 hover:text-gold-400 flex items-center gap-1">
              View All <ArrowRight size={11} />
            </button>
          </div>
          <div>
            {(!stats.recent || stats.recent.length === 0)
              ? <div className="py-8 text-center text-sm text-gray-400">No bills yet</div>
              : stats.recent.map(b => (
                <div key={b._id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 dark:border-brand-800 last:border-0 hover:bg-gray-50 dark:hover:bg-brand-800/50 cursor-pointer"
                  onClick={() => navigate(`/bills/${b._id}`)}>
                  <Badge type={b.type} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold font-mono text-gray-800 dark:text-gray-200 truncate">{b.billNo}</div>
                    <div className="text-[11px] text-gray-400 truncate">{b.custName||'Walk-in'} · {fmtDate(b.date)}</div>
                  </div>
                  <div className="text-sm font-black font-mono text-brand-700 dark:text-gold-400 flex-shrink-0">
                    ₹{fmtCurrency(b.total)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
