import { useEffect, useState } from 'react'
import { api } from '../api'

interface Profile { id: string; name: string; host: string; port: number; user: string; dbPrefix: string }
interface Probe { ok: boolean; error?: string; version?: string; databases?: string[]; tables?: Record<string, boolean> }
const empty = { name: '', host: '127.0.0.1', port: 3306, user: 'root', password: '', dbPrefix: '' }

// Navicat mantığı: host/port/kullanıcı/şifre gir, Test Et, Kaydet, Bağlan.
export default function Connection() {
  const [f, setF] = useState(empty)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [active, setActive] = useState('mock')
  const [probe, setProbe] = useState<Probe | null>(null)
  const [msg, setMsg] = useState('')
  const load = () => api<{ profiles: Profile[]; active: string }>('/connections').then(r => { setProfiles(r.profiles); setActive(r.active) })
  useEffect(() => { load() }, [])
  const set = (k: keyof typeof empty, v: string | number) => setF({ ...f, [k]: v })
  const run = async (fn: () => Promise<void>) => { setMsg(''); try { await fn() } catch (e) { setMsg((e as Error).message) } }

  return (
    <div className="stack">
      <h1>Bağlantı</h1>
      <div className="grid2">
        <div className="card stack">
          <h3>Yeni Bağlantı</h3>
          <label>Bağlantı adı<input value={f.name} onChange={e => set('name', e.target.value)} placeholder="Metin2 Sunucum" /></label>
          <div className="row">
            <label className="grow">Host<input value={f.host} onChange={e => set('host', e.target.value)} /></label>
            <label style={{ width: 110 }}>Port<input type="number" value={f.port} onChange={e => set('port', Number(e.target.value))} /></label>
          </div>
          <label>Kullanıcı adı<input value={f.user} onChange={e => set('user', e.target.value)} /></label>
          <label>Şifre<input type="password" value={f.password} onChange={e => set('password', e.target.value)} /></label>
          <label>Veritabanı öneki (isteğe bağlı)<input value={f.dbPrefix} onChange={e => set('dbPrefix', e.target.value)} placeholder="boşsa: account, player, common, log" /></label>
          <div className="row">
            <button onClick={() => run(async () => setProbe(await api<Probe>('/connections/test', { body: f })))}>Bağlantıyı Test Et</button>
            <button className="primary" disabled={!f.name} onClick={() => run(async () => { await api('/connections', { body: f }); setF(empty); setProbe(null); await load() })}>Kaydet</button>
          </div>
          {msg && <div className="err">{msg}</div>}
          {probe && (probe.ok ? (
            <div className="okbox">
              <b>Bağlantı başarılı</b> · MySQL {probe.version}
              <ul>{Object.entries(probe.tables ?? {}).map(([t, ok]) => <li key={t}>{ok ? '✓' : '✗'} <code>{t}</code></li>)}</ul>
            </div>
          ) : <div className="err">Bağlanılamadı: {probe.error}</div>)}
        </div>
        <div className="card stack">
          <h3>Kayıtlı Bağlantılar</h3>
          <p className="muted">Aktif: <b>{active === 'mysql' ? 'Oyun veritabanı' : 'Demo modu'}</b></p>
          {profiles.length === 0 && <p className="muted">Henüz kayıtlı bağlantı yok.</p>}
          {profiles.map(p => (
            <div className="row item" key={p.id}>
              <div className="grow"><b>{p.name}</b><div className="muted">{p.user}@{p.host}:{p.port}</div></div>
              <button className="primary" onClick={() => run(async () => { await api(`/connections/${p.id}/connect`, { method: 'POST', body: {} }); location.reload() })}>Bağlan</button>
              <button className="danger" onClick={() => run(async () => { await api(`/connections/${p.id}`, { method: 'DELETE' }); await load() })}>Sil</button>
            </div>
          ))}
          {active === 'mysql' && <button onClick={() => run(async () => { await api('/connections/disconnect', { method: 'POST', body: {} }); location.reload() })}>Bağlantıyı Kes (Demo moduna dön)</button>}
          <p className="muted small">Şifreler sunucuda şifreli saklanır. Veritabanına doğrudan yazma yerine item teslimi <code>item_award</code> ile yapılır; level/exp/drop gibi canlı işlemler core köprüsü ile gelecek.</p>
        </div>
      </div>
    </div>
  )
}
