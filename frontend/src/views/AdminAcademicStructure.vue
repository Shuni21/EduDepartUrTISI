<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageFrame from '@/components/PageFrame.vue'
import { useAuthStore } from '@/stores/auth'
import { useConfirmDialogStore } from '@/stores/confirmDialog'
import { getErrorRoute } from '@/config/errorPages'
import {
  createAcademicGroup,
  createStaffDepartment,
  createTeacherDepartment,
  deleteAcademicDepartment,
  deleteAcademicGroup,
  educationFormLabels,
  fetchAcademicOverview,
  roleLabels,
  selectableEducationFormOptions,
  type AcademicDepartment,
  type AcademicGroup,
  type AcademicStructureOverview,
} from '@/api/adminAcademic'

type TabId = 'teacher' | 'staff' | 'groups'

const router = useRouter()
const authStore = useAuthStore()
const confirmDialog = useConfirmDialogStore()

const activeTab = ref<TabId>('teacher')
const overview = ref<AcademicStructureOverview | null>(null)
const isLoading = ref(false)
const pageError = ref('')
const structureSearch = ref('')
const deletingGroupId = ref<number | null>(null)
const deletingDepartmentId = ref<number | null>(null)
const isCreatingGroup = ref(false)
const newGroupForm = ref<{
  name: string
  educationForm: AcademicGroup['educationForm']
}>({
  name: '',
  educationForm: 'full_time',
})

const newTeacherDepartment = ref({
  shortName: '',
  name: '',
})
const newStaffDepartmentName = ref('')
const isCreatingTeacherDepartment = ref(false)
const isCreatingStaffDepartment = ref(false)

const educationFormOptions = selectableEducationFormOptions

const tabs: { id: TabId; label: string }[] = [
  { id: 'teacher', label: 'Кафедры' },
  { id: 'staff', label: 'Отделы' },
  { id: 'groups', label: 'Группы' },
]

onMounted(async () => {
  if (!authStore.isAuthenticated || authStore.currentUser?.role !== 'admin') {
    await router.replace(getErrorRoute('403'))
    return
  }

  await loadOverview()
})

async function loadOverview() {
  isLoading.value = true
  pageError.value = ''

  try {
    overview.value = await fetchAcademicOverview()
  } catch (err: any) {
    pageError.value = err.response?.data?.message || 'Не удалось загрузить структуру'
  } finally {
    isLoading.value = false
  }
}

const activeDepartments = computed(() => {
  if (activeTab.value === 'teacher') {
    return filteredTeacherDepartments.value
  }

  return filteredStaffDepartments.value
})

const filteredTeacherDepartments = computed(() =>
    filterDepartments(overview.value?.teacherDepartments ?? []),
)

const filteredStaffDepartments = computed(() =>
    filterDepartments(overview.value?.staffDepartments ?? []),
)

const filteredGroups = computed(() => {
  const query = structureSearch.value.trim().toLowerCase()
  const groups = overview.value?.groups ?? []

  if (!query) {
    return groups
  }

  return groups.filter((group) =>
    group.name.toLowerCase().includes(query)
    || group.students.some((student) => matchesMember(student, query)),
  )
})

function filterDepartments(departments: AcademicDepartment[]) {
  const query = structureSearch.value.trim().toLowerCase()

  if (!query) {
    return departments
  }

  return departments.filter((department) =>
      department.name.toLowerCase().includes(query)
      || (department.shortName?.toLowerCase().includes(query) ?? false)
      || department.members.some((member) => matchesMember(member, query)),
  )
}

function matchesMember(
    member: { fullName: string; login: string; position: string },
    query: string,
): boolean {
  return member.fullName.toLowerCase().includes(query)
      || member.login.toLowerCase().includes(query)
      || member.position.toLowerCase().includes(query)
}

const goBack = async () => {
  await router.push({ name: 'admin-panel' })
}

const emptyLabel = () => 'Никого не добавлено'

const membersCountLabel = (department: AcademicDepartment) => {
  const count = department.members.length

  if (department.type === 'teacher') {
    const teachers = department.members.filter((member) => member.role === 'teacher').length
    const others = count - teachers

    if (others > 0 && teachers > 0) {
      return `${teachers} преподавателей, ${others} сотрудников`
    }

    if (others > 0) {
      return `${others} сотрудников`
    }

    return `${count} преподавателей`
  }

  return `${count} сотрудников`
}

function canDeleteGroup(group: AcademicGroup): boolean {
  return group.students.length === 0
}

function canDeleteDepartment(department: AcademicDepartment): boolean {
  return department.members.length === 0
}

