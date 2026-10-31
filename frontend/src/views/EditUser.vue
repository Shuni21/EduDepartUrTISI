<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { fetchTeacherDepartments, type TeacherDepartmentInfo } from '@/api/departments'
import { getErrorRoute } from '@/config/errorPages'
import PageFrame from '@/components/PageFrame.vue'
import PasswordInput from '@/components/PasswordInput.vue'
import type { AdminUser } from '@/api/admin'
import type { UserRole } from '@/stores/auth'
import { getPhotoUrl } from '@/config/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const usersStore = useUsersStore()

const userId = computed(() => Number(route.params.id))
const isSelf = computed(() => userId.value === authStore.currentUser?.id)

interface UserForm {
  login: string
  password: string
  role: UserRole
  surname: string
  name: string
  patronymic: string
  isActive: boolean
  department?: string
  departmentId?: number
  position?: string
  cabinet?: string
  group?: string
  direction?: string
  educationForm?: string
  course?: number
}

const form = ref<UserForm>({
  login: '',
  password: '',
  role: 'student',
  surname: '',
  name: '',
  patronymic: '',
  isActive: true,
  department: '',
  position: '',
  cabinet: '',
  group: '',
  direction: '',
  educationForm: 'Очная',
  course: 1,
})

const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
const currentPhotoUrl = ref<string | null>(null)
const removePhoto = ref(false)
const errors = ref<Partial<Record<keyof UserForm, string>>>({})
const isSubmitting = ref(false)
const isLoading = ref(true)
const pageError = ref('')
const submitMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const skipRoleReset = ref(false)
const teacherDepartments = ref<TeacherDepartmentInfo[]>([])

const roleOptions = [
  { value: 'student', label: 'Студент' },
  { value: 'teacher', label: 'Преподаватель' },
  { value: 'employee', label: 'Сотрудник' },
  { value: 'admin', label: 'Администратор' },
]

const educationFormOptions = [
  { value: 'Очная', label: 'Очная' },
  { value: 'Заочная', label: 'Заочная' },
  { value: 'Очно-заочная', label: 'Очно-заочная' },
]

const courseOptions = [1, 2, 3, 4, 5, 6]

const displayedPhoto = computed(() => {
  if (photoPreview.value) {
    return photoPreview.value
  }

  if (!removePhoto.value) {
    return currentPhotoUrl.value
  }

  return null
})

const onPhotoSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null

  photoFile.value = file
  photoPreview.value = file ? URL.createObjectURL(file) : null
  removePhoto.value = false
}

const markPhotoForRemoval = () => {
  photoFile.value = null
  photoPreview.value = null
  removePhoto.value = true
}

const fillFormFromUser = async (user: AdminUser) => {
  skipRoleReset.value = true
  removePhoto.value = false
  photoFile.value = null
  photoPreview.value = null
  currentPhotoUrl.value = getPhotoUrl(user.photoUrl)
  form.value = {
    login: user.login,
    password: '',
    role: user.role,
    surname: user.surname,
    name: user.name,
    patronymic: user.patronymic || '',
    isActive: user.isActive,
    department: user.department || '',
    departmentId: user.departmentId,
    position: user.position || '',
    cabinet: user.cabinet || '',
    group: user.group || '',
    direction: user.direction || '',
    educationForm: user.educationForm || 'Очная',
    course: user.course || 1,
  }

  await nextTick()
  skipRoleReset.value = false
}

watch(() => form.value.role, (newRole, oldRole) => {
  if (skipRoleReset.value || newRole === oldRole) {
    return
  }

  form.value.department = ''
  form.value.departmentId = undefined
  form.value.position = ''
  form.value.cabinet = ''
  form.value.group = ''
  form.value.direction = ''
  form.value.educationForm = 'Очная'
  form.value.course = 1

  if (newRole === 'student') {
    form.value.educationForm = 'Очная'
    form.value.course = 1
  }
})

