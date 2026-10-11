import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

// Navicat benzeri bağlantı profilleri. Şifre diskte AES-256-GCM ile şifreli tutulur.
export interface ConnInput { name: string; host: string; port: number; user: string; password: string; dbPrefix: string }
export interface ConnProfile extends Omit<ConnInput, 'password'> { id: string; passwordEnc: string }
export type PublicProfile = Omit<ConnProfile, 'passwordEnc'>

const DIR = new URL('../data/', import.meta.url)
const FILE = new URL('connections.json', DIR)
const KEYFILE = new URL('.key', DIR)

function key(): Buffer {
  mkdirSync(DIR, { recursive: true })
  if (!existsSync(KEYFILE)) writeFileSync(KEYFILE, randomBytes(32).toString('hex'), { mode: 0o600 })
  return Buffer.from(readFileSync(KEYFILE, 'utf8').trim(), 'hex')
}
function enc(plain: string): string {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', key(), iv)
  const body = Buffer.concat([c.update(plain, 'utf8'), c.final()])
  return [iv, c.getAuthTag(), body].map(b => b.toString('hex')).join('.')
}
function dec(s: string): string {
  const [iv, tag, body] = s.split('.').map(h => Buffer.from(h, 'hex'))
  const d = createDecipheriv('aes-256-gcm', key(), iv)
  d.setAuthTag(tag)
  return Buffer.concat([d.update(body), d.final()]).toString('utf8')
}

function load(): ConnProfile[] {
  return existsSync(FILE) ? (JSON.parse(readFileSync(FILE, 'utf8')) as ConnProfile[]) : []
}
function save(list: ConnProfile[]) {
  mkdirSync(DIR, { recursive: true })
  writeFileSync(FILE, JSON.stringify(list, null, 2), { mode: 0o600 })
}
const pub = ({ passwordEnc: _p, ...rest }: ConnProfile): PublicProfile => rest

export const listProfiles = (): PublicProfile[] => load().map(pub)
export function addProfile(i: ConnInput): PublicProfile {
  const { password, ...rest } = i
  const p: ConnProfile = { id: randomUUID(), ...rest, passwordEnc: enc(password) }
  save([...load(), p])
  return pub(p)
}
export function removeProfile(id: string) { save(load().filter(p => p.id !== id)) }
export function getCredentials(id: string): ConnInput | null {
  const p = load().find(x => x.id === id)
  if (!p) return null
  const { passwordEnc, id: _id, ...rest } = p
  return { ...rest, password: dec(passwordEnc) }
}