async function deleteDepartment(department: AcademicDepartment) {
  if (!canDeleteDepartment(department)) {
    return
  }

  const label = department.type === 'teacher' ? 'кафедру' : 'отдел'
  const confirmed = await confirmDialog.confirm({
    message: `Удалить ${label} «${department.name}»?`,
    confirmText: 'Удалить',
    variant: 'danger',
  })

  if (!confirmed) {
    return
  }

  deletingDepartmentId.value = department.id
  pageError.value = ''

  try {
    await deleteAcademicDepartment(department.id)
    await loadOverview()
  } catch (err: any) {
    pageError.value = err.response?.data?.message || `Не удалось удалить ${label}`
  } finally {
    deletingDepartmentId.value = null
  }
}

async function deleteGroup(group: AcademicGroup) {
  if (!canDeleteGroup(group)) {
    return
  }

  const confirmed = await confirmDialog.confirm({
    message: `Удалить группу ${group.name}?`,
    confirmText: 'Удалить',
    variant: 'danger',
  })

  if (!confirmed) {
    return
  }

  deletingGroupId.value = group.id
  pageError.value = ''

  try {
    await deleteAcademicGroup(group.id)
    await loadOverview()
  } catch (err: any) {
    pageError.value = err.response?.data?.message || 'Не удалось удалить группу'
  } finally {
    deletingGroupId.value = null
  }
}

async function createTeacherDepartmentSubmit() {
  const shortName = newTeacherDepartment.value.shortName.trim()
  const name = newTeacherDepartment.value.name.trim()

  if (!shortName || !name) {
    pageError.value = 'Укажите сокращение и название кафедры'
    return
  }

  isCreatingTeacherDepartment.value = true
  pageError.value = ''

  try {
    await createTeacherDepartment({ shortName, name })
    newTeacherDepartment.value = { shortName: '', name: '' }
    await loadOverview()
  } catch (err: any) {
    pageError.value = err.response?.data?.message || 'Не удалось создать кафедру'
  } finally {
    isCreatingTeacherDepartment.value = false
  }
}

async function createStaffDepartmentSubmit() {
  const name = newStaffDepartmentName.value.trim()

  if (!name) {
    pageError.value = 'Введите название отдела'
    return
  }

  isCreatingStaffDepartment.value = true
  pageError.value = ''

  try {
    await createStaffDepartment({ name })
    newStaffDepartmentName.value = ''
    await loadOverview()
  } catch (err: any) {
    pageError.value = err.response?.data?.message || 'Не удалось создать отдел'
  } finally {
    isCreatingStaffDepartment.value = false
  }
}

async function createGroup() {
  const name = newGroupForm.value.name.trim()

  if (!name) {
    pageError.value = 'Введите название группы'
    return
  }

  isCreatingGroup.value = true
  pageError.value = ''

  try {
    await createAcademicGroup({
      name,
      educationForm: newGroupForm.value.educationForm,
    })

    newGroupForm.value.name = ''
    await loadOverview()
  } catch (err: any) {
    pageError.value = err.response?.data?.message || 'Не удалось создать группу'
  } finally {
    isCreatingGroup.value = false
  }
}
</script>

