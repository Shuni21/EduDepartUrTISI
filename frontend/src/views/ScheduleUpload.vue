<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageFrame from '@/components/PageFrame.vue'
import { useAuthStore } from '@/stores/auth'
import { hasScheduleManageAccess } from '@/utils/educationDepartmentAccess'
import { getErrorRoute } from '@/config/errorPages'
import {
  deleteScheduleUpload,
  fetchScheduleUploads,
  formatFileSize,
  getScheduleFileUrl,
  uploadScheduleFile, // можно оставить, если где-то ещё нужен
  previewScheduleFile,
  confirmScheduleUpload,
  type ScheduleUploadItem,
  type PreviewLesson,
} from '@/api/scheduleUpload'
import SchedulePairsSelectDialog from '@/components/SchedulePairsSelectDialog.vue'
import { fetchScheduleGroups, type ScheduleGroupInfo } from '@/api/schedule'
import { useConfirmDialogStore } from '@/stores/confirmDialog'
import {
  getGroupFaculty,
  studentFacultySelectOptions,
} from '@/views/schedule/scheduleOptions'

const router = useRouter()
const authStore = useAuthStore()
const confirmDialog = useConfirmDialogStore()

const uploads = ref<ScheduleUploadItem[]>([])
const selectedFaculty = ref('')
const selectedGroup = ref('')
const selectedFile = ref<File | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const loadError = ref<string | null>(null)
const submitMessage = ref<{
  type: 'success' | 'error'
  text: string
  details?: string[]
  warnings?: string[]
} | null>(null)
const expandedWarningId = ref<number | null>(null)
const deletingId = ref<number | null>(null)
const knownGroups = ref<ScheduleGroupInfo[]>([])
const groupSearchQuery = ref('')
const isGroupDropdownOpen = ref(false)
const uploadsSearchQuery = ref('')
const dragCounter = ref(0)
const isDraggingOver = computed(() => dragCounter.value > 0)
const goBack = () => router.push({ name: 'home' })
const showPairsDialog = ref(false)
const previewLessons = ref<PreviewLesson[]>([])
const pendingFile = ref<File | null>(null) // файл, который ждёт подтверждения

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls']
const ACCEPTED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]

const groupSuggestions = computed(() => {
  if (!selectedFaculty.value) {
    return []
  }

  const fromApi = knownGroups.value.map((g) => g.groupName)
  const fromUploads = uploads.value
      .map((u) => u.groupName)
      .filter((name): name is string => Boolean(name))

  const unique = [...new Set([...fromApi, ...fromUploads])]
      .filter((name) => {
        const faculty =
            knownGroups.value.find((g) => g.groupName === name)?.facultyName
            ?? getGroupFaculty(name)
        return faculty === selectedFaculty.value
      })
      .sort((a, b) => a.localeCompare(b, 'ru', { numeric: true }))

  const query = groupSearchQuery.value.trim().toLowerCase()
  if (!query) {
    return unique
  }

  return unique.filter((name) => name.toLowerCase().includes(query))
})

const filteredUploads = computed(() => {
  const query = uploadsSearchQuery.value.trim().toLowerCase()
  if (!query) {
    return uploads.value
  }

  return uploads.value.filter((upload) =>
      (upload.groupName?.toLowerCase().includes(query))
      || (upload.facultyName?.toLowerCase().includes(query))
      || upload.originalFileName.toLowerCase().includes(query)
      || [upload.uploadedBy.surname, upload.uploadedBy.name, upload.uploadedBy.patronymic]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
  )
})

async function loadKnownGroups() {
  try {
    knownGroups.value = await fetchScheduleGroups()
  } catch {
    knownGroups.value = []
  }
}

function resetPreviewState() {
  showPairsDialog.value = false
  previewLessons.value = []
  pendingFile.value = null
}

function closeGroupDropdown(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.group-search-wrap')) {
    isGroupDropdownOpen.value = false
  }
}

function isExcelFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
    || ACCEPTED_MIME_TYPES.includes(file.type)
}

function resetDragState() {
  dragCounter.value = 0
}

function onDocumentDragEnter(event: DragEvent) {
  if (!event.dataTransfer?.types.includes('Files')) {
    return
  }

  event.preventDefault()
  dragCounter.value += 1
}

function onDocumentDragLeave(event: DragEvent) {
  if (!event.dataTransfer?.types.includes('Files')) {
    return
  }

  event.preventDefault()
  dragCounter.value = Math.max(0, dragCounter.value - 1)
}

function onDocumentDragOver(event: DragEvent) {
  if (!event.dataTransfer?.types.includes('Files')) {
    return
  }

  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
}

function syncFileInput(file: File) {
  const fileInput = document.getElementById('schedule-file') as HTMLInputElement | null
  if (!fileInput) {
    return
  }

  const dataTransfer = new DataTransfer()
  dataTransfer.items.add(file)
  fileInput.files = dataTransfer.files
}

function assignSelectedFile(file: File) {
  if (!isExcelFile(file)) {
    submitMessage.value = {
      type: 'error',
      text: 'Можно загрузить только Excel-файл (.xlsx, .xls)',
    }
    return
  }

  if (!canSelectFile.value) {
    submitMessage.value = {
      type: 'error',
      text: 'Сначала выберите факультет и группу',
    }
    return
  }

  selectedFile.value = file
  submitMessage.value = null
  syncFileInput(file)
}

function onDocumentDrop(event: DragEvent) {
  if (!event.dataTransfer?.types.includes('Files')) {
    return
  }

  event.preventDefault()
  resetDragState()

  const file = event.dataTransfer.files?.[0]
  if (file) {
    assignSelectedFile(file)
  }
}

onMounted(async () => {
  document.addEventListener('click', closeGroupDropdown)
  document.addEventListener('dragenter', onDocumentDragEnter)
  document.addEventListener('dragleave', onDocumentDragLeave)
  document.addEventListener('dragover', onDocumentDragOver)
  document.addEventListener('drop', onDocumentDrop)
  document.addEventListener('dragend', resetDragState)

  if (!authStore.isAuthenticated || !hasScheduleManageAccess(authStore.currentUser)) {
    await router.replace(getErrorRoute('403', 'У вас нет доступа к загрузке расписания'))
    return
  }

  await Promise.all([loadUploads(), loadKnownGroups()])
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeGroupDropdown)
  document.removeEventListener('dragenter', onDocumentDragEnter)
  document.removeEventListener('dragleave', onDocumentDragLeave)
  document.removeEventListener('dragover', onDocumentDragOver)
  document.removeEventListener('drop', onDocumentDrop)
  document.removeEventListener('dragend', resetDragState)
})

const selectedFileName = computed(() => {
  if (!selectedGroup.value.trim()) {
    return 'Сначала введите группу'
  }

  return selectedFile.value?.name ?? 'Файл не выбран'
})

const canSelectFile = computed(() => Boolean(selectedFaculty.value && selectedGroup.value.trim()))
const canUpload = computed(() => canSelectFile.value && Boolean(selectedFile.value) && !isSubmitting.value)

watch(selectedFaculty, () => {
  selectedGroup.value = ''
  selectedFile.value = null
  submitMessage.value = null
  groupSearchQuery.value = ''
  isGroupDropdownOpen.value = false
  resetPreviewState()

  const fileInput = document.getElementById('schedule-file') as HTMLInputElement | null
  if (fileInput) {
    fileInput.value = ''
  }
})

watch(selectedGroup, () => {
  selectedFile.value = null
  submitMessage.value = null
  resetPreviewState()

  const fileInput = document.getElementById('schedule-file') as HTMLInputElement | null
  if (fileInput) {
    fileInput.value = ''
  }
})

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function toStringList(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const list = value
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)

    return list.length > 0 ? list : undefined
  }

  if (typeof value === 'string' && value.trim()) {
    return [value]
  }

  return undefined
}

