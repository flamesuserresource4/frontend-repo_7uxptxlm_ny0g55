import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function App() {
  const [providers, setProviders] = useState([])
  const [assignments, setAssignments] = useState([])
  const [start, setStart] = useState('2025-01-01')
  const [end, setEnd] = useState('2025-01-07')
  const [loading, setLoading] = useState(false)
  const [conflicts, setConflicts] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API}/health`).catch(()=>{})
  }, [])

  const seedDemo = async () => {
    setError('')
    try {
      // Seed two providers and a REG shift type (ignore duplicates)
      await fetch(`${API}/providers`, {method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id:'p1', name:'Dr. Alpha', fte:1.0, acc_target: 180, call_target: 6, site_preferences:['UH'], qualifications:['OR'], seniority_level:5, politics_weight:0.2})})
      await fetch(`${API}/providers`, {method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id:'p2', name:'Dr. Beta', fte:0.8, acc_target: 160, call_target: 5, site_preferences:['UH'], qualifications:['OR'], seniority_level:3, politics_weight:0.1})})
      await fetch(`${API}/shift-types`, {method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id:'reg-uh', name:'REG', site:'UH', weekly:false, requires_qualification:'OR'})})
      const res = await fetch(`${API}/providers`)
      setProviders(await res.json())
    } catch (e) {
      setError('Failed to seed demo data. Check API connectivity.')
    }
  }

  const generate = async () => {
    setLoading(true)
    setError('')
    setConflicts([])
    try {
      const resp = await fetch(`${API}/generate`, {method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({start_date:start, end_date:end})})
      if (!resp.ok) {
        const msg = await resp.text()
        throw new Error(msg || `Generate failed with ${resp.status}`)
      }
      const gen = await resp.json()
      setConflicts(gen.conflicts || [])
      const a = await fetch(`${API}/assignments`).then(r=>r.json())
      setAssignments(a)
    } catch (e) {
      setError(e.message || 'An error occurred while generating schedule')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">ORchestrator.ai — Scheduling Engine (MVP demo)</h1>
        <div className="bg-slate-900 rounded-xl p-4 space-y-3">
          <div className="flex gap-3 items-center flex-wrap">
            <button onClick={seedDemo} className="px-3 py-2 bg-emerald-600 rounded">Seed demo data</button>
            <label>Start <input type="date" value={start} onChange={e=>setStart(e.target.value)} className="text-black rounded px-2"/></label>
            <label>End <input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="text-black rounded px-2"/></label>
            <button onClick={generate} disabled={loading} className="px-3 py-2 bg-indigo-600 rounded disabled:opacity-50">{loading? 'Generating...' : 'Generate schedule'}</button>
          </div>
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
          {conflicts.length > 0 && (
            <div className="text-amber-300 text-sm">
              Conflicts:
              <ul className="list-disc pl-6 space-y-1">
                {conflicts.map((c,i)=> <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-slate-900 rounded-xl p-4">
          <h2 className="text-xl mb-2">Providers</h2>
          <ul className="list-disc pl-6">
            {providers.map(p=> (
              <li key={p.id}>{p.name} — FTE {p.fte}</li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-900 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl">Assignments</h2>
            <div className="text-slate-400 text-sm">{assignments.length} items</div>
          </div>
          <ul className="divide-y divide-slate-800">
            {assignments.map((a,i)=> (
              <li key={i} className="py-2 flex justify-between">
                <span>{a.date}</span>
                <span>{a.shift_type} @ {a.site}</span>
                <span>{a.provider_id}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App
