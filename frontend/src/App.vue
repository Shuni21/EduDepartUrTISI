<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import logoUrtisi from '@/assets/urtisi-logo.png'
import avatarIcon from '@/assets/Avatar.png'
import caretIcon from '@/assets/Down.png'
import notificationIcon from '@/assets/notification.svg'
import { useAuthStore } from '@/stores/auth'
import type { ScheduleKind } from '@/views/schedule/scheduleOptions'
import { getPhotoUrl } from '@/config/api'
import { unregisterPushSubscription } from '@/api/pushNotifications'
import { useNotificationsStore } from '@/stores/notifications'
import { hasScheduleManageAccess } from '@/utils/educationDepartmentAccess'
import MobileBottomNav from '@/components/MobileBottomNav.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const notificationsStore = useNotificationsStore()

const router = useRouter()
const authStore = useAuthStore()

const showAuthHeader = computed(() => authStore.isAuthenticated)
const currentUserName = computed(() => authStore.currentUser?.name ?? '')
const currentUserRole = computed(() => authStore.roleLabel)
const currentUserPhoto = computed(() => getPhotoUrl(authStore.currentUser?.photoUrl))

const isAdmin = computed(() => authStore.currentUser?.role === 'admin')
const canManageSchedule = computed(() => hasScheduleManageAccess(authStore.currentUser))

const mainLinks = [
  { id: 'teachers', title: 'Расписание преподавателей' },
  { id: 'students', title: 'Расписание студентов' },
  { id: 'auditories', title: 'Расписание аудиторий' },
  { id: 'consults', title: 'Расписание консультаций' },
]

const visibleMainLinks = computed(() => {
  if (authStore.currentUser?.role === 'student') {
    return mainLinks.filter((item) => item.id === 'students' || item.id === 'consults')
  }

  return mainLinks
})

const getScheduleRoute = (type: string) => ({
  name: 'schedule-selection' as const,
  params: { type: type as ScheduleKind },
})

const onLogout = async () => {
  isProfileOpen.value = false
  await authStore.logout()
  await router.push({ name: 'home' })
}

const goToProfile = async () => {
  isProfileOpen.value = false

  await router.push({ name: 'profile' })
}

const goToAdminPanel = async () => {
  isProfileOpen.value = false

  await router.push({ name: 'admin-panel' })
}

const goToScheduleUpload = async () => {
  isProfileOpen.value = false

  await router.push({ name: 'schedule-upload' })
}

const goToSettings = async () => {
  isProfileOpen.value = false

  await router.push({ name: 'settings' })
}

const isProfileOpen = ref(false)
let connectedNotificationsToken: string | null = null

const toggleProfileMenu = () => {
  isProfileOpen.value = !isProfileOpen.value
}

const syncNotificationsConnection = () => {
  if (!authStore.isAuthenticated) {
    notificationsStore.disconnectLiveUpdates()
    connectedNotificationsToken = null
    void unregisterPushSubscription()
    return
  }

  const accessToken = localStorage.getItem('access_token')

  if (!accessToken || accessToken === connectedNotificationsToken) {
    return
  }

  connectedNotificationsToken = accessToken
  void notificationsStore.loadNotifications()
  notificationsStore.connectLiveUpdates(accessToken)
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement

  if (!target.closest('.profile-wrapper')) {
    isProfileOpen.value = false
  }
}

const handleTokenRefreshed = () => {
  connectedNotificationsToken = null
  syncNotificationsConnection()
}

const handleServiceWorkerMessage = (event: MessageEvent) => {
  if (event.data?.type !== 'notification-click') {
    return
  }

  const notificationId = event.data.notificationId
  const query = notificationId ? { id: String(notificationId) } : {}

  void router.push({
    name: 'notifications',
    query,
  })
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('auth:token-refreshed', handleTokenRefreshed)

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)
  }

  syncNotificationsConnection()

  sessionCheckTimer = window.setInterval(async () => {
    if (!authStore.isAuthenticated) {
      return
    }

    await authStore.validateSession()
  }, 15000)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('auth:token-refreshed', handleTokenRefreshed)

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
  }

  notificationsStore.disconnectLiveUpdates()
  if (sessionCheckTimer !== null) {
    window.clearInterval(sessionCheckTimer)
  }
})

watch(
  () => authStore.isAuthenticated,
  () => {
    syncNotificationsConnection()
  },
)

let sessionCheckTimer: number | null = null

const handleVisibilityChange = async () => {
  if (document.visibilityState !== 'visible' || !authStore.isAuthenticated) {
    return
  }

  await authStore.validateSession()
  syncNotificationsConnection()
}

const currentYear = new Date().getFullYear()
</script>

<template>
  <div class="app-shell" :class="{ 'app-shell--mobile-nav': showAuthHeader }">
    <header class="topbar">
      <RouterLink class="brand" to="/" aria-label="УрТИСИ">
        <img :src="logoUrtisi" alt="Логотип УрТИСИ" />
      </RouterLink>

      <template v-if="showAuthHeader">
        <nav class="menu">
          <RouterLink
              v-for="link in visibleMainLinks"
              :key="link.id"
              :to="getScheduleRoute(link.id)"
          >
            {{ link.title }}
          </RouterLink>
        </nav>

        <div class="profile-actions">
          <RouterLink
            :to="{ name: 'notifications' }"
            class="notifications-icon-link"
            aria-label="Уведомления"
          >
            <img :src="notificationIcon" alt="" />
            <span v-if="notificationsStore.unreadCount > 0" class="notifications-badge">
              {{ notificationsStore.unreadCount }}
            </span>
          </RouterLink>

          <div class="profile-wrapper">
            <button class="profile-btn" type="button" @click="toggleProfileMenu">
              <img
                class="profile-icon"
                :src="currentUserPhoto || avatarIcon"
                alt=""
              />
              <span class="profile-name">{{ currentUserName }}</span>
              <span class="profile-role">{{ currentUserRole }}</span>
              <img class="caret" :src="caretIcon" alt="" />
            </button>

            <div v-if="isProfileOpen" class="profile-dropdown">
              <button
                class="dropdown-item"
                type="button"
                @click="goToProfile"
              >
                Личный кабинет
              </button>

              <button
                v-if="isAdmin"
                class="dropdown-item"
                type="button"
                @click="goToAdminPanel"
              >
                Админ панель
              </button>

              <button
                v-if="canManageSchedule"
                class="dropdown-item"
                type="button"
                @click="goToScheduleUpload"
              >
                Загрузка расписания
              </button>

              <button
                  class="dropdown-item"
                  type="button"
                  @click="goToSettings"
              >
                Настройки
              </button>

              <button
                class="dropdown-item danger"
                type="button"
                @click="onLogout"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="header-spacer" />
        <div class="header-auth">
          <RouterLink to="/login" class="signin-link">
            <button class="signin-btn" type="button">Войти</button>
          </RouterLink>
        </div>
      </template>
    </header>

    <main class="page-content">
      <RouterView />
    </main>

    <footer class="bottombar" :class="{ 'bottombar--mobile-nav': showAuthHeader }">
      <MobileBottomNav v-if="showAuthHeader" />
      <div class="bottombar__info">
        <p class="bottombar__copyright">
          © {{ currentYear }} УрТИСИ СибГУТИ
        </p>

        <p class="bottombar__author">
          Разработчик: Shuni🌸
        </p>
      </div>
    </footer>

    <ConfirmDialog />
  </div>
</template>

