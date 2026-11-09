<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import PageFrame from '@/components/PageFrame.vue'
import { useAuthStore } from '@/stores/auth'
import type { ScheduleKind } from '@/views/schedule/scheduleOptions'

const authStore = useAuthStore()

const menuCards = [
  { id: 'students', title: 'Расписание студентов', needAuth: false },
  { id: 'consults', title: 'Расписание консультаций', needAuth: false },
  { id: 'auditories', title: 'Расписание аудиторий', needAuth: true },
  { id: 'teachers', title: 'Расписание преподавателей', needAuth: false },
]

const visibleMenuCards = computed(() => {
  const role = authStore.currentUser?.role

  if (role === 'student') {
    return menuCards.filter(
        (item) => item.id === 'students' || item.id === 'consults'
    )
  }

  return menuCards
})

const getCardRoute = (type: string) => ({
  name: 'schedule-selection' as const,
  params: { type: type as ScheduleKind },
})
</script>

<template>
  <PageFrame>
    <main class="home-main">
      <h1>Расписание института</h1>
      <p>
        Удобный доступ к расписанию занятий для студентов, преподавателей, аудиторий и
        консультаций в одном месте.
      </p>

      <section class="cards-grid" aria-label="Категории расписания">
        <RouterLink
            v-for="item in visibleMenuCards"
            :key="item.id"
            class="menu-card"
            :to="getCardRoute(item.id)"
        >
          <h2>{{ item.title }}</h2>
          <p v-if="item.needAuth && !authStore.isAuthenticated">
            Требуется авторизация
          </p>
        </RouterLink>
      </section>
    </main>
  </PageFrame>
</template>

