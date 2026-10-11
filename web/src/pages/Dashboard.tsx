import { useEffect, useState } from 'react'
import { api } from '../api'

interface Status {
  online: number; totalAccounts: number; cpu: number; ram: number; disk: number
  channels: { name: string; status: 'up' | 'down'; players: number; uptimeSec: number; pingMs: number }[]
  onlineHistory: { t: string; n: number }[]
}
const fmtUp = (s: number) => (s ? `${Math.floor(s / 86400)}g ${Math.floor((s % 86400) / 3600)}s` : '-')

export default function Dashboard() {
  const [s, setS] = useState<Status | null>(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    const load = () => api<Status>('/status').then(setS).catch(e => setErr(e.message))
    load(); const t = setInterval(load, 5000); return () => clearInterval(t)
  }, [])
  if (err) return <div className="err">{err}</div>
  if (!s) return <p className="muted">Yükleniyor…</p>
  const max = Math.max(1, ...s.onlineHistory.map(h => h.n))
  return (
    <div className="stack">
      <h1>Genel Bakış</h1>
      <div className="kpis">
        <div className="card kpi"><span>Online Oyuncu</span><b>{s.online}</b></div>
        <div className="card kpi"><span>Toplam Hesap</span><b>{s.totalAccounts}</b></div>
        <div className="card kpi"><span>Aktif Kanal</span><b>{s.channels.filter(c => c.status === 'up').length}/{s.channels.length}</b></div>
        <div className="card kpi"><span>CPU / RAM</span><b>{s.cpu}% / {s.ram}%</b></div>
      </div>
      <div className="grid2">
        <div className="card">
          <h3>Online Oyuncu (24 saat)</h3>
          {s.onlineHistory.length === 0 ? <p className="muted">Veri yok (core köprüsü gerekir).</p> : (
            <svg viewBox="0 0 240 80" className="chart" role="img" aria-label="Online oyuncu grafiği">
              <polyline fill="none" stroke="var(--gold)" strokeWidth="1.5"
                points={s.onlineHistory.map((h, i) => `${(i / (s.onlineHistory.length - 1)) * 240},${78 - (h.n / max) * 70}`).join(' ')} />
            </svg>
          )}
        </div>
        <div className="card">
          <h3>Kanallar</h3>
          {s.channels.length === 0 && <p className="muted">Veri yok (core köprüsü gerekir).</p>}
          {s.channels.map(c => (
            <div className="row item" key={c.name}>
              <span className={'dot ' + c.status} /><b className="grow">{c.name}</b>
              <span className="muted">{c.players} oyuncu · {fmtUp(c.uptimeSec)} · {c.pingMs}ms</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
