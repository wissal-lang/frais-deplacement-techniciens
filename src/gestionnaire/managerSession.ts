const MANAGER_SESSION_KEY = 'managerAuth'

export function setManagerSession(): void {
  sessionStorage.setItem(MANAGER_SESSION_KEY, '1')
}

export function clearManagerSession(): void {
  sessionStorage.removeItem(MANAGER_SESSION_KEY)
}

export function isManagerAuthenticated(): boolean {
  return sessionStorage.getItem(MANAGER_SESSION_KEY) === '1'
}