function getErrorPayload(data: unknown): {
  message?: unknown
  errors?: unknown
  warnings?: unknown
} {
  if (!data || typeof data !== 'object') {
    return {}
  }

  const payload = data as {
    message?: unknown
    errors?: unknown
    warnings?: unknown
  }

  if (
    payload.message
    && typeof payload.message === 'object'
    && !Array.isArray(payload.message)
  ) {
    const nested = payload.message as {
      message?: unknown
      errors?: unknown
      warnings?: unknown
    }

    return {
      message: nested.message ?? payload.message,
      errors: nested.errors ?? payload.errors,
      warnings: nested.warnings ?? payload.warnings,
    }
  }

  return payload
}

function getVisibleUploadWarnings(warnings: string[] | null | undefined): string[] | undefined {
  const visibleWarnings = warnings?.filter((warning) =>
    warning.startsWith('Преподаватель не найден в БД:'),
  )

  return visibleWarnings?.length ? visibleWarnings : undefined
}

function selectGroup(name: string) {
  selectedGroup.value = name
  groupSearchQuery.value = name
  isGroupDropdownOpen.value = false
}

function onGroupInput() {
  selectedGroup.value = groupSearchQuery.value
  isGroupDropdownOpen.value = true
}

async function loadUploads() {
  isLoading.value = true
  loadError.value = null

  try {
    uploads.value = await fetchScheduleUploads()
  } catch (err: any) {
    loadError.value = err.response?.data?.message || 'Не удалось загрузить список файлов'
  } finally {
    isLoading.value = false
  }
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null

  if (file && !isExcelFile(file)) {
    selectedFile.value = null
    input.value = ''
    submitMessage.value = {
      type: 'error',
      text: 'Можно загрузить только Excel-файл (.xlsx, .xls)',
    }
    return
  }

  selectedFile.value = file
  submitMessage.value = null
}

async function handleUpload() {
  submitMessage.value = null

  if (!selectedFaculty.value) {
    submitMessage.value = { type: 'error', text: 'Выберите факультет' }
    return
  }
  if (!selectedGroup.value.trim()) {
    submitMessage.value = { type: 'error', text: 'Введите группу' }
    return
  }
  if (!selectedFile.value) {
    submitMessage.value = { type: 'error', text: 'Выберите файл расписания' }
    return
  }

  isSubmitting.value = true

  try {
    const preview = await previewScheduleFile(
        selectedFaculty.value,
        selectedGroup.value.trim(),
        selectedFile.value,
    )

    if (!preview.lessons.length) {
      submitMessage.value = {
        type: 'error',
        text: 'В файле не найдено ни одной пары',
        warnings: preview.parseWarnings,
      }
      return
    }

    const hasAnyConflict = preview.lessons.some((l) => l.hasConflict)

    // конфликтов нет — сразу загружаем все пары, без окна
    if (!hasAnyConflict) {
      pendingFile.value = selectedFile.value
      const allIndexes = preview.lessons.map((l) => l.index)
      isSubmitting.value = false // снимем флаг handleUpload
      await onPairsConfirm(allIndexes)
      return
    }

    // есть конфликты — показываем диалог выбора
    pendingFile.value = selectedFile.value
    previewLessons.value = preview.lessons
    showPairsDialog.value = true
  } catch (err: any) {
    const data = getErrorPayload(err.response?.data)
    const details = toStringList(data.errors)
        ?? (Array.isArray(data.message) ? toStringList(data.message) : undefined)
    const warnings = toStringList(data.warnings)

    submitMessage.value = {
      type: 'error',
      text: typeof data.message === 'string'
          ? data.message
          : 'Не удалось разобрать файл',
      details,
      warnings,
    }
  } finally {
    isSubmitting.value = false
  }
}

