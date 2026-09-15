import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

import { defineConfig, type ProxyOptions } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'

const BACKEND_URL = 'http://localhost:3000'

// DEV-HTTPS-START: удалить этот блок перед продакшеном, если HTTPS будет на nginx/домене.
const CERT_DIR = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../certs')
const DEV_HTTPS_KEY = path.join(CERT_DIR, 'key.pem')
const DEV_HTTPS_CERT = path.join(CERT_DIR, 'cert.pem')

function loadDevHttpsOptions() {
  if (!fs.existsSync(DEV_HTTPS_KEY) || !fs.existsSync(DEV_HTTPS_CERT)) {
    return undefined
  }

  return {
    key: fs.readFileSync(DEV_HTTPS_KEY),
    cert: fs.readFileSync(DEV_HTTPS_CERT),
  }
}
// DEV-HTTPS-END

const backendProxy: ProxyOptions = {
  target: BACKEND_URL,
  changeOrigin: true,
  secure: false,
}

const backendWsProxy: ProxyOptions = {
  ...backendProxy,
  ws: true,
}

function shouldServeNotificationsPage(req: { method?: string; headers: { accept?: string }; url?: string }): boolean {
  if (req.method !== 'GET') {
    return false
  }

  const url = req.url ?? ''

  if (
    url.startsWith('/notifications/push')
    || url.startsWith('/notifications/read-all')
    || url.startsWith('/notifications/consultation-preferences')
    || /\/notifications\/\d+\/read(?:\?|$)/.test(url)
  ) {
    return false
  }

  const accept = req.headers.accept ?? ''

  return accept.includes('text/html')
}

function shouldServeAdminPage(req: { method?: string; headers: { accept?: string }; url?: string }): boolean {
  if (req.method !== 'GET') {
    return false
  }

  const url = req.url ?? ''
  const accept = req.headers.accept ?? ''

  if (!accept.includes('text/html')) {
    return false
  }

  if (url.startsWith('/admin/users') || url.startsWith('/admin/academic/')) {
    return false
  }

  return url === '/admin'
    || url.startsWith('/admin?')
    || url.startsWith('/admin/edit-user')
    || url.startsWith('/admin/add-user')
    || url.startsWith('/admin/sessions')
    || url.startsWith('/admin/academic-structure')
}

const notificationsProxy: ProxyOptions = {
  ...backendWsProxy,
  bypass(req) {
    if (shouldServeNotificationsPage(req)) {
      return '/index.html'
    }

    return undefined
  },
}

const adminProxy: ProxyOptions = {
  ...backendWsProxy,
  bypass(req) {
    if (shouldServeAdminPage(req)) {
      return '/index.html'
    }

    return undefined
  },
}

export default defineConfig(({ mode }) => {
  // DEV-HTTPS: удалить логику isHttpsMode/basicSsl перед продакшеном.
  const isHttpsMode = mode === 'https'
  const manualHttps = loadDevHttpsOptions()
  const useFallbackSsl = isHttpsMode && !manualHttps
  const plugins = [vue()]

  if (useFallbackSsl) {
    plugins.push(basicSsl())
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    server: {
      host: true,
      port: 5173,
      // DEV-HTTPS: удалить строку https перед продакшеном.
      https: isHttpsMode ? manualHttps : undefined,   // ← исправлено
      proxy: {
        '/auth': backendProxy,
        '/admin': adminProxy,
        '/notifications': notificationsProxy,
        '/schedules': backendWsProxy,
        '/academic': backendProxy,
        '/education-department/schedules': backendProxy,
        '/uploads': backendProxy,
        '/socket.io': backendWsProxy,
      },
    },
    // DEV-HTTPS: удалить блок preview перед продакшеном.
    preview: {
      host: true,
      port: 5173,
      https: isHttpsMode ? manualHttps : undefined,   // ← исправлено
    },
  }
})