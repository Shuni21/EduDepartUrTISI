<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import SettingsSectionLayout from '@/components/SettingsSectionLayout.vue'
import PasswordInput from '@/components/PasswordInput.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  logoutAllDevices: false,
})

const errors = ref<Record<string, string>>({})
const submitMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const isSubmitting = ref(false)


const isPasswordStrong = computed(() =>
    passwordRequirements.value.every((item) => item.valid),
)

const validate = (): boolean => {
  errors.value = {}

  if (!form.currentPassword) {
    errors.value.currentPassword = 'Введите текущий пароль'
  }

  if (!form.newPassword) {
    errors.value.newPassword = 'Введите новый пароль'
  } else if (form.newPassword.length < 8) {
    errors.value.newPassword = 'Минимум 8 символов'
  } else if (form.newPassword === form.currentPassword) {
    errors.value.newPassword = 'Новый пароль должен отличаться от текущего'
  }

  if (!form.confirmPassword) {
    errors.value.confirmPassword = 'Подтвердите новый пароль'
  } else if (form.confirmPassword !== form.newPassword) {
    errors.value.confirmPassword = 'Пароли не совпадают'
  }

  return Object.keys(errors.value).length === 0
}

const resetForm = () => {
  form.currentPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
  form.logoutAllDevices = false
}

const handleSubmit = async () => {
  submitMessage.value = null

  if (!validate()) {
    return
  }

  isSubmitting.value = true

  try {
    const result = await authStore.changePassword(
        form.currentPassword,
        form.newPassword,
        form.logoutAllDevices,
    )

    if (!result.success) {
      submitMessage.value = {
        type: 'error',
        text: result.message ?? 'Не удалось сменить пароль',
      }

      if (result.message?.includes('текущий пароль')) {
        errors.value.currentPassword = result.message
      }

      return
    }

    if (result.loggedOutAllDevices) {
      await router.replace({ name: 'login' })
      return
    }

    resetForm()
    submitMessage.value = {
      type: 'success',
      text: 'Пароль успешно изменён',
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <SettingsSectionLayout title="Смена пароля">
    <form class="settings-form" @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="current-password" class="form-label">
          Текущий пароль <span class="required">*</span>
        </label>
        <PasswordInput
            id="current-password"
            v-model="form.currentPassword"
            placeholder="Введите текущий пароль"
            :disabled="isSubmitting"
            :error="!!errors.currentPassword"
        />
        <span v-if="errors.currentPassword" class="error-message">
          {{ errors.currentPassword }}
        </span>
      </div>

      <div class="form-group">
        <label for="new-password" class="form-label">
          Новый пароль <span class="required">*</span>
        </label>
        <PasswordInput
            id="new-password"
            v-model="form.newPassword"
            placeholder="Введите новый пароль"
            :disabled="isSubmitting"
            :error="!!errors.newPassword"
        />

        <div class="password-requirements">
          <p class="password-requirements__title">Рекомендации к паролю</p>
          <ul class="password-requirements__list">
            <li>Не менее 8 символов</li>
            <li>Заглавная латинская буква (A–Z)</li>
            <li>Строчная латинская буква (a–z)</li>
            <li>Цифра (0–9)</li>
            <li>Специальный символ (! @ # $ % ^ & * ( ) _ - +)</li>
          </ul>
        </div>

        <span v-if="errors.newPassword" class="error-message">
          {{ errors.newPassword }}
        </span>
      </div>

      <div class="form-group">
        <label for="confirm-password" class="form-label">
          Подтверждение пароля <span class="required">*</span>
        </label>
        <PasswordInput
            id="confirm-password"
            v-model="form.confirmPassword"
            placeholder="Повторите новый пароль"
            :disabled="isSubmitting"
            :error="!!errors.confirmPassword"
        />
        <span v-if="errors.confirmPassword" class="error-message">
          {{ errors.confirmPassword }}
        </span>
      </div>

      <label class="settings-checkbox-label">
        <input
            v-model="form.logoutAllDevices"
            type="checkbox"
            :disabled="isSubmitting"
        >
        Выйти из всех устройств, включая это
      </label>

      <p
          v-if="submitMessage"
          class="settings-message"
          :class="submitMessage.type"
      >
        {{ submitMessage.text }}
      </p>

      <button
          class="settings-submit-btn"
          type="submit"
          :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Сохранение...' : 'Сменить пароль' }}
      </button>
    </form>
  </SettingsSectionLayout>
</template>

<style scoped>
.settings-detail-page .password-requirements {
  @apply mt-[8px] p-[14px] rounded-[10px]
  bg-white dark:bg-[#252a31]
  border border-[#d7e0e9] dark:border-[#3a424d];
}

.settings-detail-page .password-requirements__title {
  @apply m-0 mb-[8px] text-[13px] font-medium
  text-[#24313f] dark:text-[#d5dde6];
}

.settings-detail-page .password-requirements__list {
  @apply m-0 pl-[18px] text-[13px] leading-[1.5]
  text-[#5f6975] dark:text-[#9aa3ad];
}

.settings-detail-page .password-requirements__list li {
  @apply mb-[2px];
}
</style>