async function onPairsConfirm(selectedIndexes: number[]) {
  if (!pendingFile.value || !selectedFaculty.value || !selectedGroup.value.trim()) {
    resetPreviewState()
    return
  }

  isSubmitting.value = true
  submitMessage.value = null

  try {
    const uploaded = await confirmScheduleUpload(
        selectedFaculty.value,
        selectedGroup.value.trim(),
        pendingFile.value,
        selectedIndexes,
    )

    uploads.value = [
      uploaded,
      ...uploads.value.filter((item) => !(
          item.groupName === uploaded.groupName
          && item.periodStart === uploaded.periodStart
          && item.periodEnd === uploaded.periodEnd
      )),
    ]

    selectedFile.value = null
    const fileInput = document.getElementById('schedule-file') as HTMLInputElement | null
    if (fileInput) fileInput.value = ''

    submitMessage.value = {
      type: 'success',
      text: uploaded.periodStart && uploaded.periodEnd
          ? `Расписание группы ${uploaded.groupName ?? selectedGroup.value} за период ${uploaded.periodStart} — ${uploaded.periodEnd} загружено: ${uploaded.lessonsCount} занятий`
          : `Расписание группы ${uploaded.groupName ?? selectedGroup.value} загружено: ${uploaded.lessonsCount} занятий`,
      warnings: getVisibleUploadWarnings(uploaded.parseWarnings),
    }

    resetPreviewState() // только после успеха
  } catch (err: any) {
    const data = getErrorPayload(err.response?.data)
    const details = toStringList(data.errors)
        ?? (Array.isArray(data.message) ? toStringList(data.message) : undefined)
    const warnings = toStringList(data.warnings)

    submitMessage.value = {
      type: 'error',
      text: typeof data.message === 'string'
          ? data.message
          : 'Не удалось сохранить выбранные пары',
      details,
      warnings,
    }
    // диалог НЕ закрываем — можно снять конфликтующие пары и нажать ещё раз
  } finally {
    isSubmitting.value = false
  }
}

function onPairsCancel() {
  resetPreviewState()
}

async function handleDelete(id: number) {
  const confirmed = await confirmDialog.confirm({
    message: 'Удалить загруженный файл?',
    confirmText: 'Удалить',
    variant: 'danger',
  })

  if (!confirmed) {
    return
  }

  deletingId.value = id

  try {
    await deleteScheduleUpload(id)
    uploads.value = uploads.value.filter((item) => item.id !== id)
  } catch (err: any) {
    submitMessage.value = {
      type: 'error',
      text: err.response?.data?.message || 'Не удалось удалить файл',
    }
  } finally {
    deletingId.value = null
  }
}


const toggleUploadWarnings = (id: number) => {
  expandedWarningId.value = expandedWarningId.value === id ? null : id
}
</script>

