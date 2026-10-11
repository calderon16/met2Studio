import { useEffect, useState } from 'react'
import { api, type Me } from '../api'

interface Player { id: number; name: string; account: string; job: string; level: number; exp: number; yang: number; channel: number | null; online: boolean; lastLogin: string; inventory: { slot: number; vnum: number; count: number }[] }
interface Item { vnum: number; name: string }

export default function Players({ me }: { me: Me }) {
  const [q, setQ] = useState('')
  const [list, setList] = useState<Player[]>([])
  const [sel, setSel] = useState<Player | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const can = (p: string) => me.perms.includes(p)
  const search = () => api<Player[]>('/players?q=' + encodeURIComponent(q)).then(setList).catch(e => setMsg({ ok: false, t: e.message }))
  useEffect(() => { search() }, [])
  const open = (id: number) => api<Player>('/players/' + id).then(setSel)
  const act = async (path: string, body: unknown, confirmText?: string) => {
    if (confirmText && !confirm(confirmText)) return
    try { const r = await api<{ message: string }>(`/players/${sel!.id}/${path}`, { body }); setMsg({ ok: true, t: r.message }); await open(sel!.id); search() }
    catch (e) { setMsg({ ok: false, t: (e as Error).message }) }
  }
  return (
    <div className="stack">
      <h1>Oyuncular</h1>
      {msg && <div className={msg.ok ? 'okbox' : 'err'}>{msg.t}</div>}
      <div className="row"><input className="grow" placeholder="Karakter veya hesap adı ara…" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} /><button onClick={search}>Ara</button></div>
      <div className="grid2 wide">
        <div className="card">
          <table>
            <thead><tr><th>Ad</th><th>Hesap</th><th>Sınıf</th><th>Lv</th><th>Yang</th><th>Durum</th></tr></thead>
            <tbody>{list.map(p => (
              <tr key={p.id} className={sel?.id === p.id ? 'sel' : ''} onClick={() => open(p.id)}>
                <td><b>{p.name}</b></td><td>{p.account}</td><td>{p.job}</td><td>{p.level}</td><td>{p.yang.toLocaleString('tr-TR')}</td>
                <td><span className={'dot ' + (p.online ? 'up' : 'down')} /> {p.online ? `CH${p.channel}` : 'çevrimdışı'}</td>
              </tr>))}</tbody>
          </table>
          {list.length === 0 && <p className="muted">Sonuç yok.</p>}
        </div>
        {sel && <PlayerPanel p={sel} can={can} act={act} />}
      </div>
    </div>
  )
}

function PlayerPanel({ p, can, act }: { p: Player; can: (x: string) => boolean; act: (path: string, body: unknown, c?: string) => void }) {
  const [level, setLevel] = useState(p.level)
  const [exp, setExp] = useState(100000)
  const [yang, setYang] = useState(1000000)
  const [iq, setIq] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [vnum, setVnum] = useState(0)
  const [count, setCount] = useState(1)
  useEffect(() => { setLevel(p.level) }, [p.id, p.level])
  useEffect(() => { api<Item[]>('/items?q=' + encodeURIComponent(iq)).then(setItems).catch(() => setItems([])) }, [iq])
  return (
    <div className="card stack">
      <h3>{p.name} <span className="muted">· Lv {p.level} {p.job}</span></h3>
      <div className="muted">EXP {p.exp.toLocaleString('tr-TR')} · Yang {p.yang.toLocaleString('tr-TR')}</div>
      {can('players.stats') && <>
        <div className="row"><input type="number" value={level} onChange={e => setLevel(Number(e.target.value))} /><button onClick={() => act('level', { level }, `${p.name} seviyesi ${level} yapılsın mı?`)}>Level Ayarla</button></div>
        <div className="row"><input type="number" value={exp} onChange={e => setExp(Number(e.target.value))} /><button onClick={() => act('exp', { amount: exp })}>EXP Ekle</button></div>
        <div className="row"><input type="number" value={yang} onChange={e => setYang(Number(e.target.value))} /><button onClick={() => act('yang', { amount: yang })}>Yang Ekle</button></div>
      </>}
      {can('players.item') && <div className="stack">
        <h4>Item Ver</h4>
        <input placeholder="Item ara (ad veya vnum)…" value={iq} onChange={e => setIq(e.target.value)} />
        <select value={vnum} onChange={e => setVnum(Number(e.target.value))}><option value={0}>Item seçin…</option>{items.map(i => <option key={i.vnum} value={i.vnum}>{i.name} ({i.vnum})</option>)}</select>
        <div className="row"><input type="number" min={1} max={200} value={count} onChange={e => setCount(Number(e.target.value))} /><button className="primary" disabled={!vnum} onClick={() => act('item', { vnum, count }, `${count}x item ${vnum} verilsin mi?`)}>Ver</button></div>
      </div>}
      {can('players.kick') && p.online && <button className="danger" onClick={() => act('kick', {}, `${p.name} oyundan atılsın mı?`)}>Oyundan At</button>}
      <h4>Envanter</h4>
      <div className="inv">{p.inventory.map(i => <div className="slot" key={i.slot} title={`vnum ${i.vnum}`}><code>{i.vnum}</code><b>×{i.count}</b></div>)}{p.inventory.length === 0 && <span className="muted">Boş</span>}</div>
    </div>
  )
}
