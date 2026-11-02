const DEFAULT_API_PORT = '3000'

function shouldUseSameOriginApi(): boolean {
  return import.meta.env.VITE_USE_PROXY === 'true'
}

export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim()

  if (fromEnv) {
    return fromEnv.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location

    if (shouldUseSameOriginApi()) {
      return origin
    }

    const protocol = window.location.protocol === 'https:' ? 'https' : 'http'

    return `${protocol}://${hostname}:${DEFAULT_API_PORT}`
  }

  return `http://localhost:${DEFAULT_API_PORT}`
}

export function getSessionsSocketUrl(): string {
  return `${getApiBaseUrl()}/admin/sessions`
}

export function getScheduleSocketUrl(): string{
  return `${getApiBaseUrl()}/schedules/live`
}

export function getNotificationsSocketUrl(): string {
  return `${getApiBaseUrl()}/notifications/live`
}