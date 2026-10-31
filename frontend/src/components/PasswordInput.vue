<script setup lang="ts">
import { ref } from 'vue'
import showIcon from '@/assets/eye-password-show.svg'
import hideIcon from '@/assets/eye-password-hide.svg'

withDefaults(defineProps<{
  id?: string
  placeholder?: string
  disabled?: boolean
  error?: boolean
  variant?: 'admin' | 'login'
  showGenerate?: boolean
}>(), {
  variant: 'admin',
  showGenerate: false,
})

const model = defineModel<string>({ default: '' })

const isVisible = ref(false)

function generatePassword(length = 12): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%&*'
  const all = upper + lower + digits + symbols

  // Гарантируем хотя бы по одному символу каждого типа
  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)]
  let password = pick(upper) + pick(lower) + pick(digits) + pick(symbols)

  for (let i = password.length; i < length; i++) {
    password += pick(all)
  }

  // Перемешиваем
  return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('')
}

function onGenerate() {
  model.value = generatePassword(12)
  isVisible.value = true // сразу показываем сгенерированный пароль
}
</script>

<template>
  <div class="password-field" :class="[`password-field--${variant}`]">
    <input
        :id="id"
        v-model="model"
        :type="isVisible ? 'text' : 'password'"
        :class="variant === 'admin' ? ['form-input', 'password-field__input', { error }] : 'password-field__input'"
        :placeholder="placeholder"
        :disabled="disabled"
    />

    <!-- Кнопка генерации -->
    <button
        v-if="showGenerate"
        type="button"
        class="password-field__generate"
        :disabled="disabled"
        title="Сгенерировать пароль"
        aria-label="Сгенерировать пароль"
        @click="onGenerate"
    >
      ↻
    </button>

    <!-- Кнопка показать/скрыть -->
    <button
        type="button"
        class="password-field__toggle"
        :disabled="disabled"
        :aria-label="isVisible ? 'Скрыть пароль' : 'Показать пароль'"
        @click="isVisible = !isVisible"
    >
      <img
          :src="isVisible ? showIcon : hideIcon"
          alt=""
          aria-hidden="true"
      />
    </button>
  </div>
</template>