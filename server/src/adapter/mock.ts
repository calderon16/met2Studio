import type { ApplyResult, DropEntry, GameAdapter, Item, Mob, Player, ServerStatus } from './types.js'

const ITEMS: Item[] = [
  { vnum: 11200, name: 'Savaşçı Zırhı +0', type: 'Zırh', levelLimit: 30 },
  { vnum: 19, name: 'Kılıç +9', type: 'Silah', levelLimit: 20 },
  { vnum: 27001, name: 'Kırmızı İksir (S)', type: 'Tüketim', levelLimit: 0 },
  { vnum: 27002, name: 'Kırmızı İksir (M)', type: 'Tüketim', levelLimit: 0 },
  { vnum: 50300, name: 'Beceri Kitabı', type: 'Kitap', levelLimit: 30 },
  { vnum: 70038, name: 'Mavi Büyülü Taş', type: 'Malzeme', levelLimit: 0 },
  { vnum: 71084, name: 'Yükseltme Parşömeni', type: 'Tüketim', levelLimit: 0 },
  { vnum: 30003, name: 'Kurt Postu', type: 'Malzeme', levelLimit: 0 },
]
const MOBS: Mob[] = [
  { vnum: 101, name: 'Yaban Köpeği', kind: 'mob', level: 5 },
  { vnum: 191, name: 'Kurt', kind: 'mob', level: 10 },
  { vnum: 2091, name: 'Kraliçe Örümcek', kind: 'boss', level: 40 },
  { vnum: 6091, name: 'Alev Kralı', kind: 'boss', level: 75 },
  { vnum: 8001, name: 'Metin Taşı (Lv20)', kind: 'metin', level: 20 },
  { vnum: 20001, name: 'Silah Tüccarı', kind: 'npc', level: 1 },
]
const JOBS = ['Savaşçı', 'Ninja', 'Sura', 'Şaman']

function makePlayers(): Player[] {
  const names = ['AslanKral', 'GolgeAvci', 'BuzSura', 'RuzgarSaman', 'Demirci61', 'KaraPusu', 'Bozkurt', 'Yildirim']
  return names.map((name, i) => ({
    id: i + 1, name, account: `hesap${i + 1}`, job: JOBS[i % 4],
    level: 20 + i * 9, exp: i * 12000, yang: 100000 * (i + 1),
    channel: i % 3 === 0 ? null : (i % 2) + 1, online: i % 3 !== 0,
    lastLogin: new Date(Date.now() - i * 3600_000).toISOString(),
    inventory: [{ slot: 0, vnum: 27001, count: 50 }, { slot: 1, vnum: 19, count: 1 }],
  }))
}

const ok = (message: string): ApplyResult => ({ applied: true, message })

export class MockAdapter implements GameAdapter {
  readonly name = 'mock'
  private players = makePlayers()
  private drops = new Map<number, DropEntry[]>([
    [191, [{ itemVnum: 30003, count: 1, rate: 40, type: 'drop' }, { itemVnum: 27001, count: 2, rate: 15, type: 'drop' }]],
    [2091, [{ itemVnum: 71084, count: 1, rate: 8, type: 'drop' }, { itemVnum: 50300, count: 1, rate: 2.5, type: 'limit', levelLimit: 40 }]],
  ])

  async status(): Promise<ServerStatus> {
    const online = this.players.filter(p => p.online).length
    return {
      online, totalAccounts: 1280,
      channels: [1, 2, 3, 4].map(n => ({
        name: `CH${n}`, status: n === 4 ? 'down' : 'up',
        players: this.players.filter(p => p.channel === n).length,
        uptimeSec: n === 4 ? 0 : 86400 * n, pingMs: 8 + n * 3,
      })),
      cpu: 23 + Math.round(Math.random() * 10), ram: 48, disk: 61,
      onlineHistory: Array.from({ length: 24 }, (_, h) => ({ t: `${String(h).padStart(2, '0')}:00`, n: 20 + Math.round(40 * Math.abs(Math.sin(h / 4))) })),
    }
  }
  async searchPlayers(q: string, limit: number) {
    const s = q.trim().toLowerCase()
    return this.players.filter(p => !s || p.name.toLowerCase().includes(s) || p.account.toLowerCase().includes(s)).slice(0, limit)
  }
  async getPlayer(id: number) { return this.players.find(p => p.id === id) ?? null }
  async searchItems(q: string, limit: number) {
    const s = q.trim().toLowerCase()
    return ITEMS.filter(i => !s || i.name.toLowerCase().includes(s) || String(i.vnum).startsWith(s)).slice(0, limit)
  }
  private need(id: number): Player {
    const p = this.players.find(x => x.id === id)
    if (!p) throw new Error('Oyuncu bulunamadı')
    return p
  }
  async giveItem(id: number, vnum: number, count: number) {
    const p = this.need(id)
    if (!ITEMS.some(i => i.vnum === vnum)) throw new Error('Geçersiz item vnum')
    const ex = p.inventory.find(i => i.vnum === vnum)
    if (ex) ex.count += count
    else p.inventory.push({ slot: p.inventory.length, vnum, count })
    return ok(`${p.name} oyuncusuna ${count}x ${vnum} verildi`)
  }
  async setLevel(id: number, level: number) { const p = this.need(id); p.level = level; p.exp = 0; return ok(`${p.name} seviyesi ${level} yapıldı`) }
  async addExp(id: number, amount: number) { const p = this.need(id); p.exp += amount; return ok(`${p.name} +${amount} EXP`) }
  async addYang(id: number, amount: number) { const p = this.need(id); p.yang += amount; return ok(`${p.name} +${amount} yang`) }
  async kick(id: number) { const p = this.need(id); p.online = false; p.channel = null; return ok(`${p.name} oyundan atıldı`) }
  async announce(message: string, channel: number | null) { return ok(`Duyuru gönderildi (${channel ?? 'tüm kanallar'}): ${message}`) }
  async searchMobs(q: string, limit: number) {
    const s = q.trim().toLowerCase()
    return MOBS.filter(m => !s || m.name.toLowerCase().includes(s) || String(m.vnum).startsWith(s)).slice(0, limit)
  }
  async getDrops(vnum: number) { return structuredClone(this.drops.get(vnum) ?? []) }
  async saveDrops(vnum: number, drops: DropEntry[]) {
    if (!MOBS.some(m => m.vnum === vnum)) throw new Error('Mob bulunamadı')
    this.drops.set(vnum, structuredClone(drops))
    return ok(`Mob ${vnum} drop listesi kaydedildi ve canlı uygulandı (mock)`)
  }
}
