import { useEffect, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { api, getToken, setToken, type Me } from './api'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Players from './pages/Players'
import Drops from './pages/Drops'
import Connection from './pages/Connection'
import Audit from './pages/Audit'

function Shell({ me }: { me: Me }) {
  const nav = useNavigate()
  const can = (p: string) => me.perms.includes(p)
  const links: [string, string, string][] = [
    ['/', 'Genel Bakış', 'server.read'], ['/players', 'Oyuncular', 'players.read'], ['/drops', 'Drop Yönetimi', 'drops.read'],
    ['/audit', 'Loglar', 'audit.read'], ['/connection', 'Bağlantı', 'connection.manage'],
  ]
  return (
    <div className="shell">
      <aside>
        <div className="logo">Metin2<span>Studio</span></div>
        <nav>{links.filter(l => can(l[2])).map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}</nav>
      </aside>
      <div className="main">
        <header>
          <span className={'pill ' + (me.adapter === 'mysql' ? 'ok' : 'warn')}>
            {me.adapter === 'mysql' ? 'Oyun veritabanı: Bağlı' : 'Demo modu (sahte veri)'}
          </span>
          <span className="grow" />
          <span className="muted">{me.username} · <b>{me.role}</b></span>
          <button className="ghost" onClick={() => { setToken(null); nav('/login') }}>Çıkış</button>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/players" element={<Players me={me} />} />
            <Route path="/drops" element={<Drops me={me} />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/connection" element={<Connection />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const [me, setMe] = useState<Me | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!getToken()) { setReady(true); return }
    api<Me>('/me').then(setMe).catch(() => setToken(null)).finally(() => setReady(true))
  }, [])
  if (!ready) return null
  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={setMe} />} />
      <Route path="/*" element={me ? <Shell me={me} /> : <Navigate to="/login" />} />
    </Routes>
  )
}