const loadUser = async () => {
  if (!userId.value || Number.isNaN(userId.value)) {
    await router.replace(getErrorRoute('404', 'Некорректный идентификатор пользователя'))
    return
  }

  isLoading.value = true
  pageError.value = ''

  try {
    if (teacherDepartments.value.length === 0) {
      teacherDepartments.value = await fetchTeacherDepartments()
    }

    const cachedUser = usersStore.users.find((entry) => entry.id === userId.value)
    if (cachedUser) {
      await fillFormFromUser(cachedUser)
      isLoading.value = false
    }

    const user = await usersStore.getUser(userId.value)
    await fillFormFromUser(user)
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        await router.replace(getErrorRoute('404', 'Пользователь не найден'))
        return
      }

      if (error.response?.status === 403) {
        await router.replace(getErrorRoute('403'))
        return
      }
    }

    pageError.value = axios.isAxiosError(error)
      ? String(error.response?.data?.message ?? 'Не удалось загрузить пользователя')
      : 'Не удалось загрузить пользователя'
  } finally {
    isLoading.value = false
  }
}

watch(userId, () => {
  void loadUser()
})

onMounted(async () => {
  if (!authStore.isAuthenticated || authStore.currentUser?.role !== 'admin') {
    await router.replace(getErrorRoute('403'))
    return
  }

  await loadUser()
})