<template>
  <PageFrame>
    <Teleport to="body">
      <div
        v-if="isDraggingOver"
        class="schedule-drop-overlay"
        aria-hidden="true"
      >
        <div class="schedule-drop-overlay__panel">
          <svg
            class="schedule-drop-overlay__icon"
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 16V8M12 8L9 11M12 8L15 11"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M4 16V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V16"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <p class="schedule-drop-overlay__title">Отпустите файл для загрузки</p>
          <p class="schedule-drop-overlay__hint">
            {{ canSelectFile ? 'Excel (.xlsx, .xls)' : 'Сначала выберите факультет и группу' }}
          </p>
        </div>
      </div>
    </Teleport>

    <section class="admin-edit-page schedule-upload-page">
      <div class="admin-card">
        <div class="card-header">
          <button class="back-btn" type="button" @click="goBack" aria-label="Назад">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <h1 class="card-title">Загрузка расписания</h1>
        </div>

        <p class="card-subtitle">
          Выберите факультет, введите группу и загрузите Excel-файл расписания.
          Период берётся из шапки файла — можно загружать части расписания отдельно.
          Повторная загрузка того же периода заменит только его, остальные периоды сохранятся.
        </p>

        <div v-if="submitMessage" :class="['submit-message', submitMessage.type]">
          <p>{{ submitMessage.text }}</p>

          <div v-if="submitMessage.details?.length" class="message-block">
            <strong>{{ submitMessage.type === 'error' ? 'Детали ошибки:' : 'Детали:' }}</strong>
            <ul class="message-list">
              <li v-for="(detail, index) in submitMessage.details" :key="index">
                {{ detail }}
              </li>
            </ul>
          </div>

          <div v-if="submitMessage.warnings?.length" class="message-block warnings-block">
            <strong>Предупреждения при разборе файла:</strong>
            <ul class="message-list">
              <li v-for="(warning, index) in submitMessage.warnings" :key="index">
                {{ warning }}
              </li>
            </ul>
          </div>
        </div>

        <form class="user-form" @submit.prevent="handleUpload">
          <div class="form-section">
            <h2 class="section-title">Новая загрузка</h2>

            <div class="form-row">
              <div class="form-group">
                <label for="schedule-faculty" class="form-label">
                  Факультет <span class="required">*</span>
                </label>
                <select
                  id="schedule-faculty"
                  v-model="selectedFaculty"
                  class="form-select"
                  :disabled="isSubmitting"
                >
                  <option value="">Выберите факультет</option>
                  <option
                    v-for="option in studentFacultySelectOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <div class="form-group group-search-wrap">
                <label for="schedule-group" class="form-label">
                  Группа <span class="required">*</span>
                </label>

                <input
                  id="schedule-group"
                  v-model="groupSearchQuery"
                  type="search"
                  class="form-input"
                  placeholder="Начните вводить группу"
                  autocomplete="off"
                  :disabled="!selectedFaculty || isSubmitting"
                  @input="onGroupInput"
                  @focus="isGroupDropdownOpen = true"
                />

                <ul
                  v-if="isGroupDropdownOpen && selectedFaculty && groupSuggestions.length > 0"
                  class="group-suggestions"
                >
                  <li
                    v-for="group in groupSuggestions"
                    :key="group"
                  >
                    <button type="button" @click.stop="selectGroup(group)">
                      {{ group }}
                    </button>
                  </li>
                </ul>

                <p
                  v-else-if="isGroupDropdownOpen && selectedFaculty && groupSearchQuery.trim() && groupSuggestions.length === 0"
                  class="group-suggestions-empty"
                >
                  Группа не найдена — можно ввести новую вручную
                </p>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group full-width">
                <label for="schedule-file" class="form-label">
                  Файл Excel <span class="required">*</span>
                </label>
                <label
                  class="file-drop-zone"
                  :class="{
                    'is-disabled': !canSelectFile || isSubmitting,
                    'has-file': Boolean(selectedFile),
                  }"
                  for="schedule-file"
                >
                  <input
                    id="schedule-file"
                    type="file"
                    accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    class="file-drop-zone__input"
                    :disabled="!canSelectFile || isSubmitting"
                    @change="onFileSelected"
                  />
                  <span class="file-drop-zone__title">
                    {{ selectedFile ? selectedFile.name : 'Выберите или перетащите Excel-файл' }}
                  </span>
                  <span class="file-drop-zone__hint">
                    {{ canSelectFile ? 'Нажмите или перетащите файл сюда' : selectedFileName }}
                  </span>
                </label>
              </div>
            </div>

            <div class="form-actions">
              <button class="btn btn-primary" type="submit" :disabled="!canUpload">
                {{ isSubmitting ? 'Загрузка...' : 'Загрузить расписание' }}
              </button>
            </div>
          </div>
        </form>

        <div class="form-section uploads-section">
          <h2 class="section-title">Загруженные файлы</h2>

          <p v-if="isLoading" class="uploads-state">Загрузка списка...</p>
          <p v-else-if="loadError" class="uploads-state error">{{ loadError }}</p>
          <p v-else-if="uploads.length === 0" class="uploads-state">
            Пока нет загруженных файлов
          </p>

          <template v-else>
            <input
              v-model="uploadsSearchQuery"
              class="users-search uploads-search"
              type="search"
              placeholder="Поиск по группе, факультету или файлу"
            >

            <div class="users-table uploads-table">
            <div class="table-header">
              <span class="col-faculty">Факультет</span>
              <span class="col-name">Группа / файл</span>
              <span class="col-uploader">Загрузил</span>
              <span class="col-created">Дата</span>
              <span class="col-role">Занятий</span>
              <span class="col-actions">Действия</span>
            </div>

            <p v-if="filteredUploads.length === 0" class="uploads-state">
              По запросу ничего не найдено
            </p>

            <div v-for="upload in filteredUploads" :key="upload.id" class="table-row">
              <span class="col-faculty" data-label="Факультет">{{ upload.facultyName ?? '—' }}</span>
              <span class="col-name" data-label="Группа / файл">
                <strong v-if="upload.groupName">{{ upload.groupName }}</strong>
                <span v-if="upload.periodStart && upload.periodEnd" class="upload-period">
                  Период: {{ upload.periodStart }} — {{ upload.periodEnd }}
                </span>
                <a
                  class="file-link"
                  :href="getScheduleFileUrl(upload.fileUrl)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ upload.originalFileName }}
                </a>
                <span class="file-size">{{ formatFileSize(upload.fileSize) }}</span>
                <span v-if="getVisibleUploadWarnings(upload.parseWarnings)?.length" class="parse-warning">
                  <button
                    type="button"
                    class="warning-toggle"
                    @click="toggleUploadWarnings(upload.id)"
                  >
                    {{ getVisibleUploadWarnings(upload.parseWarnings)?.length }} предупреждений
                    {{ expandedWarningId === upload.id ? '▲' : '▼' }}
                  </button>
                  <ul
                    v-if="expandedWarningId === upload.id"
                    class="upload-warning-list"
                  >
                    <li
                      v-for="(warning, index) in getVisibleUploadWarnings(upload.parseWarnings)"
                      :key="index"
                    >
                      {{ warning }}
                    </li>
                  </ul>
                </span>
              </span>
              <span class="col-uploader" data-label="Загрузил">
                {{ [upload.uploadedBy.surname, upload.uploadedBy.name, upload.uploadedBy.patronymic]
                  .filter(Boolean)
                  .join(' ') || '—' }}
              </span>
              <span class="col-created" data-label="Дата">{{ formatDate(upload.uploadedAt) }}</span>
              <span class="col-role" data-label="Занятий">{{ upload.lessonsCount }}</span>
              <span class="col-actions" data-label="Действия">
                <button
                  class="close-btn"
                  type="button"
                  :disabled="deletingId === upload.id"
                  @click="handleDelete(upload.id)"
                >
                  {{ deletingId === upload.id ? '...' : 'Удалить' }}
                </button>
              </span>
            </div>
            </div>
          </template>
        </div>
      </div>
    </section>
    <SchedulePairsSelectDialog
        v-model:open="showPairsDialog"
        :lessons="previewLessons"
        :group-name="selectedGroup"
        @confirm="onPairsConfirm"
        @cancel="onPairsCancel"
    />
  </PageFrame>
