import { useEffect, useState } from 'react'
import { api } from '../api'

interface Entry { time: string; actor: string; action: string; target: string; detail: string }
export default function Audit() {
  const [rows, setRows] = useState<Entry[]>([])
  useEffect(() => { api<Entry[]>('/audit').then(setRows).catch(() => {}) }, [])
  return (
    <div className="stack">
      <h1>Loglar & Denetim</h1>
      <div className="card"><table>
        <thead><tr><th>Zaman</th><th>Yönetici</th><th>İşlem</th><th>Hedef</th><th>Detay</th></tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}><td>{new Date(r.time).toLocaleString('tr-TR')}</td><td>{r.actor}</td><td><code>{r.action}</code></td><td>{r.target}</td><td>{r.detail}</td></tr>)}</tbody>
      </table>{rows.length === 0 && <p className="muted">Kayıt yok.</p>}</div>
    </div>
  )
}
