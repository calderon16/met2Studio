// Oyun sunucusuyla konuşan katman. Gerçek sunucu kurulunca yeni bir adaptör yazılır
// (ör. MysqlCoreAdapter) ve panel kodu değişmez.
export interface InventoryItem { slot: number; vnum: number; count: number }
export interface Player {
  id: number; name: string; account: string; job: string
  level: number; exp: number; yang: number
  channel: number | null; online: boolean; lastLogin: string
  inventory: InventoryItem[]
}
export interface Item { vnum: number; name: string; type: string; levelLimit: number }
export interface Mob { vnum: number; name: string; kind: 'mob' | 'boss' | 'metin' | 'npc'; level: number }
export interface DropEntry {
  itemVnum: number; count: number
  rate: number // yüzde, 0-100
  type: 'drop' | 'kill' | 'limit'
  levelLimit?: number; killCount?: number
}
export interface ChannelStatus { name: string; status: 'up' | 'down'; players: number; uptimeSec: number; pingMs: number }
export interface ServerStatus {
  online: number; totalAccounts: number
  channels: ChannelStatus[]
  cpu: number; ram: number; disk: number
  onlineHistory: { t: string; n: number }[]
}
export interface ApplyResult { applied: boolean; message: string }

export interface GameAdapter {
  readonly name: string
  status(): Promise<ServerStatus>
  searchPlayers(q: string, limit: number): Promise<Player[]>
  getPlayer(id: number): Promise<Player | null>
  searchItems(q: string, limit: number): Promise<Item[]>
  giveItem(playerId: number, vnum: number, count: number): Promise<ApplyResult>
  setLevel(playerId: number, level: number): Promise<ApplyResult>
  addExp(playerId: number, amount: number): Promise<ApplyResult>
  addYang(playerId: number, amount: number): Promise<ApplyResult>
  kick(playerId: number): Promise<ApplyResult>
  announce(message: string, channel: number | null): Promise<ApplyResult>
  searchMobs(q: string, limit: number): Promise<Mob[]>
  getDrops(mobVnum: number): Promise<DropEntry[]>
  // Drop değişikliğini kaydeder ve oyuna canlı uygular (reload).
  saveDrops(mobVnum: number, drops: DropEntry[]): Promise<ApplyResult>
}
