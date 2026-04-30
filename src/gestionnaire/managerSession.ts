const MANAGER_TOKEN_KEY = 'managerToken'

export function setManagerSession(token: string): void {
  sessionStorage.setItem(MANAGER_TOKEN_KEY, token)
}

export function clearManagerSession(): void {
  sessionStorage.removeItem(MANAGER_TOKEN_KEY)
}

export function getManagerToken(): string | null {
  return sessionStorage.getItem(MANAGER_TOKEN_KEY)
}

export function isManagerAuthenticated(): boolean {
  return Boolean(getManagerToken())
}
