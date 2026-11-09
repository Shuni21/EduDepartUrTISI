<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import vkIcon from '@/assets/vk.png'
import maxIcon from '@/assets/max.png'
import bgCard from '@/assets/bg-card.png'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PasswordInput from '@/components/PasswordInput.vue'

const router = useRouter()
const authStore = useAuthStore()

const formData = reactive({
  login: '',
  password: '',
})

const errorMessage = ref('')
const isLoading = ref(false)

const helpfulLinks = [
  {
    id: 'max',
    title: 'MAX',
    subtitle: 'Учебный отдел УрТИСИ СибГУТИ',
    icon: maxIcon,
    alt: 'Логотип Max',
    url: 'https://max.ru/join/AHiAjC8oCThnq2HqMGw9kNNZ6rgOgBSu97yA8gLJoyQ',
  },
  {
    id: 'vk',
    title: 'ВКонтакте',
    subtitle: 'Новости УрТИСИ СибГУТИ',
    icon: vkIcon,
    alt: 'Логотип ВКонтакте',
    url: 'https://vk.com/urtisi',
  },
  {
    id: 'max',
    title: 'MAX',
    subtitle: 'Новости УрТИСИ СибГУТИ',
    icon: maxIcon,
    alt: 'Логотип MAX',
    url: 'https://max.ru/id5405101327_gos2',
  },
]

const openLink = (url: string) => {
  window.open(url, '_blank')
}

const leftDecor = [
  { id: 'left-top-right', className: 'left-top-right', rotate: 3 },
  { id: 'left-mid-left', className: 'left-mid-left', rotate: -32 },
  { id: 'left-mid-right', className: 'left-mid-right', rotate: -18 },
  { id: 'left-bottom-left', className: 'left-bottom-left', rotate: 24 },
  { id: 'left-bottom-right', className: 'left-bottom-right', rotate: -12 },
]

const rightDecor = [
  { id: 'right-top-right', className: 'right-top-right', rotate: 31 },
  { id: 'right-top-left', className: 'right-top-left', rotate: -22 },
  { id: 'right-mid-right', className: 'right-mid-right', rotate: 14 },
  { id: 'right-mid-left', className: 'right-mid-left', rotate: -28 },
  { id: 'right-bottom-center', className: 'right-bottom-center', rotate: 34 },
  { id: 'right-bottom-right', className: 'right-bottom-right', rotate: -10 },
]

// const demoAccountsText = computed(() =>
//   mockUsers.map((user) => `${user.login} / ${user.password}`).join(' | '),
// )

const onFormSubmit = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const result = await authStore.login(formData.login, formData.password)

    if (!result.success) {
      errorMessage.value = result.message ?? 'Не удалось выполнить вход.'
      return
    }

    // Успешный вход
    await router.push({ name: 'home' })
  } catch (err) {
    errorMessage.value = 'Произошла ошибка при входе. Попробуйте позже.'
    console.error(err)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <main class="content">
    <section class="login-card">
      <img
          v-for="item in leftDecor"
          :key="item.id"
          :src="bgCard"
          class="decor-card fade-card"
          :class="item.className"
          :style="{ transform: `rotate(${item.rotate}deg)` }"
          alt=""
          aria-hidden="true"
      />

      <h1>Вход</h1>

      <form class="login-form" @submit.prevent="onFormSubmit">
        <label for="login">Логин</label>
        <input id="login" v-model="formData.login" name="login" type="text" />

        <label for="password">Пароль</label>
        <PasswordInput
          id="password"
          v-model="formData.password"
          variant="login"
        />

        <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

        <button class="action-btn" type="submit" :disabled="isLoading">
          {{ isLoading ? 'Вход...' : 'Войти' }}
        </button>
      </form>
    </section>

    <section class="links-side">
      <img
          v-for="item in rightDecor"
          :key="item.id"
          :src="bgCard"
          class="decor-card fade-card"
          :class="item.className"
          :style="{ transform: `rotate(${item.rotate}deg)` }"
          alt=""
          aria-hidden="true"
      />

      <article class="links-card">
        <h2>Полезные ссылки</h2>

        <ul>
          <li v-for="item in helpfulLinks" :key="item.id">
            <div class="link-info">
              <img :src="item.icon" :alt="item.alt" />

              <div>
                <h3>{{ item.title }}</h3>
                <p>{{ item.subtitle }}</p>
              </div>
            </div>

            <button
                type="button"
                @click="openLink(item.url)"
            >
              Открыть
            </button>
          </li>
        </ul>
      </article>
    </section>
  </main>
</template>

