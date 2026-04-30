const TECHNICIAN_TOKEN_KEY = 'technicianToken'

export function setTechnicianSession(token: string): void {
  sessionStorage.setItem(TECHNICIAN_TOKEN_KEY, token)
}

export function clearTechnicianSession(): void {
  sessionStorage.removeItem(TECHNICIAN_TOKEN_KEY)
}

export function getTechnicianToken(): string | null {
  return sessionStorage.getItem(TECHNICIAN_TOKEN_KEY)
}

export function isTechnicianAuthenticated(): boolean {
  return Boolean(getTechnicianToken())
}