</template>

<style scoped>
.schedule-upload-page .card-subtitle {
  margin: -16px 0 24px;
}

.schedule-drop-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(16, 18, 21, 0.55);
  backdrop-filter: blur(2px);
  pointer-events: none;
}

.schedule-drop-overlay__panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: min(420px, 100%);
  padding: 36px 28px;
  border: 2px dashed #4ea3d7;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
  text-align: center;
}

:global(.dark) .schedule-drop-overlay__panel {
  background: rgba(30, 34, 40, 0.96);
  border-color: #6bb5e0;
}

.schedule-drop-overlay__icon {
  color: #4ea3d7;
}

:global(.dark) .schedule-drop-overlay__icon {
  color: #6bb5e0;
}

.schedule-drop-overlay__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #101215;
}

:global(.dark) .schedule-drop-overlay__title {
  color: #f0f4f7;
}

.schedule-drop-overlay__hint {
  margin: 0;
  font-size: 14px;
  color: #5f6770;
}

:global(.dark) .schedule-drop-overlay__hint {
  color: #9aa3ad;
}

.file-drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 120px;
  padding: 20px 16px;
  border: 2px dashed #c5d3df;
  border-radius: 10px;
  background: #f8fafc;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
}

:global(.dark) .file-drop-zone {
  border-color: #3a424d;
  background: #1a1f25;
}

