import bcrypt from 'bcryptjs'

export type Role = 'owner' | 'admin' | 'gm' | 'mod'
export type Perm = 'server.read' | 'players.read' | 'players.item' | 'players.stats' | 'players.kick' | 'drops.read' | 'drops.edit' | 'announce' | 'audit.read' | 'connection.manage'

const ALL: Perm[] = ['server.read', 'players.read', 'players.item', 'players.stats', 'players.kick', 'drops.read', 'drops.edit', 'announce', 'audit.read', 'connection.manage']
export const ROLE_PERMS: Record<Role, Perm[]> = {
  owner: ALL,
  admin: ALL,
  gm: ['server.read', 'players.read', 'players.item', 'players.stats', 'players.kick', 'drops.read', 'announce'],
  mod: ['server.read', 'players.read', 'players.kick'],
}

export interface User { username: string; hash: string; role: Role }

// Faz 1: kullanıcılar bellekte. Sonraki fazda panel DB'sine taşınacak (2FA ile).
export function bootstrapUsers(password: string): User[] {
  return [{ username: 'admin', hash: bcrypt.hashSync(password, 10), role: 'owner' }]
}

const attempts = new Map<string, { n: number; until: number }>()
export function tooManyAttempts(ip: string): boolean {
  const a = attempts.get(ip)
  return !!a && a.n >= 5 && Date.now() < a.until
}
export function recordFailure(ip: string) {
  const a = attempts.get(ip)
  if (!a || Date.now() > a.until) attempts.set(ip, { n: 1, until: Date.now() + 15 * 60_000 })
  else a.n++
}
export function clearFailures(ip: string) { attempts.delete(ip) }
