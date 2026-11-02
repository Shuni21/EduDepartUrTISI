<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PageFrame from '@/components/PageFrame.vue'
import { getMyScheduleRoute } from '@/utils/myScheduleNavigation'

const authStore = useAuthStore()
const router = useRouter()

const user = computed(() => authStore.currentUser)
const role = computed(() => user.value?.role)

async function goToMySchedule() {
  const route = getMyScheduleRoute(user.value)

  if (!route) {
    return
  }

  await router.push(route)
}

const profileFields = computed(() => {
  if (!user.value) return []

  switch (role.value) {
    case 'student':
      return [
        { label: 'Группа', value: user.value.group },
        { label: 'Форма обучения', value: user.value.educationForm },
        { label: 'Курс', value: user.value.course },
      ]

    case 'teacher':
      return [
        { label: 'Должность', value: user.value.position },
        { label: 'Кафедра', value: user.value.department },
        { label: 'Кабинет', value: user.value.cabinet },
      ]

    default:
      return [
        { label: 'Должность', value: user.value.position },
        {
          label: 'Структурное подразделение',
          value: user.value.department,
        },
        { label: 'Кабинет', value: user.value.cabinet },
      ]
  }
})

const buttons = computed(() => {
  switch (role.value) {
    case 'student':
      return [
        {
          text: 'Перейти к моему расписанию',
          action: goToMySchedule,
        },
      ]

    case 'teacher':
      return [
        {
          text: 'Перейти к моему расписанию',
          action: goToMySchedule,
        },
        {
          text: 'Составить отчёт',
          action: () => {},
        },
      ]

    default:
      return []
  }
})
</script>

<template>
  <PageFrame>
    <section class="profile-page">
      <div class="profile-card">
        <div class="profile-info">
          <div class="fullname">
            <p>{{ user?.surname || 'Фамилия' }}</p>
            <p>{{ user?.name || 'Имя' }}</p>
            <p>{{ user?.patronymic || 'Отчество' }}</p>

            <div class="divider"></div>
          </div>

          <div class="details">
            <div
              v-for="field in profileFields"
              :key="field.label"
              class="detail-row"
            >
              <span class="label">{{ field.label }}:</span>
              <span class="value">{{ field.value }}</span>
            </div>
          </div>

          <div v-if="buttons.length" class="actions">
            <button
              v-for="button in buttons"
              :key="button.text"
              class="action-btn"
              @click="button.action"
            >
              {{ button.text }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </PageFrame>
</template>
