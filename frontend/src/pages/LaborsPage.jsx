import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit2, Save } from 'lucide-react'
import { laborService } from '../services/laborService'
import { fmtCurrency } from '../utils'
import Spinner from '../components/ui/Spinner'

const LABORERS = [
  'Chithra', 'Kalpana', 'Kowsalya', 'Manju', 'Mariyammal',
  'Nethisudavelli', 'Parvathi', 'Pavithra', 'Preethi', 'Priya',
  'Sasikala', 'Sangeetha', 'Selvi'
];

export default function LaborsPage() {
  const qc = useQueryClient()
  const [editingLabor, setEditingLabor] = useState(null)
  const [newName, setNewName] = useState('')
  const [newCoverName, setNewCoverName] = useState('')
  const [newCoverPrice, setNewCoverPrice] = useState('')
  const [newRate, setNewRate] = useState('')
  const [editCoverName, setEditCoverName] = useState('')
  const [editCoverPrice, setEditCoverPrice] = useState('')
  const [editRate, setEditRate] = useState('')
  const [selectedLabor, setSelectedLabor] = useState(null)
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0])
  const [workPieces, setWorkPieces] = useState('')
  const [workNotes, setWorkNotes] = useState('')

  // Fetch all labors
  const { data: laborsData, isLoading } = useQuery({
    queryKey: ['labors'],
    queryFn: () => laborService.getAll(),
  })
  const labors = laborsData?.labors || []

  // Create labor
  const createMut = useMutation({
    mutationFn: (data) => laborService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labors'] })
      setNewName('')
      setNewCoverName('')
      setNewCoverPrice('')
      setNewRate('')
      toast.success('Labor added!')
    },
    onError: (e) => toast.error(e.message),
  })

  // Update labor
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => laborService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labors'] })
      setEditingLabor(null)
      setEditCoverName('')
      setEditCoverPrice('')
      setEditRate('')
      toast.success('Labor updated!')
    },
    onError: (e) => toast.error(e.message),
  })

  // Delete labor
  const deleteMut = useMutation({
    mutationFn: (id) => laborService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labors'] })
      toast.success('Labor deleted!')
    },
    onError: (e) => toast.error(e.message),
  })

  // Add work record
  const addWorkMut = useMutation({
    mutationFn: (data) => laborService.addWork(selectedLabor._id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labors'] })
      setWorkPieces('')
      setWorkNotes('')
      setWorkDate(new Date().toISOString().split('T')[0])
      toast.success('Work record added!')
    },
    onError: (e) => toast.error(e.message),
  })

  // Delete work record
  const deleteWorkMut = useMutation({
    mutationFn: ({ id, recordId }) => laborService.deleteWork(id, recordId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labors'] })
      toast.success('Work record deleted!')
    },
    onError: (e) => toast.error(e.message),
  })

  const handleAddLabor = () => {
    if (!newName) return toast.error('Enter name')
    createMut.mutate({ 
      name: newName,
      coverName: newCoverName,
      coverPrice: parseFloat(newCoverPrice) || 0,
      ratePerPiece: parseFloat(newRate) || 0 
    })
  }

  const handleUpdateLabor = (labor) => {
    updateMut.mutate({ 
      id: labor._id, 
      data: { 
        coverName: editCoverName,
        coverPrice: parseFloat(editCoverPrice) || 0,
        ratePerPiece: parseFloat(editRate) || 0 
      } 
    })
  }

  const handleAddWork = () => {
    if (!workPieces || parseFloat(workPieces) <= 0) return toast.error('Enter valid pieces')
    addWorkMut.mutate({ piecesCompleted: parseFloat(workPieces), notes: workNotes, date: workDate })
  }

  // Calculate weekly summary
  const getWeeklySummary = (labor) => {
    const weeks = {}
    labor.workRecords?.forEach(record => {
      const date = new Date(record.date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]
      
      if (!weeks[weekKey]) weeks[weekKey] = { pieces: 0, amount: 0, days: [] }
      weeks[weekKey].pieces += record.piecesCompleted || 0
      weeks[weekKey].amount += record.earningForDay || 0
      weeks[weekKey].days.push(record)
    })
    return weeks
  }

  if (isLoading) return <div className="text-center py-8"><Spinner /></div>

  return (
    <div className="space-y-4 animate-fade-in max-w-7xl mx-auto">
      {/* Add new labor */}
      <div className="card">
        <div className="card-header">⚜ ADD LABOR</div>
        <div className="card-body space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <input
              className="inp"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Select or type name"
              list="laborNames"
            />
            <datalist id="laborNames">
              {LABORERS.map(name => <option key={name} value={name} />)}
            </datalist>
            <input
              className="inp"
              value={newCoverName}
              onChange={e => setNewCoverName(e.target.value)}
              placeholder="Cover name"
            />
            <input
              type="number"
              className="inp"
              value={newCoverPrice}
              onChange={e => setNewCoverPrice(e.target.value)}
              placeholder="Cover price (₹)"
              step="0.01"
            />
            <input
              type="number"
              className="inp"
              value={newRate}
              onChange={e => setNewRate(e.target.value)}
              placeholder="Rate per piece (₹)"
              step="0.01"
            />
            <button
              onClick={handleAddLabor}
              disabled={createMut.isPending}
              className="btn-gold gap-1.5"
            >
              {createMut.isPending ? <Spinner size={14} /> : <Plus size={14} />} Add
            </button>
          </div>
        </div>
      </div>

      {/* Labors list */}
      <div className="space-y-4">
        {labors.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-8 text-gray-400">No labors yet</div>
          </div>
        ) : (
          labors.map(labor => {
            const weeks = getWeeklySummary(labor)
            const sortedWeeks = Object.entries(weeks).sort(([a], [b]) => b.localeCompare(a))
            
            return (
              <div key={labor._id} className="card">
                <div className="card-header flex justify-between items-start flex-wrap gap-3">
                  <div>
                    <div className="font-bold text-lg">{labor.name}</div>
                    {labor.coverName && <div className="text-sm text-gray-600 dark:text-gray-400">{labor.coverName}</div>}
                  </div>
                  <div className="flex gap-1.5">
                    {editingLabor?._id === labor._id ? (
                      <>
                        <input
                          className="inp !h-8 !px-2 text-xs w-32"
                          value={editCoverName}
                          onChange={e => setEditCoverName(e.target.value)}
                          placeholder="Cover name"
                        />
                        <input
                          type="number"
                          className="inp !h-8 !px-2 text-xs w-24"
                          value={editCoverPrice}
                          onChange={e => setEditCoverPrice(e.target.value)}
                          placeholder="Price"
                          step="0.01"
                        />
                        <input
                          type="number"
                          className="inp !h-8 !px-2 text-xs w-24"
                          value={editRate}
                          onChange={e => setEditRate(e.target.value)}
                          placeholder="Rate"
                          step="0.01"
                        />
                        <button
                          onClick={() => handleUpdateLabor(labor)}
                          className="btn-gold btn-sm gap-1"
                        >
                          <Save size={12} /> Save
                        </button>
                        <button
                          onClick={() => { setEditingLabor(null); setEditCoverName(''); setEditCoverPrice(''); setEditRate('') }}
                          className="btn-ghost btn-sm"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingLabor(labor); setEditCoverName(labor.coverName || ''); setEditCoverPrice(labor.coverPrice || ''); setEditRate(labor.ratePerPiece) }}
                          className="btn-ghost btn-sm gap-1"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => deleteMut.mutate(labor._id)}
                          className="btn-danger btn-sm gap-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="card-body space-y-4">
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <div className="bg-gray-50 dark:bg-brand-800 p-2.5 rounded">
                      <div className="text-[10px] text-gray-400 font-bold">COVER PRICE</div>
                      <div className="font-bold text-brand-800 dark:text-gold-300">₹{fmtCurrency(labor.coverPrice || 0)}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-brand-800 p-2.5 rounded">
                      <div className="text-[10px] text-gray-400 font-bold">RATE/PIECE</div>
                      <div className="font-bold text-brand-800 dark:text-gold-300">₹{fmtCurrency(labor.ratePerPiece || 0)}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-brand-800 p-2.5 rounded">
                      <div className="text-[10px] text-gray-400 font-bold">TOTAL PIECES</div>
                      <div className="font-bold text-brand-800 dark:text-gold-300">{labor.totalPieces}</div>
                    </div>
                    <div className="bg-gold-100 dark:bg-brand-700 p-2.5 rounded">
                      <div className="text-[10px] text-gray-600 dark:text-gold-200 font-bold">TOTAL AMOUNT</div>
                      <div className="font-bold text-lg text-brand-800 dark:text-gold-300">₹{fmtCurrency(labor.totalEarnings)}</div>
                    </div>
                  </div>

                  {/* Weekly Summary */}
                  {sortedWeeks.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase mb-2">📅 Weekly Summary:</div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {sortedWeeks.map(([weekStart, week]) => (
                          <div key={weekStart} className="bg-gray-50 dark:bg-brand-800 p-2.5 rounded">
                            <div className="flex justify-between items-start mb-1.5">
                              <div className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                Week of {new Date(weekStart).toLocaleDateString('en-IN')}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div>
                                <div className="text-[10px] text-gray-500">Pieces</div>
                                <div className="font-bold text-sm">{week.pieces}</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-gray-500">Amount</div>
                                <div className="font-bold text-sm text-gold-600">₹{fmtCurrency(week.amount)}</div>
                              </div>
                            </div>
                            {/* Daily breakdown */}
                            <div className="grid grid-cols-7 gap-1 text-xs">
                              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, idx) => {
                                const dayRecord = week.days.find(d => d.day === dayName)
                                return (
                                  <div key={dayName} className={`p-1.5 rounded text-center ${dayRecord ? 'bg-gold-200 dark:bg-gold-700' : 'bg-gray-200 dark:bg-brand-700'}`}>
                                    <div className="font-bold text-[9px]">{dayName}</div>
                                    {dayRecord && (
                                      <>
                                        <div className="font-bold">{dayRecord.piecesCompleted}</div>
                                        <div className="text-[8px]">₹{fmtCurrency(dayRecord.earningForDay)}</div>
                                      </>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add work for this labor */}
                  {selectedLabor?._id === labor._id && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <input
                          type="date"
                          className="inp !py-1.5"
                          value={workDate}
                          onChange={e => setWorkDate(e.target.value)}
                        />
                        <input
                          type="number"
                          className="inp !py-1.5"
                          value={workPieces}
                          onChange={e => setWorkPieces(e.target.value)}
                          placeholder="Pieces"
                          step="1"
                        />
                        <input
                          className="inp !py-1.5"
                          value={workNotes}
                          onChange={e => setWorkNotes(e.target.value)}
                          placeholder="Notes (optional)"
                        />
                        <button
                          onClick={handleAddWork}
                          disabled={addWorkMut.isPending}
                          className="btn-gold gap-1.5 !py-1.5"
                        >
                          {addWorkMut.isPending ? <Spinner size={14} /> : <Plus size={14} />} Add
                        </button>
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-300 font-bold">
                        Daily earning: ₹{fmtCurrency((parseFloat(workPieces) || 0) * (labor.ratePerPiece || 0))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Quick select labor for work */}
      {labors.length > 0 && !selectedLabor && (
        <div className="card">
          <div className="card-header">➕ ADD WORK RECORD</div>
          <div className="card-body">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Select a labor to add work record:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {labors.map(labor => (
                <button
                  key={labor._id}
                  onClick={() => setSelectedLabor(labor)}
                  className="btn-ghost text-left text-sm py-2"
                >
                  <div className="font-bold">{labor.name}</div>
                  {labor.coverName && <div className="text-[10px] text-gray-500">{labor.coverName}</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