.file-drop-zone:hover:not(.is-disabled) {
  border-color: #4ea3d7;
  background: #eef6fc;
}

:global(.dark) .file-drop-zone:hover:not(.is-disabled) {
  border-color: #6bb5e0;
  background: #222830;
}

.file-drop-zone.has-file:not(.is-disabled) {
  border-color: #4ea3d7;
  background: #eef6fc;
}

:global(.dark) .file-drop-zone.has-file:not(.is-disabled) {
  border-color: #6bb5e0;
  background: #222830;
}

.file-drop-zone.is-disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.file-drop-zone__input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.file-drop-zone__title {
  font-size: 14px;
  font-weight: 600;
  color: #24313f;
  text-align: center;
  word-break: break-word;
}

:global(.dark) .file-drop-zone__title {
  color: #d5dde6;
}

.file-drop-zone__hint {
  font-size: 13px;
  color: #5f6770;
  text-align: center;
}

:global(.dark) .file-drop-zone__hint {
  color: #9aa3ad;
}

.uploads-section {
  margin-top: 8px;
}

.uploads-state {
  margin: 0;
  color: #5f6770;
}

:global(.dark) .uploads-state {
  color: #9aa3ad;
}

.uploads-state.error {
  color: #b42318;
}

:global(.dark) .uploads-state.error {
  color: #f1948a;
}

.uploads-table .table-header,
.uploads-table .table-row {
  grid-template-columns: 1fr 1.6fr 1.3fr 1fr 0.8fr 0.8fr;
}

.file-link {
  color: #2f7fbf;
  text-decoration: none;
}

:global(.dark) .file-link {
  color: #6bb5e0;
}

.file-link:hover {
  text-decoration: underline;
}

.file-size {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #5f6770;
}

:global(.dark) .file-size {
  color: #9aa3ad;
}

.error-details,
.message-list {
  margin: 8px 0 0;
  padding-left: 18px;
}

.error-details li,
.message-list li {
  margin-top: 4px;
}

.message-block {
  margin-top: 12px;
}

.warnings-block {
  color: #7a5b00;
}

:global(.dark) .warnings-block {
  color: #d4a843;
}

.parse-warning {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #9a6700;
}

:global(.dark) .parse-warning {
  color: #d4a843;
}

.warning-toggle {
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: left;
}

.upload-warning-list {
  margin: 8px 0 0;
  padding-left: 18px;
}

.upload-warning-list li {
  margin-top: 4px;
}

.col-name strong {
  display: block;
  margin-bottom: 4px;
}

.upload-period {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #355f8c;
}

:global(.dark) .upload-period {
  color: #9fd0ef;
}

.schedule-upload-page .close-btn {
  width: auto;
  height: auto;
  padding: 6px 12px;
  font-size: 13px;
  white-space: nowrap;
}

.group-search-wrap {
  position: relative;
}

