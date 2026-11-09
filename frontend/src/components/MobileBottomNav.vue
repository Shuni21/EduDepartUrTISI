<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { ScheduleKind } from '@/views/schedule/scheduleOptions'
import MobileNavScheduleLink from '@/components/MobileNavScheduleLink.vue'
import { getMyScheduleRoute, isMyScheduleActive } from '@/utils/myScheduleNavigation'

type NavLink = {
  id: ScheduleKind
  shortTitle: string
}

const route = useRoute()
const authStore = useAuthStore()

const allLinks: NavLink[] = [
  { id: 'teachers', shortTitle: 'Преподы' },
  { id: 'students', shortTitle: 'Студенты' },
  { id: 'auditories', shortTitle: 'Аудитории' },
  { id: 'consults', shortTitle: 'Консультации' },
]

const role = computed(() => authStore.currentUser?.role)

const showMySchedule = computed(() => role.value === 'student' || role.value === 'teacher')

const myScheduleRoute = computed(() => getMyScheduleRoute(authStore.currentUser))

const leftLinks = computed(() => {
  if (role.value === 'student') {
    return allLinks.filter((item) => item.id === 'teachers')
  }

  if (role.value === 'teacher') {
    return allLinks.filter((item) => item.id === 'students')
  }

  const splitAt = Math.ceil(allLinks.length / 2)
  return allLinks.slice(0, splitAt)
})

const rightLinks = computed(() => {
  if (role.value === 'student') {
    return allLinks.filter((item) => item.id === 'consults')
  }

  if (role.value === 'teacher') {
    return allLinks.filter((item) => item.id === 'auditories' || item.id === 'consults')
  }

  const splitAt = Math.ceil(allLinks.length / 2)
  return allLinks.slice(splitAt)
})

const isHomeActive = computed(() => route.name === 'home')

const isMyScheduleLinkActive = computed(() =>
  isMyScheduleActive(route.name, route.params, route.query, authStore.currentUser),
)

const isScheduleLinkActive = (id: ScheduleKind) => {
  if (route.name !== 'schedule-selection' && route.name !== 'schedule-view') {
    return false
  }

  return route.params.type === id
}
</script>

<template>
  <nav class="mobile-nav" aria-label="Мобильная навигация">
    <RouterLink
      v-if="showMySchedule && myScheduleRoute"
      class="mobile-nav__item"
      :class="{ 'mobile-nav__item--active': isMyScheduleLinkActive }"
      :to="myScheduleRoute"
    >
      <span class="mobile-nav__label">Моё расписание</span>
    </RouterLink>

    <MobileNavScheduleLink
      v-for="link in leftLinks"
      :key="link.id"
      :link="link"
      :active="isScheduleLinkActive(link.id)"
    />

    <RouterLink
      class="mobile-nav__home"
      :class="{ 'mobile-nav__home--active': isHomeActive }"
      to="/"
      aria-label="Главная"
    >
      <span class="mobile-nav__label">Главная</span>
    </RouterLink>

    <MobileNavScheduleLink
      v-for="link in rightLinks"
      :key="link.id"
      :link="link"
      :active="isScheduleLinkActive(link.id)"
    />
  </nav>
</template>
