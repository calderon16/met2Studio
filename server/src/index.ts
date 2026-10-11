import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { MockAdapter } from './adapter/mock.js'
import { MysqlAdapter, probe } from './adapter/mysql.js'
import { addProfile, getCredentials, listProfiles, removeProfile } from './connections.js'
import type { GameAdapter } from './adapter/types.js'
import { bootstrapUsers, clearFailures, recordFailure, ROLE_PERMS, tooManyAttempts, type Perm, type Role } from './auth.js'
import { audit, readAudit } from './audit.js'

const PROD = process.env.NODE_ENV === 'production'
const jwtSecret = process.env.JWT_SECRET ?? (PROD ? '' : randomBytes(32).toString('hex'))
if (!jwtSecret) throw new Error('JWT_SECRET zorunlu (production)')
const adminPassword = process.env.ADMIN_PASSWORD ?? (PROD ? '' : randomBytes(9).toString('base64url'))
if (!adminPassword) throw new Error('ADMIN_PASSWORD zorunlu (production)')
if (!process.env.ADMIN_PASSWORD) console.log(`[dev] admin şifresi: ${adminPassword}`)

let adapter: GameAdapter = new MockAdapter() // Bağlantı kurulunca MysqlAdapter ile değiştirilir
const users = bootstrapUsers(adminPassword)

