<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import PageFrame from '@/components/PageFrame.vue'
import { useAuthStore } from '@/stores/auth'
import type { ScheduleKind } from '@/views/schedule/scheduleOptions'

import studentsImage from '@/assets/students.png'
import consultsImage from '@/assets/consults.png'
import auditoriesImage from '@/assets/auditories.png'
import teachersImage from '@/assets/teachers.png'

const authStore = useAuthStore()

const menuCards = [
  { id: 'students', title: 'Расписание студентов', image: studentsImage, needAuth: false },
  { id: 'consults', title: 'Расписание консультаций', image: consultsImage, needAuth: false },
  { id: 'auditories', title: 'Расписание аудиторий', image: auditoriesImage, needAuth: true },
  { id: 'teachers', title: 'Расписание преподавателей', image: teachersImage, needAuth: false },
]

const visibleMenuCards = computed(() => {
  const role = authStore.currentUser?.role

  if (role === 'student') {
    return menuCards.filter(
        (item) => item.id === 'students' || item.id === 'consults' || item.id === 'teachers'
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
          <img
              class="menu-card-image"
              :src="item.image"
              :alt="item.title"
              aria-hidden="true"
          />

          <h2>{{ item.title }}</h2>

          <p v-if="item.needAuth && !authStore.isAuthenticated">
            Требуется авторизация
          </p>
        </RouterLink>
      </section>
    </main>
  </PageFrame>
</template>

