export interface Me { username: string; role: string; perms: string[]; adapter: string }
const KEY = 'm2s_token'
export const getToken = () => sessionStorage.getItem(KEY)
export const setToken = (t: string | null) => (t ? sessionStorage.setItem(KEY, t) : sessionStorage.removeItem(KEY))

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch('/api' + path, {
    method: init.method ?? (init.body ? 'POST' : 'GET'),
    headers: { 'content-type': 'application/json', ...(getToken() ? { authorization: `Bearer ${getToken()}` } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && path !== '/login') { setToken(null); location.href = '/login' }
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Hata ${res.status}`)
  return data as T
}
