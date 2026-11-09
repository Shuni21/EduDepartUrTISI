import { bootstrapTheme, useThemeStore } from '@/stores/theme'

bootstrapTheme()
import './assets/styles/main.css'
import './assets/styles/common.css'
import './assets/styles/home.css'
import './assets/styles/login.css'
import './assets/styles/profile.css'
import './assets/styles/admin.css'
import './assets/styles/not-found.css'
import './assets/styles/schedule.css'
import './assets/styles/notifications.css'
import './assets/styles/settings.css'
import './assets/styles/confirm-dialog.css'

import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'
import { warmOwnPersonalScheduleCache } from '@/utils/personalScheduleCache'



const app = createApp(App)
const pinia = createPinia()
const authStore = useAuthStore(pinia)

function setupPersonalScheduleWarmup() {
  const warmPersonalSchedule = () => {
    void warmOwnPersonalScheduleCache(authStore.currentUser)
  }

  watch(
    () => authStore.currentUser,
    () => {
      warmPersonalSchedule()
    },
    { immediate: true },
  )

  if (typeof window !== 'undefined') {
    window.addEventListener('online', warmPersonalSchedule)
  }
}

app.use(pinia)
app.use(router)

void authStore.initializeAuth().finally(() => {
  setupPersonalScheduleWarmup()
  useThemeStore(pinia).initializeTheme()
  app.mount('#app')
})

