import mysql, { type Pool, type RowDataPacket } from 'mysql2/promise'
import type { ConnInput } from '../connections.js'
import type { ApplyResult, DropEntry, GameAdapter, Item, Mob, Player, ServerStatus } from './types.js'

// DİKKAT: Tablo/kolon adları yaygın Metin2 şemasına göre yazıldı ve gerçek sunucu
// kurulunca DOĞRULANMALI (Faz 0). Güvenlik gereği DB'den yalnızca okuma ve item_award
// ile teslimat yapılır; level/exp/yang/kick/drop canlı işlemleri core köprüsü (Faz 3) bekler.
const BRIDGE = 'Bu işlem için core köprüsü gerekli (Faz 3). Online oyuncunun DB satırı doğrudan değiştirilmez.'

export interface ProbeResult { version: string; databases: string[]; tables: Record<string, boolean> }
const WANTED: [string, string][] = [['account', 'account'], ['player', 'player'], ['player', 'item'], ['player', 'item_award'], ['player', 'item_proto'], ['player', 'mob_proto']]

export async function probe(c: ConnInput): Promise<ProbeResult> {
  const conn = await mysql.createConnection({ host: c.host, port: c.port, user: c.user, password: c.password, connectTimeout: 8000 })
  try {
    const [v] = await conn.query<RowDataPacket[]>('SELECT VERSION() AS v')
    const [dbs] = await conn.query<RowDataPacket[]>('SHOW DATABASES')
    const databases = dbs.map(r => String(Object.values(r)[0]))
    const tables: Record<string, boolean> = {}
    for (const [db, t] of WANTED) {
      const schema = c.dbPrefix + db
      const [r] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema=? AND table_name=?', [schema, t])
      tables[`${schema}.${t}`] = Number(r[0].n) > 0
    }
    return { version: String(v[0].v), databases, tables }
  } finally { await conn.end() }
}

export class MysqlAdapter implements GameAdapter {
  readonly name = 'mysql'
  private pool: Pool
  private db: (n: string) => string
  constructor(c: ConnInput) {
    this.pool = mysql.createPool({ host: c.host, port: c.port, user: c.user, password: c.password, connectionLimit: 5, connectTimeout: 8000 })
    this.db = n => '`' + (c.dbPrefix + n).replace(/[^\w]/g, '') + '`'
  }
  close() { return this.pool.end() }

  async status(): Promise<ServerStatus> {
    const [pr] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS n FROM ${this.db('player')}.player`)
    const [ac] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS n FROM ${this.db('account')}.account`)
    // Online sayısı/kanal/CPU DB'den okunamaz; core köprüsü gelince doldurulacak.
    return { online: 0, totalAccounts: Number(ac[0].n), channels: [], cpu: 0, ram: 0, disk: 0, onlineHistory: [], ...{ totalPlayers: Number(pr[0].n) } }
  }
  private map(r: RowDataPacket): Player {
    return { id: r.id, name: r.name, account: r.login ?? String(r.account_id), job: String(r.job), level: r.level, exp: Number(r.exp), yang: Number(r.gold), channel: null, online: false, lastLogin: r.last_play ? new Date(r.last_play).toISOString() : '', inventory: [] }
  }
  async searchPlayers(q: string, limit: number) {
    const like = `%${q.trim()}%`
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT p.id,p.name,p.job,p.level,p.exp,p.gold,p.last_play,p.account_id,a.login FROM ${this.db('player')}.player p LEFT JOIN ${this.db('account')}.account a ON a.id=p.account_id WHERE p.name LIKE ? OR a.login LIKE ? ORDER BY p.last_play DESC LIMIT ?`, [like, like, limit])
    return rows.map(r => this.map(r))
  }
  async getPlayer(id: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT p.id,p.name,p.job,p.level,p.exp,p.gold,p.last_play,p.account_id,a.login FROM ${this.db('player')}.player p LEFT JOIN ${this.db('account')}.account a ON a.id=p.account_id WHERE p.id=?`, [id])
    if (!rows[0]) return null
    const pl = this.map(rows[0])
    const [inv] = await this.pool.query<RowDataPacket[]>(`SELECT pos,vnum,count FROM ${this.db('player')}.item WHERE owner_id=? AND window='INVENTORY'`, [id])
    pl.inventory = inv.map(i => ({ slot: i.pos, vnum: i.vnum, count: i.count }))
    return pl
  }
  async searchItems(q: string, limit: number): Promise<Item[]> {
    const s = q.trim()
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT vnum, locale_name FROM ${this.db('player')}.item_proto WHERE locale_name LIKE ? OR vnum LIKE ? LIMIT ?`, [`%${s}%`, `${s}%`, limit])
    return rows.map(r => ({ vnum: r.vnum, name: r.locale_name, type: '-', levelLimit: 0 }))
  }
  async giveItem(playerId: number, vnum: number, count: number): Promise<ApplyResult> {
    // item_award: core tabloyu tarayıp online/offline oyuncuya teslim eder (şema doğrulanmalı).
    const [rows] = await this.pool.query<RowDataPacket[]>(`SELECT a.login FROM ${this.db('player')}.player p JOIN ${this.db('account')}.account a ON a.id=p.account_id WHERE p.id=?`, [playerId])
    if (!rows[0]) throw new Error('Oyuncu bulunamadı')
    await this.pool.query(`INSERT INTO ${this.db('player')}.item_award (login, vnum, count, given_time, why, mall) VALUES (?,?,?,NOW(),'Metin2Studio',1)`, [rows[0].login, vnum, count])
    return { applied: true, message: `item_award kuyruğuna eklendi (${count}x ${vnum}); oyuncu mall'dan alır` }
  }
  async setLevel(): Promise<ApplyResult> { throw new Error(BRIDGE) }
  async addExp(): Promise<ApplyResult> { throw new Error(BRIDGE) }
  async addYang(): Promise<ApplyResult> { throw new Error(BRIDGE) }
  async kick(): Promise<ApplyResult> { throw new Error(BRIDGE) }
  async announce(): Promise<ApplyResult> { throw new Error(BRIDGE) }
  async searchMobs(q: string, limit: number): Promise<Mob[]> {
    const s = q.trim()
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT vnum, locale_name, level, rank FROM ${this.db('player')}.mob_proto WHERE locale_name LIKE ? OR vnum LIKE ? LIMIT ?`, [`%${s}%`, `${s}%`, limit])
    return rows.map(r => ({ vnum: r.vnum, name: r.locale_name, kind: r.rank >= 4 ? 'boss' as const : 'mob' as const, level: r.level }))
  }
  async getDrops(): Promise<DropEntry[]> { throw new Error('Drop dosyaları henüz yapılandırılmadı (Faz 3).') }
  async saveDrops(): Promise<ApplyResult> { throw new Error('Drop dosyaları henüz yapılandırılmadı (Faz 3).') }
}
