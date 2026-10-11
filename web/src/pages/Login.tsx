import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setToken, type Me } from '../api'

export default function Login({ onLogin }: { onLogin: (m: Me) => void }) {
  const nav = useNavigate()
  const [username, setU] = useState('admin')
  const [password, setP] = useState('')
  const [err, setErr] = useState('')
  async function submit(e: FormEvent) {
    e.preventDefault(); setErr('')
    try {
      const r = await api<{ token: string }>('/login', { body: { username, password } })
      setToken(r.token)
      onLogin(await api<Me>('/me'))
      nav('/')
    } catch (x) { setErr((x as Error).message) }
  }
  return (
    <div className="login">
      <form className="card" onSubmit={submit}>
        <div className="logo big">Metin2<span>Studio</span></div>
        <p className="muted">GM Yönetim Paneli</p>
        <label>Kullanıcı adı<input value={username} onChange={e => setU(e.target.value)} autoFocus /></label>
        <label>Şifre<input type="password" value={password} onChange={e => setP(e.target.value)} /></label>
        {err && <div className="err">{err}</div>}
        <button className="primary" type="submit">Giriş Yap</button>
      </form>
    </div>
  )
}