const validate = (): boolean => {
  errors.value = {}

  if (!form.value.login.trim()) {
    errors.value.login = 'Введите логин'
  } else if (form.value.login.length < 3) {
    errors.value.login = 'Минимум 3 символа'
  }

  if (form.value.password && form.value.password.length < 8) {
    errors.value.password = 'Минимум 8 символов'
  }

  if (!form.value.surname.trim()) {
    errors.value.surname = 'Введите фамилию'
  }

  if (!form.value.name.trim()) {
    errors.value.name = 'Введите имя'
  }

  if (form.value.role === 'student') {
    if (!form.value.group?.trim()) errors.value.group = 'Введите группу'
    if (!form.value.direction?.trim()) errors.value.direction = 'Введите направление подготовки'
    if (!form.value.course || form.value.course < 1 || form.value.course > 6) {
      errors.value.course = 'Выберите курс (1-6)'
    }
  }

  if (form.value.role === 'teacher') {
    if (!form.value.position?.trim()) errors.value.position = 'Введите должность'
    if (!form.value.departmentId) errors.value.departmentId = 'Выберите кафедру'
  }

  if (form.value.role === 'employee') {
    if (!form.value.position?.trim()) errors.value.position = 'Введите должность'
    if (!form.value.department?.trim()) errors.value.department = 'Укажите отдел или кафедру'
  }

  if (form.value.role === 'admin' && !form.value.department?.trim()) {
    errors.value.department = 'Укажите отдел или кафедру'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validate()) return

  isSubmitting.value = true
  submitMessage.value = null

  try {
    const payload = {
      login: form.value.login.trim(),
      role: form.value.role,
      surname: form.value.surname.trim(),
      name: form.value.name.trim(),
      patronymic: form.value.patronymic.trim() || undefined,
      isActive: form.value.isActive,
      removePhoto: removePhoto.value,
      password: form.value.password.trim() || undefined,
      group: form.value.group?.trim(),
      direction: form.value.direction?.trim(),
      educationForm: form.value.educationForm,
      course: form.value.course,
      department: ['employee', 'admin'].includes(form.value.role)
        ? form.value.department?.trim()
        : undefined,
      departmentId: form.value.role === 'teacher' ? form.value.departmentId : undefined,
      position: form.value.position?.trim(),
      cabinet: form.value.cabinet?.trim(),
    }

    await usersStore.editUser(userId.value, payload, photoFile.value)

    if (isSelf.value) {
      await authStore.validateSession()
    }

    submitMessage.value = {
      type: 'success',
      text: 'Данные пользователя успешно сохранены',
    }

    setTimeout(() => {
      router.push({ name: 'admin-edit-user' })
    }, 1200)
  } catch (err: any) {
    submitMessage.value = {
      type: 'error',
      text: err.response?.data?.message || 'Не удалось сохранить изменения',
    }
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => router.push({ name: 'admin-edit-user' })
</script>

<template>
  <PageFrame>
    <section class="admin-edit-page">
      <div class="admin-card">
        <div class="card-header">
          <button class="back-btn" type="button" @click="goBack" aria-label="Назад">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <h1 class="card-title">Редактировать пользователя</h1>
        </div>

        <p v-if="isLoading" class="card-subtitle">Загрузка...</p>
        <p v-else-if="pageError" class="submit-message error">{{ pageError }}</p>

        <template v-else>
          <div v-if="submitMessage" :class="['submit-message', submitMessage.type]">
            {{ submitMessage.text }}
          </div>

          <form @submit.prevent="handleSubmit" class="user-form">
            <div class="form-section">
              <h2 class="section-title">Основные данные</h2>

              <div class="form-row">
                <div class="form-group">
                  <label for="login" class="form-label">Логин <span class="required">*</span></label>
                  <input
                    id="login"
                    v-model="form.login"
                    type="text"
                    class="form-input"
                    :class="{ error: errors.login }"
                    :disabled="isSubmitting"
                  />
                  <span v-if="errors.login" class="error-message">{{ errors.login }}</span>
                </div>

                <div class="form-group">
                  <label for="password" class="form-label">Новый пароль</label>
                  <PasswordInput
                      id="password"
                      v-model="form.password"
                      placeholder="Введите пароль"
                      :disabled="isSubmitting"
                      :error="!!errors.password"
                      show-generate
                  />
                  <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="role" class="form-label">Роль <span class="required">*</span></label>
                  <select
                    id="role"
                    v-model="form.role"
                    class="form-select"
                    :disabled="isSubmitting || isSelf"
                  >
                    <option v-for="option in roleOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="photo" class="form-label">Фото пользователя</label>
                  <input
                    id="photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    class="form-input"
                    :disabled="isSubmitting"
                    @change="onPhotoSelected"
                  />
                </div>
              </div>

              <div v-if="displayedPhoto" class="form-row">
                <div class="form-group full-width avatar-preview-row">
                  <img :src="displayedPhoto" alt="Фото пользователя" class="avatar-preview" />
                  <button
                    type="button"
                    class="btn btn-secondary"
                    :disabled="isSubmitting"
                    @click="markPhotoForRemoval"
                  >
                    Удалить фото
                  </button>
                </div>
              </div>

              <div class="form-row">
                <label class="checkbox-label">
                  <input
                    v-model="form.isActive"
                    type="checkbox"
                    :disabled="isSubmitting || isSelf"
                  />
                  Активная учётная запись
                </label>
              </div>
            </div>

            <div class="form-section">
              <h2 class="section-title">Личные данные</h2>
              <div class="form-row">
                <div class="form-group">
                  <label for="surname" class="form-label">Фамилия <span class="required">*</span></label>
                  <input id="surname" v-model="form.surname" type="text" class="form-input" :class="{ error: errors.surname }" :disabled="isSubmitting" />
                  <span v-if="errors.surname" class="error-message">{{ errors.surname }}</span>
                </div>
                <div class="form-group">
                  <label for="name" class="form-label">Имя <span class="required">*</span></label>
                  <input id="name" v-model="form.name" type="text" class="form-input" :class="{ error: errors.name }" :disabled="isSubmitting" />
                  <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
                </div>
                <div class="form-group">
                  <label for="patronymic" class="form-label">Отчество</label>
                  <input id="patronymic" v-model="form.patronymic" type="text" class="form-input" :disabled="isSubmitting" />
                </div>
              </div>
            </div>

            <div v-if="form.role === 'student'" class="form-section">
              <h2 class="section-title">Данные студента</h2>
              <div class="form-row">
                <div class="form-group">
                  <label for="group" class="form-label">Группа <span class="required">*</span></label>
                  <input id="group" v-model="form.group" type="text" class="form-input" :class="{ error: errors.group }" :disabled="isSubmitting" />
                  <span v-if="errors.group" class="error-message">{{ errors.group }}</span>
                </div>
                <div class="form-group">
                  <label for="course" class="form-label">Курс <span class="required">*</span></label>
                  <select id="course" v-model.number="form.course" class="form-select" :class="{ error: errors.course }" :disabled="isSubmitting">
                    <option v-for="c in courseOptions" :key="c" :value="c">{{ c }} курс</option>
                  </select>
                  <span v-if="errors.course" class="error-message">{{ errors.course }}</span>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group full-width">
                  <label for="direction" class="form-label">Направление подготовки <span class="required">*</span></label>
                  <input
                    id="direction"
                    v-model="form.direction"
                    type="text"
                    class="form-input"
                    :class="{ error: errors.direction }"
                    placeholder="09.03.01 Информатика и вычислительная техника"
                    :disabled="isSubmitting"
                  />
                  <span v-if="errors.direction" class="error-message">{{ errors.direction }}</span>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="educationForm" class="form-label">Форма обучения</label>
                  <select id="educationForm" v-model="form.educationForm" class="form-select" :disabled="isSubmitting">
                    <option v-for="opt in educationFormOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                </div>
              </div>
            </div>

            <div v-if="form.role === 'teacher'" class="form-section">
              <h2 class="section-title">Данные преподавателя</h2>
              <div class="form-row">
                <div class="form-group">
                  <label for="position" class="form-label">Должность <span class="required">*</span></label>
                  <input id="position" v-model="form.position" type="text" class="form-input" :class="{ error: errors.position }" :disabled="isSubmitting" />
                  <span v-if="errors.position" class="error-message">{{ errors.position }}</span>
                </div>
                <div class="form-group">
                  <label for="cabinet" class="form-label">Кабинет</label>
                  <input id="cabinet" v-model="form.cabinet" type="text" class="form-input" :disabled="isSubmitting" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group full-width">
                  <label for="departmentId" class="form-label">Кафедра <span class="required">*</span></label>
                  <select
                    id="departmentId"
                    v-model.number="form.departmentId"
                    class="form-select"
                    :class="{ error: errors.departmentId }"
                    :disabled="isSubmitting"
                  >
                    <option :value="undefined" disabled>Выберите кафедру</option>
                    <option
                      v-for="department in teacherDepartments"
                      :key="department.id"
                      :value="department.id"
                    >
                      {{ department.shortName }}
                    </option>
                  </select>
                  <span v-if="errors.departmentId" class="error-message">{{ errors.departmentId }}</span>
                </div>
              </div>
            </div>

            <div v-if="form.role === 'employee'" class="form-section">
              <h2 class="section-title">Данные сотрудника</h2>
              <div class="form-row">
                <div class="form-group">
                  <label for="position" class="form-label">Должность <span class="required">*</span></label>
                  <input id="position" v-model="form.position" type="text" class="form-input" :class="{ error: errors.position }" :disabled="isSubmitting" />
                  <span v-if="errors.position" class="error-message">{{ errors.position }}</span>
                </div>
                <div class="form-group">
                  <label for="cabinet" class="form-label">Кабинет</label>
                  <input id="cabinet" v-model="form.cabinet" type="text" class="form-input" :disabled="isSubmitting" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group full-width">
                  <label for="department" class="form-label">Отдел / кафедра <span class="required">*</span></label>
                  <input
                    id="department"
                    v-model="form.department"
                    type="text"
                    class="form-input"
                    :class="{ error: errors.department }"
                    placeholder="Например: Учебный отдел, ИСТ или Кафедра «Информационных систем и технологий»"
                    :disabled="isSubmitting"
                  />
                  <span v-if="errors.department" class="error-message">{{ errors.department }}</span>
                </div>
              </div>
            </div>

            <div v-if="form.role === 'admin'" class="form-section">
              <h2 class="section-title">Данные администратора</h2>
              <div class="form-row">
                <div class="form-group full-width">
                  <label for="adminDepartment" class="form-label">Отдел / кафедра <span class="required">*</span></label>
                  <input
                    id="adminDepartment"
                    v-model="form.department"
                    type="text"
                    class="form-input"
                    :class="{ error: errors.department }"
                    placeholder="Например: Технический отдел, ИСТ или Кафедра «Информационных систем и технологий»"
                    :disabled="isSubmitting"
                  />
                  <span v-if="errors.department" class="error-message">{{ errors.department }}</span>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="position" class="form-label">Должность</label>
                  <input id="position" v-model="form.position" type="text" class="form-input" :disabled="isSubmitting" />
                </div>
                <div class="form-group">
                  <label for="cabinet" class="form-label">Кабинет</label>
                  <input id="cabinet" v-model="form.cabinet" type="text" class="form-input" :disabled="isSubmitting" />
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="goBack" :disabled="isSubmitting">Отмена</button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                {{ isSubmitting ? 'Сохранение...' : 'Сохранить изменения' }}
              </button>
            </div>
          </form>
        </template>
      </div>
    </section>
  </PageFrame>
</template>