<template>
  <PageFrame>
    <section class="admin-edit-page">
      <div class="admin-card academic-card">
        <div class="card-header">
          <button class="back-btn" type="button" @click="goBack" aria-label="Назад">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <h1 class="card-title">Структура</h1>
        </div>

        <div class="card-subtitle">Кафедры, отделы и учебные группы</div>

        <div class="academic-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="academic-tab"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <input
          v-model="structureSearch"
          class="users-search"
          type="search"
          placeholder="Поиск по названию, ФИО или логину"
        >

        <p v-if="pageError" class="submit-message error">{{ pageError }}</p>
        <p v-else-if="isLoading" class="card-subtitle">Загрузка...</p>

        <template v-else-if="overview">
          <template v-if="activeTab === 'groups'">
            <div class="academic-create-panel">
              <h2 class="academic-create-panel__title">Новая группа</h2>
              <div class="academic-create-group-form">
                <input
                  v-model="newGroupForm.name"
                  class="form-input"
                  type="text"
                  placeholder="Например: ПЕ-316"
                  :disabled="isCreatingGroup"
                >
                <select
                  v-model="newGroupForm.educationForm"
                  class="form-select"
                  :disabled="isCreatingGroup"
                >
                  <option
                    v-for="option in educationFormOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
                <button
                  type="button"
                  class="btn btn-primary"
                  :disabled="isCreatingGroup || !newGroupForm.name.trim()"
                  @click="createGroup"
                >
                  {{ isCreatingGroup ? '...' : 'Добавить группу' }}
                </button>
              </div>
            </div>

            <p v-if="filteredGroups.length === 0" class="card-subtitle">
              Группы не найдены
            </p>

            <div v-else class="academic-sections">
              <article
                v-for="group in filteredGroups"
                :key="group.id"
                class="academic-section"
              >
                  <div class="academic-group__header">
                    <div>
                      <h3 class="academic-group__title">{{ group.name }}</h3>
                      <p class="academic-group__meta">
                        {{ educationFormLabels[group.educationForm] }}
                        · {{ group.students.length }} студентов
                      </p>
                    </div>

                    <button
                      v-if="canDeleteGroup(group)"
                      type="button"
                      class="btn btn-secondary academic-delete-btn"
                      :disabled="deletingGroupId === group.id"
                      @click="deleteGroup(group)"
                    >
                      {{ deletingGroupId === group.id ? '...' : 'Удалить группу' }}
                    </button>
                  </div>

                  <div v-if="group.students.length === 0" class="academic-section__empty">
                    Нет студентов
                  </div>

                  <ul v-else class="academic-members">
                    <li
                      v-for="student in group.students"
                      :key="student.id"
                      class="academic-member"
                    >
                      <div class="academic-member__name">{{ student.fullName }}</div>
                      <div class="academic-member__meta">{{ student.position }}</div>
                      <div class="academic-member__login">{{ student.login }}</div>
                    </li>
                  </ul>
              </article>
            </div>
          </template>

          <template v-else>
          <div
            v-if="activeTab === 'teacher'"
            class="academic-create-panel"
          >
            <h2 class="academic-create-panel__title">Новая кафедра</h2>
            <div class="academic-create-row">
              <input
                v-model="newTeacherDepartment.shortName"
                class="form-input academic-create-short-name"
                type="text"
                placeholder="Сокращение, например: ИТиМС"
                :disabled="isCreatingTeacherDepartment"
              >
              <input
                v-model="newTeacherDepartment.name"
                class="form-input"
                type="text"
                placeholder="Полное название кафедры"
                :disabled="isCreatingTeacherDepartment"
              >
              <button
                type="button"
                class="btn btn-primary"
                :disabled="isCreatingTeacherDepartment || !newTeacherDepartment.shortName.trim() || !newTeacherDepartment.name.trim()"
                @click="createTeacherDepartmentSubmit"
              >
                {{ isCreatingTeacherDepartment ? '...' : 'Добавить кафедру' }}
              </button>
            </div>
          </div>

          <div
            v-else-if="activeTab === 'staff'"
            class="academic-create-panel"
          >
            <h2 class="academic-create-panel__title">Новый отдел</h2>
            <div class="academic-create-row">
              <input
                v-model="newStaffDepartmentName"
                class="form-input"
                type="text"
                placeholder="Например: Учебный отдел"
                :disabled="isCreatingStaffDepartment"
              >
              <button
                type="button"
                class="btn btn-primary"
                :disabled="isCreatingStaffDepartment || !newStaffDepartmentName.trim()"
                @click="createStaffDepartmentSubmit"
              >
                {{ isCreatingStaffDepartment ? '...' : 'Добавить отдел' }}
              </button>
            </div>
          </div>

          <p v-if="activeDepartments.length === 0" class="card-subtitle">
            {{ activeTab === 'teacher' ? 'Кафедры не найдены' : 'Отделы не найдены' }}
          </p>

          <div v-else class="academic-sections">
            <article
              v-for="department in activeDepartments"
              :key="department.id"
              class="academic-section"
            >
              <div class="academic-section__header">
                <div>
                  <h2 class="academic-section__title">
                    {{ department.name }}
                    <span v-if="department.shortName" class="academic-section__badge">
                      {{ department.shortName }}
                    </span>
                  </h2>
                  <p class="academic-section__meta">
                    {{ membersCountLabel(department) }}
                  </p>
                </div>

                <button
                  v-if="canDeleteDepartment(department)"
                  type="button"
                  class="btn btn-secondary academic-delete-btn"
                  :disabled="deletingDepartmentId === department.id"
                  @click="deleteDepartment(department)"
                >
                  {{ deletingDepartmentId === department.id ? '...' : (department.type === 'teacher' ? 'Удалить кафедру' : 'Удалить отдел') }}
                </button>
              </div>

              <div v-if="department.members.length === 0" class="academic-section__empty">
                {{ emptyLabel() }}
              </div>

              <ul v-else class="academic-members">
                <li
                  v-for="member in department.members"
                  :key="member.id"
                  class="academic-member"
                >
                  <div class="academic-member__name">
                    {{ member.fullName }}
                  </div>
                  <div class="academic-member__meta">
                    <template v-if="department.type === 'staff' || member.role !== 'teacher'">
                      {{ roleLabels[member.role] }} ·
                    </template>
                    {{ member.position }}
                    <span v-if="member.cabinet"> · каб. {{ member.cabinet }}</span>
                  </div>
                  <div class="academic-member__login">{{ member.login }}</div>
                </li>
              </ul>
            </article>
          </div>
          </template>
        </template>
      </div>
    </section>
  </PageFrame>
</template>
