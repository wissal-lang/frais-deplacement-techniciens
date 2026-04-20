const TECHNICIAN_SESSION_KEY = 'technicianAuth'

export function setTechnicianSession(): void {
  sessionStorage.setItem(TECHNICIAN_SESSION_KEY, '1')
}

export function clearTechnicianSession(): void {
  sessionStorage.removeItem(TECHNICIAN_SESSION_KEY)
}

export function isTechnicianAuthenticated(): boolean {
  return sessionStorage.getItem(TECHNICIAN_SESSION_KEY) === '1'
}
