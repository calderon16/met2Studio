import { appendFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'

export interface AuditEntry { time: string; actor: string; action: string; target: string; detail: string }
const DIR = new URL('../data/', import.meta.url)
const FILE = new URL('audit.jsonl', DIR)

export function audit(e: Omit<AuditEntry, 'time'>) {
  mkdirSync(DIR, { recursive: true })
  appendFileSync(FILE, JSON.stringify({ time: new Date().toISOString(), ...e }) + '\n')
}
export function readAudit(limit: number): AuditEntry[] {
  if (!existsSync(FILE)) return []
  const lines = readFileSync(FILE, 'utf8').trim().split('\n').filter(Boolean)
  return lines.slice(-limit).reverse().map(l => JSON.parse(l) as AuditEntry)
}