const app = Fastify({ logger: true })
await app.register(cors, { origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' })
await app.register(jwt, { secret: jwtSecret, sign: { expiresIn: '8h' } })

type Claims = { username: string; role: Role }
const authed = (...perms: Perm[]) => async (req: FastifyRequest, reply: FastifyReply) => {
  try { await req.jwtVerify() } catch { return reply.code(401).send({ error: 'Oturum gerekli' }) }
  const { role } = req.user as Claims
  if (!perms.every(p => ROLE_PERMS[role].includes(p))) return reply.code(403).send({ error: 'Yetkiniz yok' })
}
const actor = (req: FastifyRequest) => (req.user as Claims).username

app.setErrorHandler((err: Error & { statusCode?: number }, _req, reply) => {
  if (err instanceof z.ZodError) return reply.code(400).send({ error: 'Geçersiz veri', issues: err.issues })
  reply.code(err.statusCode ?? 400).send({ error: err.message })
})

app.post('/api/login', async (req, reply) => {
  const body = z.object({ username: z.string().max(64), password: z.string().max(200) }).parse(req.body)
  if (tooManyAttempts(req.ip)) return reply.code(429).send({ error: 'Çok fazla deneme, 15 dk sonra tekrar deneyin' })
  const u = users.find(x => x.username === body.username)
  if (!u || !bcrypt.compareSync(body.password, u.hash)) {
    recordFailure(req.ip)
    audit({ actor: body.username, action: 'login.fail', target: '-', detail: req.ip })
    return reply.code(401).send({ error: 'Kullanıcı adı veya şifre hatalı' })
  }
  clearFailures(req.ip)
  audit({ actor: u.username, action: 'login', target: '-', detail: req.ip })
  const token = app.jwt.sign({ username: u.username, role: u.role } satisfies Claims)
  return { token, user: { username: u.username, role: u.role, perms: ROLE_PERMS[u.role] } }
})

app.get('/api/me', { preHandler: authed() }, async req => {
  const c = req.user as Claims
  return { username: c.username, role: c.role, perms: ROLE_PERMS[c.role], adapter: adapter.name }
})

app.get('/api/status', { preHandler: authed('server.read') }, () => adapter.status())

const q = z.object({ q: z.string().max(64).default(''), limit: z.coerce.number().int().min(1).max(100).default(30) })
app.get('/api/players', { preHandler: authed('players.read') }, req => { const x = q.parse(req.query); return adapter.searchPlayers(x.q, x.limit) })
app.get('/api/players/:id', { preHandler: authed('players.read') }, async (req, reply) => {
  const p = await adapter.getPlayer(z.coerce.number().int().parse((req.params as { id: string }).id))
  return p ?? reply.code(404).send({ error: 'Oyuncu bulunamadı' })
})
app.get('/api/items', { preHandler: authed('players.read') }, req => { const x = q.parse(req.query); return adapter.searchItems(x.q, x.limit) })

const pid = z.coerce.number().int().positive()
async function act(req: FastifyRequest, action: string, detail: string, run: () => Promise<{ message: string }>) {
  const id = (req.params as { id: string }).id
  const r = await run()
  audit({ actor: actor(req), action, target: `player:${id}`, detail })
  return r
}
app.post('/api/players/:id/item', { preHandler: authed('players.item') }, req => {
  const id = pid.parse((req.params as { id: string }).id)
  const b = z.object({ vnum: z.number().int().positive(), count: z.number().int().min(1).max(200) }).parse(req.body)
  return act(req, 'player.item', `vnum=${b.vnum} count=${b.count}`, () => adapter.giveItem(id, b.vnum, b.count))
})
app.post('/api/players/:id/level', { preHandler: authed('players.stats') }, req => {
  const id = pid.parse((req.params as { id: string }).id)
  const b = z.object({ level: z.number().int().min(1).max(250) }).parse(req.body)
  return act(req, 'player.level', `level=${b.level}`, () => adapter.setLevel(id, b.level))
})
app.post('/api/players/:id/exp', { preHandler: authed('players.stats') }, req => {
  const id = pid.parse((req.params as { id: string }).id)
  const b = z.object({ amount: z.number().int().min(1).max(2_000_000_000) }).parse(req.body)
  return act(req, 'player.exp', `amount=${b.amount}`, () => adapter.addExp(id, b.amount))
})
app.post('/api/players/:id/yang', { preHandler: authed('players.stats') }, req => {
  const id = pid.parse((req.params as { id: string }).id)
  const b = z.object({ amount: z.number().int().min(1).max(2_000_000_000) }).parse(req.body)
  return act(req, 'player.yang', `amount=${b.amount}`, () => adapter.addYang(id, b.amount))
})
app.post('/api/players/:id/kick', { preHandler: authed('players.kick') }, req => {
  const id = pid.parse((req.params as { id: string }).id)
  return act(req, 'player.kick', '-', () => adapter.kick(id))
})
app.post('/api/announce', { preHandler: authed('announce') }, async req => {
  const b = z.object({ message: z.string().min(1).max(200), channel: z.number().int().nullable() }).parse(req.body)
  const r = await adapter.announce(b.message, b.channel)
  audit({ actor: actor(req), action: 'announce', target: String(b.channel ?? 'all'), detail: b.message })
  return r
})

app.get('/api/mobs', { preHandler: authed('drops.read') }, req => { const x = q.parse(req.query); return adapter.searchMobs(x.q, x.limit) })
app.get('/api/mobs/:vnum/drops', { preHandler: authed('drops.read') }, req => adapter.getDrops(pid.parse((req.params as { vnum: string }).vnum)))
const dropSchema = z.array(z.object({
  itemVnum: z.number().int().positive(), count: z.number().int().min(1).max(10000),
  rate: z.number().min(0.0001).max(100), type: z.enum(['drop', 'kill', 'limit']),
  levelLimit: z.number().int().min(0).max(250).optional(), killCount: z.number().int().min(1).optional(),
})).max(200)
app.put('/api/mobs/:vnum/drops', { preHandler: authed('drops.edit') }, async req => {
  const vnum = pid.parse((req.params as { vnum: string }).vnum)
  const drops = dropSchema.parse(req.body)
  const before = await adapter.getDrops(vnum)
  const r = await adapter.saveDrops(vnum, drops)
  audit({ actor: actor(req), action: 'drops.save', target: `mob:${vnum}`, detail: `önce=${before.length} sonra=${drops.length}` })
  return r
})

app.get('/api/audit', { preHandler: authed('audit.read') }, () => readAudit(200))

// --- Navicat tarzı bağlantı yönetimi (sadece owner/admin) ---
const connSchema = z.object({
  name: z.string().min(1).max(64), host: z.string().min(1).max(255), port: z.number().int().min(1).max(65535).default(3306),
  user: z.string().min(1).max(64), password: z.string().max(200), dbPrefix: z.string().max(32).default(''),
})
app.get('/api/connections', { preHandler: authed('connection.manage') }, () => ({ profiles: listProfiles(), active: adapter.name }))
app.post('/api/connections/test', { preHandler: authed('connection.manage') }, async req => {
  const c = connSchema.parse(req.body)
  try { return { ok: true, ...(await probe(c)) } } catch (e) { return { ok: false, error: (e as Error).message } }
})
app.post('/api/connections', { preHandler: authed('connection.manage') }, async req => {
  const p = addProfile(connSchema.parse(req.body))
  audit({ actor: actor(req), action: 'connection.add', target: p.id, detail: `${p.user}@${p.host}:${p.port}` })
  return p
})
app.delete('/api/connections/:id', { preHandler: authed('connection.manage') }, async req => {
  const id = (req.params as { id: string }).id
  removeProfile(id)
  audit({ actor: actor(req), action: 'connection.remove', target: id, detail: '-' })
  return { ok: true }
})
app.post('/api/connections/:id/connect', { preHandler: authed('connection.manage') }, async req => {
  const id = (req.params as { id: string }).id
  const c = getCredentials(id)
  if (!c) throw new Error('Profil bulunamadı')
  await probe(c) // bağlanamazsa hata fırlatır, mevcut adaptör korunur
  const old = adapter
  adapter = new MysqlAdapter(c)
  if (old instanceof MysqlAdapter) await old.close()
  audit({ actor: actor(req), action: 'connection.connect', target: id, detail: `${c.user}@${c.host}:${c.port}` })
  return { ok: true, active: adapter.name }
})
app.post('/api/connections/disconnect', { preHandler: authed('connection.manage') }, async req => {
  const old = adapter
  adapter = new MockAdapter()
  if (old instanceof MysqlAdapter) await old.close()
  audit({ actor: actor(req), action: 'connection.disconnect', target: '-', detail: '-' })
  return { ok: true, active: adapter.name }
})

const port = Number(process.env.PORT ?? 3001)
await app.listen({ port, host: process.env.HOST ?? '127.0.0.1' })
