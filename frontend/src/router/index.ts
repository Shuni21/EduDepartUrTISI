import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { hasScheduleManageAccess } from '@/utils/educationDepartmentAccess'
import { getErrorPageConfig, getErrorRoute } from '@/config/errorPages'
import { scheduleTypeMeta, type ScheduleKind } from '@/views/schedule/scheduleOptions'
import { setPageTitle } from '@/utils/pageTitle'

const AUTH_STORAGE_KEY = 'edu-depart-auth-user'
const protectedScheduleTypes = new Set(['auditories'])

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'Главная' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { title: 'Вход' },
    },
    {
      path: '/schedule/:type',
      name: 'schedule-selection',
      component: () => import('../views/schedule/ScheduleSelectionView.vue'),
    },
    {
      path: '/schedule/:type/view',
      name: 'schedule-view',
      component: () => import('../views/schedule/Schedule.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { title: 'Личный кабинет' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { title: 'Настройки' },
      children: [
        {
          path: 'password',
          name: 'settings-password',
          component: () => import('../views/settings/SettingsChangePasswordView.vue'),
          meta: { title: 'Смена пароля' },
        },
        {
          path: 'sessions',
          name: 'settings-sessions',
          component: () => import('../views/settings/SettingsSessionsView.vue'),
          meta: { title: 'Сессии' },
        },
        {
          path: 'theme',
          name: 'settings-theme',
          component: () => import('../views/settings/SettingsThemeView.vue'),
          meta: { title: 'Тема' },
        },
      ],
    },
    {
      path: '/education-department/schedule-upload',
      name: 'schedule-upload',
      component: () => import('../views/ScheduleUpload.vue'),
      meta: { title: 'Загрузка расписания' },
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: () => import('../views/NotificationsView.vue'),
      meta: { title: 'Уведомления' },
    },
    {
      path: '/admin',
      name: 'admin-panel',
      component: () => import('../views/AdminPanel.vue'),
      meta: { title: 'Админ панель' },
      children: [
        {
          path: 'edit-user',
          name: 'admin-edit-user',
          component: () => import('../views/EditUsers.vue'),
          meta: { title: 'Пользователи' },
        },
        {
          path: 'edit-user/:id',
          name: 'admin-user-edit',
          component: () => import('../views/EditUser.vue'),
          meta: { title: 'Редактирование пользователя' },
        },
        {
          path: 'add-user',
          name: 'admin-add-user',
          component: () => import('../views/AddUser.vue'),
          meta: { title: 'Добавить пользователя' },
        },
        {
          path: 'sessions',
          name: 'admin-sessions',
          component: () => import('../views/AdminSessions.vue'),
          meta: { title: 'Активные сессии' },
        },
        {
          path: 'academic-structure',
          name: 'admin-academic-structure',
          component: () => import('../views/AdminAcademicStructure.vue'),
          meta: { title: 'Структура' },
        },
      ]
    },

    {
      path: '/error/:code',
      name: 'error',
      component: () => import('../views/ErrorView.vue'),
      props: true,
    },

    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: (to) => ({
        ...getErrorRoute('404'),
        query: to.fullPath !== '/' ? { from: to.fullPath } : undefined,
      }),
    },
  ],
})

router.beforeEach((to) => {
  if (typeof window !== 'undefined' && to.path.startsWith('/admin')) {
    const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY)

    if (!storedUser) {
      return {
        name: 'login',
        query: { redirect: to.fullPath },
      }
    }

    if (to.path === '/notifications') {
      const isAuthenticated = Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY))

      if (!isAuthenticated) {
        return {
          name: 'login',
          query: { redirect: to.fullPath },
        }
      }
    }

    try {
      const user = JSON.parse(storedUser)

      if (user.role !== 'admin') {
        return getErrorRoute('403')
      }
    } catch {
      return {
        name: 'login',
        query: { redirect: to.fullPath },
      }
    }
  }

  if (typeof window !== 'undefined' && to.path.startsWith('/education-department')) {
    const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY)

    if (!storedUser) {
      return {
        name: 'login',
        query: { redirect: to.fullPath },
      }
    }

    try {
      const user = JSON.parse(storedUser)

      if (!hasScheduleManageAccess(user)) {
        return getErrorRoute('403', 'У вас нет доступа к загрузке расписания')
      }
    } catch {
      return {
        name: 'login',
        query: { redirect: to.fullPath },
      }
    }
  }

  if (typeof window !== 'undefined' && to.path.startsWith('/settings')) {
    const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY)

    if (!storedUser) {
      return {
        name: 'login',
        query: { redirect: to.fullPath },
      }
    }
  }

  if (!to.path.startsWith('/schedule/')) {
    return true
  }

  const scheduleType = String(to.params.type ?? '')
  const isProtectedType = protectedScheduleTypes.has(scheduleType)

  if (!isProtectedType) {
    return true
  }

  if (typeof window === 'undefined') {
    return true
  }

  const isAuthenticated = Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY))

  if (isAuthenticated) {
    return true
  }

  return {
    name: 'login',
    query: {
      redirect: to.fullPath,
    },
  }
})

function resolveRouteTitle(to: RouteLocationNormalized): string | undefined {
  if (to.name === 'schedule-selection') {
    const type = String(to.params.type ?? '') as ScheduleKind
    return scheduleTypeMeta[type]?.title ?? 'Расписание'
  }

  if (to.name === 'error') {
    return getErrorPageConfig(to.params.code as string).title
  }

  const matched = [...to.matched].reverse()

  for (const record of matched) {
    const title = record.meta?.title

    if (typeof title === 'string' && title) {
      return title
    }
  }

  return undefined
}

router.afterEach((to) => {
  if (to.name === 'schedule-view') {
    return
  }

  setPageTitle(resolveRouteTitle(to))
})

export default router