.group-suggestions {
  position: absolute;
  z-index: 10;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 220px;
  overflow-y: auto;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  background: #fff;
  border: 1px solid #d8dee4;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

:global(.dark) .group-suggestions {
  background: #252a31;
  border-color: #3a424c;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.group-suggestions button {
  display: block;
  width: 100%;
  padding: 8px 24px;
  border: none;
  background: #fff;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: #24313f;
}

.group-suggestions button:hover {
  background: #1f6fd2;
  color: #fff;
}

:global(.dark) .group-suggestions button:hover {
  background: #1f6fd2;
  color: #fff;
}

:global(.dark) .group-suggestions button {
  background: #252a31;
  color: #f0f4f7;
}

.group-suggestions-empty {
  position: absolute;
  z-index: 10;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 10px 12px;
  font-size: 13px;
  color: #5f6770;
  background: #fff;
  border: 1px solid #d8dee4;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

:global(.dark) .group-suggestions-empty {
  color: #9aa3ad;
  background: #252a31;
  border-color: #3a424c;
}

.uploads-search {
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .schedule-upload-page.admin-edit-page {
    padding: 16px 10px;
    align-items: stretch;
  }

  .schedule-upload-page .admin-card {
    padding: 18px 14px;
    border-radius: 12px;
  }

  .schedule-upload-page .card-header {
    grid-template-columns: 38px 1fr 38px;
    gap: 10px;
    margin-bottom: 16px;
  }

  .schedule-upload-page .card-title {
    font-size: 20px;
    line-height: 1.25;
  }

  .schedule-upload-page .card-subtitle {
    margin: 0 0 18px;
    text-align: left;
    font-size: 14px;
    line-height: 1.45;
    padding-bottom: 14px;
  }

  .schedule-upload-page .form-section {
    padding: 16px 12px;
  }

  .schedule-upload-page .section-title {
    font-size: 16px;
    margin-bottom: 14px;
    padding-bottom: 10px;
  }

  .schedule-upload-page .form-row {
    grid-template-columns: 1fr;
    gap: 14px;
    margin-bottom: 14px;
  }

  .schedule-upload-page .form-actions {
    flex-direction: column;
    padding-top: 16px;
  }

  .schedule-upload-page .form-actions .btn {
    width: 100%;
  }

  .schedule-upload-page .submit-message {
    font-size: 13px;
    line-height: 1.45;
    word-break: break-word;
  }

  .schedule-upload-page .file-drop-zone {
    min-height: 108px;
    padding: 16px 12px;
  }

  .schedule-upload-page .file-drop-zone__title,
  .schedule-upload-page .file-drop-zone__hint {
    font-size: 12px;
    line-height: 1.4;
    word-break: break-word;
  }

  .schedule-upload-page .uploads-table .table-header {
    display: none;
  }

  .schedule-upload-page .uploads-table .table-row {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 14px 12px;
    align-items: stretch;
  }

  .schedule-upload-page .uploads-table .table-row > [class^='col-'] {
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
  }

  .schedule-upload-page .uploads-table .table-row > [class^='col-']::before {
    content: attr(data-label);
    display: block;
    margin-bottom: 4px;
    font-size: 11px;
    font-weight: 600;
    color: #5f6975;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  :global(.dark) .schedule-upload-page .uploads-table .table-row > [class^='col-']::before {
    color: #9aa3ad;
  }

  .schedule-upload-page .col-actions {
    justify-content: flex-start;
    padding-top: 4px;
  }

  .schedule-upload-page .close-btn {
    width: auto !important;
    height: auto !important;
    min-height: 38px;
    padding: 8px 14px !important;
    font-size: 13px !important;
  }

  .schedule-upload-page .file-link {
    word-break: break-word;
  }
}

@media (max-width: 480px) {
  .schedule-upload-page.admin-edit-page {
    padding: 12px 8px;
  }

  .schedule-upload-page .admin-card {
    padding: 14px 12px;
  }

  .schedule-upload-page .card-title {
    font-size: 18px;
  }

  .schedule-upload-page .card-subtitle {
    font-size: 13px;
  }
}
</style>
