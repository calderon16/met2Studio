import { useEffect, useState } from 'react'
import { api, type Me } from '../api'

interface Mob { vnum: number; name: string; kind: string; level: number }
interface Drop { itemVnum: number; count: number; rate: number; type: 'drop' | 'kill' | 'limit'; levelLimit?: number; killCount?: number }
interface Item { vnum: number; name: string }
const KIND: Record<string, string> = { mob: 'Mob', boss: 'Boss', metin: 'Metin', npc: 'NPC' }

export default function Drops({ me }: { me: Me }) {
  const [q, setQ] = useState('')
  const [mobs, setMobs] = useState<Mob[]>([])
  const [sel, setSel] = useState<Mob | null>(null)
  const [drops, setDrops] = useState<Drop[]>([])
  const [orig, setOrig] = useState('[]')
  const [names, setNames] = useState<Record<number, string>>({})
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const edit = me.perms.includes('drops.edit')
  const dirty = JSON.stringify(drops) !== orig
  useEffect(() => { api<Mob[]>('/mobs?q=' + encodeURIComponent(q)).then(setMobs).catch(e => setMsg({ ok: false, t: e.message })) }, [q])
  useEffect(() => { api<Item[]>('/items?limit=100').then(r => setNames(Object.fromEntries(r.map(i => [i.vnum, i.name])))).catch(() => {}) }, [])
  const pick = async (m: Mob) => {
    if (dirty && !confirm('Kaydedilmemiş değişiklikler silinecek. Devam edilsin mi?')) return
    try { const d = await api<Drop[]>(`/mobs/${m.vnum}/drops`); setSel(m); setDrops(d); setOrig(JSON.stringify(d)); setMsg(null) }
    catch (e) { setMsg({ ok: false, t: (e as Error).message }) }
  }
  const upd = (i: number, patch: Partial<Drop>) => setDrops(drops.map((d, j) => (j === i ? { ...d, ...patch } : d)))
  const save = async () => {
    try { const r = await api<{ message: string }>(`/mobs/${sel!.vnum}/drops`, { method: 'PUT', body: drops }); setOrig(JSON.stringify(drops)); setMsg({ ok: true, t: r.message }) }
    catch (e) { setMsg({ ok: false, t: (e as Error).message }) }
  }
  return (
    <div className="stack">
      <h1>Drop Yönetimi</h1>
      {msg && <div className={msg.ok ? 'okbox' : 'err'}>{msg.t}</div>}
      <div className="grid2 wide">
        <div className="card stack">
          <input placeholder="Mob / Boss / NPC ara…" value={q} onChange={e => setQ(e.target.value)} />
          {mobs.map(m => <div key={m.vnum} className={'row item click ' + (sel?.vnum === m.vnum ? 'sel' : '')} onClick={() => pick(m)}>
            <b className="grow">{m.name}</b><span className="tag">{KIND[m.kind]}</span><span className="muted">Lv {m.level}</span></div>)}
        </div>
        <div className="card stack">
          {!sel ? <p className="muted">Soldan bir mob seçin.</p> : <>
            <h3>{sel.name} <span className="muted">· vnum {sel.vnum}</span></h3>
            <table>
              <thead><tr><th>Item</th><th>Vnum</th><th>Adet</th><th>Oran %</th><th>Tip</th><th>Lv sınırı</th><th /></tr></thead>
              <tbody>{drops.map((d, i) => (
                <tr key={i}>
                  <td>{names[d.itemVnum] ?? '?'}</td>
                  <td><input disabled={!edit} type="number" value={d.itemVnum} onChange={e => upd(i, { itemVnum: Number(e.target.value) })} /></td>
                  <td><input disabled={!edit} type="number" min={1} value={d.count} onChange={e => upd(i, { count: Number(e.target.value) })} /></td>
                  <td><input disabled={!edit} type="number" step="0.01" min={0.0001} max={100} value={d.rate} onChange={e => upd(i, { rate: Number(e.target.value) })} /></td>
                  <td><select disabled={!edit} value={d.type} onChange={e => upd(i, { type: e.target.value as Drop['type'] })}><option>drop</option><option>kill</option><option>limit</option></select></td>
                  <td><input disabled={!edit || d.type !== 'limit'} type="number" value={d.levelLimit ?? 0} onChange={e => upd(i, { levelLimit: Number(e.target.value) })} /></td>
                  <td>{edit && <button className="danger" onClick={() => setDrops(drops.filter((_, j) => j !== i))}>Sil</button>}</td>
                </tr>))}</tbody>
            </table>
            {drops.length === 0 && <p className="muted">Bu mobun drop kaydı yok.</p>}
            {edit && <div className="row">
              <button onClick={() => setDrops([...drops, { itemVnum: 27001, count: 1, rate: 1, type: 'drop' }])}>+ Item Ekle</button>
              <span className="grow" />
              {dirty && <span className="pill warn">Kaydedilmemiş değişiklik</span>}
              <button disabled={!dirty} onClick={() => setDrops(JSON.parse(orig))}>Geri Al</button>
              <button className="primary" disabled={!dirty} onClick={save}>Canlı Uygula</button>
            </div>}
          </>}
        </div>
      </div>
    </div>
  )
}
