<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConfirmDialogStore } from '@/stores/confirmDialog'
import { hasScheduleManageAccess } from '@/utils/educationDepartmentAccess'
import {
  fetchGroupSchedule,
  fetchPreholidayDays,
  fetchRoomSchedule,
  fetchScheduleTeachers,
  fetchTeacherSchedule,
} from '@/api/schedule'
import {
  createConsultation,
  deleteConsultation,
  fetchDepartmentConsultations,
  updateConsultation,
} from '@/api/consultations'
import {
  createScheduleItem,
  deleteScheduleItem,
  fetchScheduleItemLinkedGroups,
  fetchScheduleTransferRecommendations,
  previewScheduleItemChanges,
  showScheduleAdminError,
  type ScheduleItemPreviewPayload,
  type ScheduleTransferRecommendation,
  updatePreholidayDay,
  updateScheduleItem,
} from '@/api/scheduleAdmin'
import editIcon from '@/assets/edit.svg'
import {
  type DisplayScheduleItem,
  type ScheduleKind,
  type SchedulePeriodMeta,
  BUILDING_OPTIONS,
  CONSULTATION_BUILDING_OPTIONS,
  CONSULTATION_DISTANCE_BUILDING,
  DISTANCE_BUILDING,
  DISTANCE_ROOM_LABEL,
  SPORTS_HALL_ROOM_LABEL,
  getAutoFilledRoomLabel,
  isAutoFilledRoomBuilding,
  isConsultationDistanceBuilding,
  LESSON_TYPE_OPTIONS,
  buildConsultationAcademicWeeks,
  formatRoomForApi,
  formatSchedulePeriodSuffix,
  getConsultationAcademicYearStart,
  getLessonGridClass,
  getLessonTypeLabel,
  getWeekStartFromLabel,
  isLectureLessonType,
  isMultiGroupLessonType,
  isSubgroupApplicableLessonType,
  normalizeLessonTypeForForm,
  parseGroupNames,
  parseRoomForForm,
  getRomanRoomHint,
  resolveLessonGroups,
} from './scheduleOptions'
import type { Socket } from 'socket.io-client'
import { connectScheduleSocket } from '@/api/scheduleSocket'
import { canManageConsultations } from '@/utils/consultationAccess'
import PageFrame from "@/components/PageFrame.vue";
import { usePageTitle } from '@/composables/usePageTitle'
import {
  getOwnPersonalScheduleCache,
  saveOwnPersonalScheduleCache,
} from '@/utils/personalScheduleCache'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const confirmDialog = useConfirmDialogStore()

let scheduleSocket: Socket | null = null
let scheduleReloadTimer: ReturnType<typeof setTimeout> | null = null
let editPreviewTimer: ReturnType<typeof setTimeout> | null = null
let transferPreviewTimer: ReturnType<typeof setTimeout> | null = null
let transferDragPreviewTimer: ReturnType<typeof setTimeout> | null = null
let scheduleLoadGeneration = 0
let editPreviewGeneration = 0
let transferPreviewGeneration = 0
let transferDragPreviewGeneration = 0

const reloadScheduleSoon = () => {
  if (scheduleReloadTimer) {
    clearTimeout(scheduleReloadTimer)
  }

  scheduleReloadTimer = setTimeout(() => {
    void refreshSchedulePreservingView()
  }, 200)
}

const connectScheduleLiveUpdates = () => {
  scheduleSocket?.removeAllListeners()
  scheduleSocket?.disconnect()

  scheduleSocket = connectScheduleSocket({
    onScheduleChanged: () => {
      reloadScheduleSoon()
    },
    onPreholidayDaysUpdated: ({ preholidayDays }) => {
      preholidayDayKeys.value = normalizePreholidayDayKeys(preholidayDays)
    },
    onConnectError: () => {
      console.warn('Не удалось подключиться к live-обновлениям расписания')
    },
  })
}

type TimeSlot = {
  pairNumber: number
  startTime: string
  endTime: string
  matchingStartTimes?: string[]
}

const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ']
const saturdayDay = 'СБ'
const weekdayDays = days.filter((day) => day !== saturdayDay)
//Будний дни
const weekdayTimeSlots: TimeSlot[] = [
  { pairNumber: 1, startTime: '08:30', endTime: '10:00' },
  { pairNumber: 2, startTime: '10:15', endTime: '11:45' },
  { pairNumber: 3, startTime: '12:00', endTime: '13:30' },
  { pairNumber: 4, startTime: '14:15', endTime: '15:45' },
  { pairNumber: 5, startTime: '16:00', endTime: '17:30' },
  { pairNumber: 6, startTime: '17:40', endTime: '19:05' },
  { pairNumber: 7, startTime: '19:15', endTime: '20:40' },
]

//Суббота
const saturdayTimeSlots: TimeSlot[] = [
  { pairNumber: 1, startTime: '08:30', endTime: '10:00' },
  { pairNumber: 2, startTime: '10:15', endTime: '11:45' },
  { pairNumber: 3, startTime: '12:00', endTime: '13:30' },
  { pairNumber: 4, startTime: '13:45', endTime: '15:15' },
  { pairNumber: 5, startTime: '15:30', endTime: '17:00' },
  { pairNumber: 6, startTime: '17:10', endTime: '18:40' },
]

const preholidayTimeSlots: TimeSlot[] = [
  { pairNumber: 1, startTime: '08:30', endTime: '10:00' },
  { pairNumber: 2, startTime: '10:15', endTime: '11:45' },
  { pairNumber: 3, startTime: '12:00', endTime: '13:30' },
  { pairNumber: 4, startTime: '13:45', endTime: '14:45', matchingStartTimes: ['13:45', '14:15'] },
  { pairNumber: 5, startTime: '15:00', endTime: '16:00', matchingStartTimes: ['15:00', '16:00'] },
]

const times = weekdayTimeSlots.map((slot) => slot.startTime)

const PAIR_END_TIMES: Record<string, string> = {
  '08:30': '10:00',
  '10:15': '11:45',
  '12:00': '13:30',
  '13:45': '15:15',
  '14:15': '15:45',
  '15:00': '16:00',
  '15:30': '17:00',
  '16:00': '17:30',
  '17:40': '19:05',
  '19:15': '20:40',
}

const DAY_TO_NUMBER: Record<string, number> = {
  ПН: 1,
  ВТ: 2,
  СР: 3,
  ЧТ: 4,
  ПТ: 5,
  СБ: 6,
}

const DAY_TO_OFFSET: Record<string, number> = {
  ПН: 0,
  ВТ: 1,
  СР: 2,
  ЧТ: 3,
  ПТ: 4,
  СБ: 5,
}

//Праздники
const PUBLIC_HOLIDAYS: Record<string, string> = {
  '01-01': 'Новогодние каникулы',
  '01-02': 'Новогодние каникулы',
  '01-03': 'Новогодние каникулы',
  '01-04': 'Новогодние каникулы',
  '01-05': 'Новогодние каникулы',
  '01-06': 'Новогодние каникулы',
  '01-07': 'Рождество Христово',
  '01-08': 'Новогодние каникулы',
  '02-23': 'День защитника Отечества',
  '03-08': 'Международный женский день',
  '05-01': 'Праздник Весны и Труда',
  '05-09': 'День Победы',
  '06-12': 'День России',
  '11-04': 'День народного единства',
}

const scheduleType = computed(() => route.params.type as ScheduleKind)
const firstValue = computed(() => String(route.query.first ?? ''))
const secondValue = computed(() => String(route.query.second ?? ''))
const departmentName = computed(() => secondValue.value)

type CellLesson = DisplayScheduleItem & {
  groups: string[]
}

const selectedLesson = ref<CellLesson | null>(null)
const isRomanRoomHintOpen = ref(false)
const editingLesson = ref<CellLesson | null>(null)
const currentWeekIndex = ref(0)
const selectedWeekKey = ref<string | null>(null)
const hasSyncedInitialWeek = ref(false)
const pendingWeekKeyToRestore = ref<string | null>(null)
const hasLoadedScheduleOnce = ref(false)
const studentWeeklySchedules = ref<Record<string, DisplayScheduleItem[]>>({})
const schedulePeriodMeta = ref<SchedulePeriodMeta>({
  academicYearLabel: null,
  periodStart: null,
  periodEnd: null,
  periodLabel: null,
})
const isLoadingSchedule = ref(false)
const scheduleLoadError = ref<string | null>(null)
const offlineScheduleNotice = ref<string | null>(null)
const preholidayDayKeys = ref<string[]>([])
const isSavingPreholidayDay = ref(false)
const consultationTeachers = ref<string[]>([])

const isMenuVisible = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const contextLesson = ref<CellLesson | null>(null)
const isMobileLayout = ref(false)
let mobileMediaQuery: MediaQueryList | null = null

const isEditModalVisible = ref(false)
const isCreatingLesson = ref(false)
const isSaving = ref(false)
const isTransferModalVisible = ref(false)
const transferringLesson = ref<CellLesson | null>(null)
const isTransferSaving = ref(false)
const isLoadingTransferRecommendations = ref(false)
const transferRecommendationError = ref<string | null>(null)
const transferRecommendations = ref<ScheduleTransferRecommendation[]>([])
const isLoadingTransferPreview = ref(false)
const transferPreviewError = ref<string | null>(null)
const transferPreviewConflicts = ref<string[]>([])
const transferPreviewRecommendations = ref<ScheduleTransferRecommendation[]>([])
const initialTransferFormSignature = ref('')
const isLoadingEditPreview = ref(false)
const editPreviewError = ref<string | null>(null)
const editPreviewConflicts = ref<string[]>([])
const editPreviewRecommendations = ref<ScheduleTransferRecommendation[]>([])
const editSlotContext = ref<{
  weekLabel: string
  weekStart: string | null
  day: string
} | null>(null)
const editForm = ref({
  name: '',
  type: '',
  group: '',
  teacher: '',
  building: '',
  room: '',
  day: 'ПН',
  time: '',
  subgroup: '' as '' | '1' | '2',
  additional: '',
})
const transferForm = ref({
  weekKey: '',
  day: 'ПН',
  time: '',
  building: '',
  room: '',
})

type TransferTarget = {
  weekKey: string
  day: string
  startTime: string
  endTime: string
  room: string | null
}

const draggedTransferLesson = ref<CellLesson | null>(null)
const transferDragTarget = ref<TransferTarget | null>(null)
const isLoadingTransferDragPreview = ref(false)
const transferDragPreviewError = ref<string | null>(null)
const transferDragPreviewConflicts = ref<string[]>([])
const transferDragPreviewStatus = ref<'idle' | 'loading' | 'valid' | 'invalid' | 'error'>('idle')
const transferDropInProgress = ref(false)

const applySchedulePeriodMeta = (meta?: Partial<SchedulePeriodMeta> | null) => {
  schedulePeriodMeta.value = {
    academicYearLabel: meta?.academicYearLabel ?? null,
    periodStart: meta?.periodStart ?? null,
    periodEnd: meta?.periodEnd ?? null,
    periodLabel: meta?.periodLabel ?? null,
  }
}

const formatCachedAt = (value: string): string => {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

const applyOfflinePersonalSchedule = (cachedSchedule: ReturnType<typeof getOwnPersonalScheduleCache>) => {
  if (!cachedSchedule) {
    return false
  }

  studentWeeklySchedules.value = cachedSchedule.weeks
  applySchedulePeriodMeta(cachedSchedule.meta)
  offlineScheduleNotice.value = `Показана сохраненная копия "Моего расписания" от ${formatCachedAt(cachedSchedule.cachedAt)}.`
  scheduleLoadError.value = null
  return true
}

type LoadScheduleOptions = {
  silent?: boolean
}

const loadSchedule = async (options: LoadScheduleOptions = {}) => {
  const silent = options.silent ?? false
  const generation = ++scheduleLoadGeneration

  if (!secondValue.value && scheduleType.value !== 'consults') {
    studentWeeklySchedules.value = {}
    applySchedulePeriodMeta(null)
    scheduleLoadError.value = null
    isLoadingSchedule.value = false
    hasLoadedScheduleOnce.value = false
    return
  }

  if (scheduleType.value === 'consults' && !firstValue.value) {
    studentWeeklySchedules.value = {}
    applySchedulePeriodMeta(null)
    scheduleLoadError.value = null
    isLoadingSchedule.value = false
    hasLoadedScheduleOnce.value = false
    return
  }

  if (!silent) {
    isLoadingSchedule.value = true
  }
  scheduleLoadError.value = null

  try {
    if (scheduleType.value === 'students') {
      const response = await fetchGroupSchedule(secondValue.value)
      if (generation !== scheduleLoadGeneration) {
        return
      }
      studentWeeklySchedules.value = response.weeks
      applySchedulePeriodMeta(response)
      offlineScheduleNotice.value = null
      saveOwnPersonalScheduleCache(
        authStore.currentUser,
        scheduleType.value,
        secondValue.value,
        response.weeks,
        response,
      )
      return
    }

    if (scheduleType.value === 'teachers') {
      const response = await fetchTeacherSchedule(secondValue.value)
      if (generation !== scheduleLoadGeneration) {
        return
      }
      studentWeeklySchedules.value = response.weeks
      applySchedulePeriodMeta(response)
      offlineScheduleNotice.value = null
      saveOwnPersonalScheduleCache(
        authStore.currentUser,
        scheduleType.value,
        secondValue.value,
        response.weeks,
        response,
      )
      return
    }

    if (scheduleType.value === 'consults') {
      const response = await fetchDepartmentConsultations(Number(firstValue.value))
      if (generation !== scheduleLoadGeneration) {
        return
      }
      studentWeeklySchedules.value = response.weeks
      applySchedulePeriodMeta(null)
      offlineScheduleNotice.value = null
      return
    }

    if (scheduleType.value === 'auditories') {
      const response = await fetchRoomSchedule(secondValue.value)
      if (generation !== scheduleLoadGeneration) {
        return
      }
      studentWeeklySchedules.value = response.weeks
      applySchedulePeriodMeta(response)
      offlineScheduleNotice.value = null
      return
    }

    if (generation !== scheduleLoadGeneration) {
      return
    }

    studentWeeklySchedules.value = {}
    applySchedulePeriodMeta(null)
  } catch {
    if (generation !== scheduleLoadGeneration) {
      return
    }

    if (!silent) {
      if (
        (scheduleType.value === 'students' || scheduleType.value === 'teachers')
        && applyOfflinePersonalSchedule(
          getOwnPersonalScheduleCache(authStore.currentUser, scheduleType.value, secondValue.value),
        )
      ) {
        return
      }

      studentWeeklySchedules.value = {}
      applySchedulePeriodMeta(null)
      offlineScheduleNotice.value = null

      if (scheduleType.value !== 'consults') {
        scheduleLoadError.value = 'Не удалось загрузить расписание'
      }
    }
  } finally {
    if (generation === scheduleLoadGeneration) {
      if (!silent) {
        isLoadingSchedule.value = false
      }
      hasLoadedScheduleOnce.value = true
    }
  }
}

async function loadConsultationTeachers() {
  if (scheduleType.value !== 'consults' || !firstValue.value) {
    consultationTeachers.value = []
    return
  }

  try {
    consultationTeachers.value = await fetchScheduleTeachers(Number(firstValue.value))
  } catch {
    consultationTeachers.value = []
  }
}

watch([scheduleType, firstValue, secondValue], () => {
  hasSyncedInitialWeek.value = false
  pendingWeekKeyToRestore.value = null
  selectedWeekKey.value = null
  currentWeekIndex.value = 0
  hasLoadedScheduleOnce.value = false
  offlineScheduleNotice.value = null
  void loadSchedule()
  void loadConsultationTeachers()
}, { immediate: true })

const consultationAcademicWeeks = computed(() => buildConsultationAcademicWeeks())

const weeklySchedules = computed(() => {
  if (scheduleType.value === 'consults' && firstValue.value) {
    const baseWeeks = Object.fromEntries(
      consultationAcademicWeeks.value.map((week) => [week.label, [] as DisplayScheduleItem[]]),
    ) as Record<string, DisplayScheduleItem[]>

    return {
      ...baseWeeks,
      ...studentWeeklySchedules.value,
    }
  }

  if (!secondValue.value) {
    return {}
  }

  return studentWeeklySchedules.value
})

const weekKeys = computed(() => {
  if (scheduleType.value === 'consults' && firstValue.value) {
    return consultationAcademicWeeks.value.map((week) => week.label)
  }

  return Object.keys(weeklySchedules.value)
})

const parseScheduleDate = (value: string | null | undefined): Date | null => {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
  }

  const dottedMatch = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (dottedMatch) {
    return new Date(Number(dottedMatch[3]), Number(dottedMatch[2]) - 1, Number(dottedMatch[1]))
  }

  return null
}

const getAcademicStartYearForSchedule = () => {
  const periodStart = parseScheduleDate(schedulePeriodMeta.value.periodStart)

  if (periodStart) {
    const month = periodStart.getMonth()
    const year = periodStart.getFullYear()

    return month >= 7 ? year : year - 1
  }

  const labelMatch = schedulePeriodMeta.value.academicYearLabel?.match(/^(\d{4})/)
  if (labelMatch) {
    return Number(labelMatch[1])
  }

  return getConsultationAcademicYearStart()
}

const resolveWeekStartDate = (key: string): Date | null => {
  const startPart = key.split(' - ')[0]?.trim()
  const parts = startPart?.split('.')
  const day = parts?.[0]
  const month = parts?.[1]

  if (!day || !month) {
    return null
  }

  const monthNumber = Number(month)
  const academicStartYear = getAcademicStartYearForSchedule()
  const year = monthNumber >= 8 ? academicStartYear : academicStartYear + 1

  return new Date(year, monthNumber - 1, Number(day))
}

const formatFullDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${day}.${month}.${date.getFullYear()}`
}

const formatShortDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${day}.${month}`
}

const parseWeekRange = (key: string) => {
  const start = resolveWeekStartDate(key) ?? new Date(0)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)

  return { start, end }
}

const isPastWeek = (weekKey: string): boolean => {
  const { end } = parseWeekRange(weekKey)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  return end < today
}

const getFirstAvailableTransferWeekKey = (): string => {
  const availableWeekKey = weekKeys.value.find((key) => !isPastWeek(key))

  return availableWeekKey ?? currentWeekKey.value
}

const syncWeekIndex = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (scheduleType.value === 'consults') {
    const initialIndex = consultationAcademicWeeks.value.findIndex((week) => {
      const start = new Date(week.start)
      const end = new Date(week.end)
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)

      return today >= start && today <= end
    })

    currentWeekIndex.value = initialIndex !== -1 ? initialIndex : 0
    return
  }

  const initialIndex = weekKeys.value.findIndex((key) => {
    const { start, end } = parseWeekRange(key)

    // Тоже обнуляем
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)

    return today >= start && today <= end
  })

  currentWeekIndex.value = initialIndex !== -1
      ? initialIndex
      : 0
}

const currentWeekKey = computed(() => weekKeys.value[currentWeekIndex.value] ?? '')
const weekLabel = computed(() => currentWeekKey.value)
const currentWeekStartDate = computed(() => resolveWeekStartDate(currentWeekKey.value))

const restoreWeekIndex = (weekKey: string | null): boolean => {
  if (!weekKey) {
    return false
  }

  const restoredIndex = weekKeys.value.indexOf(weekKey)

  if (restoredIndex === -1) {
    return false
  }

  currentWeekIndex.value = restoredIndex
  selectedWeekKey.value = weekKey
  return true
}

watch(currentWeekKey, (weekKey) => {
  if (weekKey && hasSyncedInitialWeek.value) {
    selectedWeekKey.value = weekKey
  }
})

watch(weekKeys, (keys) => {
  if (keys.length === 0) {
    if (!selectedWeekKey.value) {
      currentWeekIndex.value = 0
    }
    return
  }

  // При live-обновлении возвращаем пользователя на ту же неделю.
  const pendingWeekKey = pendingWeekKeyToRestore.value
  if (pendingWeekKey) {
    pendingWeekKeyToRestore.value = null
    if (restoreWeekIndex(pendingWeekKey)) {
      return
    }
  }

  if (selectedWeekKey.value && restoreWeekIndex(selectedWeekKey.value)) {
    return
  }

  if (!hasSyncedInitialWeek.value) {
    // Автовыбор текущей недели нужен только при первом открытии расписания.
    syncWeekIndex()
    hasSyncedInitialWeek.value = true
    if (currentWeekKey.value) {
      selectedWeekKey.value = currentWeekKey.value
    }
    return
  }

  if (currentWeekIndex.value >= keys.length) {
    currentWeekIndex.value = keys.length - 1
    if (currentWeekKey.value) {
      selectedWeekKey.value = currentWeekKey.value
    }
  }
}, { immediate: true })

const refreshSchedulePreservingView = async (weekKeyOverride?: string) => {
  // Обновляем данные в фоне, не сбрасываем выбранную неделю и прокрутку.
  const weekKeyToRestore = weekKeyOverride || selectedWeekKey.value || currentWeekKey.value
  const scrollX = window.scrollX
  const scrollY = window.scrollY

  if (weekKeyToRestore) {
    pendingWeekKeyToRestore.value = weekKeyToRestore
    selectedWeekKey.value = weekKeyToRestore
  }

  await loadSchedule({ silent: true })
  await nextTick()

  if (weekKeyToRestore) {
    restoreWeekIndex(weekKeyToRestore)
  }

  window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' })
}

const getDateForDayInWeek = (day: string, weekKey = currentWeekKey.value): Date | null => {
  const start = weekKey === currentWeekKey.value
    ? currentWeekStartDate.value
    : resolveWeekStartDate(weekKey)
  const offset = DAY_TO_OFFSET[day]

  if (!start || offset === undefined) {
    return null
  }

  const date = new Date(start)
  date.setDate(start.getDate() + offset)

  return date
}

const getDateForDay = (day: string): Date | null => getDateForDayInWeek(day)

const getDayDateLabelForWeek = (day: string, weekKey = currentWeekKey.value): string => {
  const date = getDateForDayInWeek(day, weekKey)

  return date ? formatShortDate(date) : ''
}

const getDayDateLabel = (day: string): string => getDayDateLabelForWeek(day)

const getHolidayNameForDayInWeek = (day: string, weekKey = currentWeekKey.value): string | null => {
  const date = getDateForDayInWeek(day, weekKey)

  if (!date) {
    return null
  }

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const dayOfMonth = String(date.getDate()).padStart(2, '0')

  return PUBLIC_HOLIDAYS[`${month}-${dayOfMonth}`] ?? null
}

const getHolidayNameForDay = (day: string): string | null => getHolidayNameForDayInWeek(day)

const isHolidayDayInWeek = (day: string, weekKey = currentWeekKey.value): boolean =>
  Boolean(getHolidayNameForDayInWeek(day, weekKey))

const isHolidayDay = (day: string): boolean => isHolidayDayInWeek(day)

const getPreholidayDayKey = (day: string, weekKey = currentWeekKey.value): string | null => {
  const date = getDateForDayInWeek(day, weekKey)

  if (!date) {
    return null
  }

  return formatFullDate(date)
}

const normalizePreholidayDayKeys = (values: string[]): string[] => {
  const normalizedKeys = values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => {
      const legacyParts = value.split('|')
      const legacyDate = legacyParts[3]

      if (legacyDate && /^\d{2}\.\d{2}\.\d{4}$/.test(legacyDate)) {
        return legacyDate
      }

      const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (isoMatch) {
        return `${isoMatch[3]}.${isoMatch[2]}.${isoMatch[1]}`
      }

      return value
    })
    .filter((value) => /^\d{2}\.\d{2}\.\d{4}$/.test(value))

  return Array.from(new Set(normalizedKeys))
}

const loadPreholidayDays = async () => {
  try {
    preholidayDayKeys.value = normalizePreholidayDayKeys(await fetchPreholidayDays())
  } catch {
    preholidayDayKeys.value = []
  }
}

const isPreholidayDay = (day: string, weekKey = currentWeekKey.value): boolean => {
  const key = getPreholidayDayKey(day, weekKey)

  return Boolean(key && preholidayDayKeys.value.includes(key))
}

const togglePreholidayDay = async (day: string) => {
  if (!canManagePairs.value || isSavingPreholidayDay.value) {
    return
  }

  const key = getPreholidayDayKey(day)

  if (!key) {
    return
  }

  const shouldMarkAsPreholiday = !preholidayDayKeys.value.includes(key)
  const dateLabel = getDayDateLabel(day)
  const dayLabel = dateLabel ? `${day} (${dateLabel})` : day

  const confirmed = await confirmDialog.confirm({
    message: shouldMarkAsPreholiday
      ? `Отметить ${dayLabel} как предпраздничный день? Пары в этот день будут по сокращённому расписанию.`
      : `Снять отметку «предпраздничный» с ${dayLabel}?`,
    confirmText: shouldMarkAsPreholiday ? 'Отметить' : 'Снять',
    variant: shouldMarkAsPreholiday ? 'default' : 'danger',
  })

  if (!confirmed) {
    return
  }

  const previousKeys = preholidayDayKeys.value

  preholidayDayKeys.value = shouldMarkAsPreholiday
    ? [...preholidayDayKeys.value, key]
    : preholidayDayKeys.value.filter((value) => value !== key)

  isSavingPreholidayDay.value = true

  try {
    preholidayDayKeys.value = normalizePreholidayDayKeys(
      await updatePreholidayDay(key, shouldMarkAsPreholiday),
    )
  } catch {
    preholidayDayKeys.value = previousKeys
    await confirmDialog.alert('Не удалось сохранить предпраздничный день')
  } finally {
    isSavingPreholidayDay.value = false
  }
}

const getDaySlot = (day: string, rowIndex: number): TimeSlot | null => {
  if (isPreholidayDay(day)) {
    return preholidayTimeSlots[rowIndex] ?? null
  }

  return weekdayTimeSlots[rowIndex] ?? null
}

const isEmptySchedule = computed(() => {
  if (scheduleType.value === 'consults' && firstValue.value) {
    return false
  }

  return !isLoadingSchedule.value && weekKeys.value.length === 0
})

const scheduleYearSuffix = computed(() =>
  formatSchedulePeriodSuffix(schedulePeriodMeta.value),
)

const pageTitle = computed(() => {
  if (scheduleType.value === 'students') {
    return `Расписание группы ${secondValue.value}${scheduleYearSuffix.value}`
  }

  if (scheduleType.value === 'teachers') {
    return `Расписание преподавателя ${secondValue.value}${scheduleYearSuffix.value}`
  }

  if (scheduleType.value === 'auditories') {
    return `Расписание аудитории ${secondValue.value}${scheduleYearSuffix.value}`
  }

  if (scheduleType.value === 'consults') {
    const startYear = getConsultationAcademicYearStart()
    return `Консультации кафедры ${departmentName.value} · ${startYear}/${String(startYear + 1).slice(-2)} (сентябрь — июль)`
  }

  return 'Расписание'
})

usePageTitle(pageTitle)

const openModal = async (lesson: CellLesson) => {
  let groups = resolveLessonGroups(lesson)

  if (
    canManagePairs.value
    && isMultiGroupLessonType(normalizeLessonTypeForForm(lesson.type))
  ) {
    try {
      groups = await fetchScheduleItemLinkedGroups(lesson.id)
    } catch {
      // keep groups from loaded schedule
    }
  }

  selectedLesson.value = {
    ...lesson,
    groups,
    group: groups.join(', '),
    linkedGroups: groups,
  }
  isRomanRoomHintOpen.value = false
}

const closeModal = () => {
  selectedLesson.value = null
  isRomanRoomHintOpen.value = false
}

const selectedRomanRoomHint = computed(() => {
  if (!selectedLesson.value) {
    return null
  }

  return getRomanRoomHint(selectedLesson.value.room)
})

const resolveDefaultTeacherName = (): string => {
  if (scheduleType.value === 'teachers') {
    return secondValue.value
  }

  return ''
}

const resolveDefaultRoomFields = (): { building: string; room: string } => {
  if (scheduleType.value === 'auditories') {
    const parsed = parseRoomForForm(secondValue.value)

    return {
      building: firstValue.value || parsed.building,
      room: parsed.room || secondValue.value,
    }
  }

  return { building: '', room: '' }
}

const buildEmptyEditForm = () => {
  const roomFields = resolveDefaultRoomFields()

  return {
    name: '',
    type: scheduleType.value === 'consults' ? 'Консультация' : '',
    group: scheduleType.value === 'students' ? secondValue.value : '',
    teacher: resolveDefaultTeacherName(),
    building: roomFields.building,
    room: roomFields.room,
    day: emptyCellData.value?.day ?? 'ПН',
    time: emptyCellData.value
      ? `${emptyCellData.value.time} - ${emptyCellData.value.endTime ?? PAIR_END_TIMES[emptyCellData.value.time] ?? ''}`.trim()
      : '',
    subgroup: '' as '' | '1' | '2',
    additional: '',
  }
}

const openEditModalForLesson = async (lesson: CellLesson) => {
  isCreatingLesson.value = false
  editingLesson.value = lesson
  emptyCellData.value = null
  const parsedRoom = parseRoomForForm(lesson.room, scheduleType.value === 'consults')
  const displaySlot = findDisplaySlotForLesson(lesson)
  const roomFields = scheduleType.value === 'auditories'
    ? {
      building: firstValue.value || parsedRoom.building,
      room: parsedRoom.room || lesson.room,
    }
    : parsedRoom

  editSlotContext.value = {
    weekLabel: currentWeekKey.value,
    weekStart: lesson.weekStart ?? resolveWeekStartForSave(),
    day: lesson.day,
  }

  let groupNames = resolveLessonGroups(lesson)

  if (
    canManagePairs.value
    && isMultiGroupLessonType(normalizeLessonTypeForForm(lesson.type))
  ) {
    try {
      groupNames = await fetchScheduleItemLinkedGroups(lesson.id)
    } catch {
      // keep groups from loaded schedule
    }
  }

  editForm.value = {
    name: lesson.subject,
    type: normalizeLessonTypeForForm(lesson.type),
    group: groupNames.join(', '),
    teacher: lesson.teacher || resolveDefaultTeacherName(),
    building: roomFields.building,
    room: roomFields.room,
    day: lesson.day,
    time: displaySlot
        ? formatTimeSlotValue(displaySlot)
        : `${lesson.startTime} - ${lesson.endTime}`,
    subgroup: lesson.subgroup
        ? String(lesson.subgroup) as '1' | '2'
        : '',
    additional: lesson.comment ?? '',
  }

  if (isConsultationSchedule.value && editForm.value.teacher.trim()) {
    const teacherName = editForm.value.teacher.trim()

    if (!consultationTeachers.value.includes(teacherName)) {
      consultationTeachers.value = [...consultationTeachers.value, teacherName]
    }
  }

  if (
    isConsultationSchedule.value
    && isConsultationDistanceBuilding(editForm.value.building)
    && !editForm.value.type.toLowerCase().includes('онлайн')
  ) {
    editForm.value.type = 'Онлайн-консультация'
  }

  isEditModalVisible.value = true
}

const openEditModal = () => {
  if (!selectedLesson.value) return

  const lesson = selectedLesson.value
  selectedLesson.value = null
  openEditModalForLesson(lesson)
}

const closeEditModal = () => {
  isEditModalVisible.value = false
  editingLesson.value = null
  isCreatingLesson.value = false
  emptyCellData.value = null
  editSlotContext.value = null
  isLoadingEditPreview.value = false
  editPreviewError.value = null
  editPreviewConflicts.value = []
  editPreviewRecommendations.value = []

  if (editPreviewTimer) {
    clearTimeout(editPreviewTimer)
    editPreviewTimer = null
  }
}

const formatTimeSlotValue = (slot: TimeSlot): string => `${slot.startTime} - ${slot.endTime}`

const getTimeSlotsForDay = (day: string, weekKey = currentWeekKey.value): TimeSlot[] => {
  if (isPreholidayDay(day, weekKey)) {
    return preholidayTimeSlots
  }

  return day === saturdayDay
    ? saturdayTimeSlots
    : weekdayTimeSlots
}

const transferTimeSlots = computed(() =>
  getTimeSlotsForDay(transferForm.value.day, transferForm.value.weekKey || currentWeekKey.value),
)

const editTimeSlots = computed(() => getTimeSlotsForDay(editForm.value.day))

const findDisplaySlotForLesson = (lesson: CellLesson): TimeSlot | null => {
  return getTimeSlotsForDay(lesson.day).find((slot) =>
    (slot.matchingStartTimes ?? [slot.startTime]).includes(lesson.startTime),
  ) ?? null
}

const visibleTransferRecommendations = computed(() =>
  transferRecommendations.value.filter((recommendation) =>
    getTimeSlotsForDay(recommendation.day, transferForm.value.weekKey).some((slot) =>
      slot.startTime === recommendation.startTime && slot.endTime === recommendation.endTime,
    ),
  ),
)

const visibleEditPreviewRecommendations = computed(() =>
  editPreviewRecommendations.value.filter((recommendation) =>
    editTimeSlots.value.some((slot) =>
      slot.startTime === recommendation.startTime && slot.endTime === recommendation.endTime,
    ),
  ),
)

const visibleTransferPreviewRecommendations = computed(() =>
  transferPreviewRecommendations.value.filter((recommendation) =>
    transferTimeSlots.value.some((slot) =>
      slot.startTime === recommendation.startTime && slot.endTime === recommendation.endTime,
    ),
  ),
)

const hasEditPreviewConflicts = computed(() => editPreviewConflicts.value.length > 0)
const hasTransferPreviewConflicts = computed(() => transferPreviewConflicts.value.length > 0)

const buildEditPreviewPayload = () => {
  const timeParts = editForm.value.time.split('-').map((part) => part.trim())
  const startTime = timeParts[0] ?? ''
  const endTime = timeParts[1] ?? ''
  const weekStart = resolveWeekStartForSave()
  const dayOfWeek = DAY_TO_NUMBER[editForm.value.day]
  const room = formatRoomForApi(editForm.value.building, editForm.value.room)
  const subgroupValue = showSubgroupField.value && editForm.value.subgroup
    ? Number(editForm.value.subgroup)
    : null

  if (
    !editingLesson.value
    || !weekStart
    || !dayOfWeek
    || !startTime
    || !endTime
    || !editForm.value.name.trim()
    || !editForm.value.type.trim()
  ) {
    return null
  }

  return {
    subject: editForm.value.name.trim(),
    lessonType: editForm.value.type.trim(),
    teacherName: editForm.value.teacher.trim() || undefined,
    room,
    dayOfWeek,
    startTime,
    endTime,
    weekStart,
    subgroup: subgroupValue,
  }
}

const resetEditPreviewState = () => {
  isLoadingEditPreview.value = false
  editPreviewError.value = null
  editPreviewConflicts.value = []
  editPreviewRecommendations.value = []
}

const getTransferWeekStartValue = (weekKey: string, fallbackWeekStart: string | null = null): string | null => {
  const transferWeekStart = resolveWeekStartDate(weekKey)

  return transferWeekStart
    ? formatFullDate(transferWeekStart)
    : fallbackWeekStart ?? resolveWeekStartForSave()
}

const buildTransferPreviewPayloadForTarget = (
  lesson: CellLesson,
  target: TransferTarget,
  room: string | null,
): ScheduleItemPreviewPayload | null => {
  const dayOfWeek = DAY_TO_NUMBER[target.day]
  const weekStart = getTransferWeekStartValue(target.weekKey, lesson.weekStart ?? null)

  if (
    !dayOfWeek
    || !target.startTime
    || !target.endTime
    || !weekStart
    || isHolidayDayInWeek(target.day, target.weekKey)
    || isPastWeek(target.weekKey)
  ) {
    return null
  }

  return {
    dayOfWeek,
    startTime: target.startTime,
    endTime: target.endTime,
    weekStart,
    room: room ?? undefined,
  }
}

const buildTransferPreviewPayload = (): ScheduleItemPreviewPayload | null => {
  const lesson = transferringLesson.value

  if (!lesson) {
    return null
  }

  const timeParts = transferForm.value.time.split('-').map((part) => part.trim())
  const target: TransferTarget = {
    weekKey: transferForm.value.weekKey,
    day: transferForm.value.day,
    startTime: timeParts[0] ?? '',
    endTime: timeParts[1] ?? '',
    room: transferForm.value.room.trim() || null,
  }

  return buildTransferPreviewPayloadForTarget(lesson, target, formatRoomForApi(
    transferForm.value.building,
    transferForm.value.room,
  ) ?? null)
}

const resetTransferPreviewState = () => {
  isLoadingTransferPreview.value = false
  transferPreviewError.value = null
  transferPreviewConflicts.value = []
  transferPreviewRecommendations.value = []
}

const getTransferFormSignature = () => JSON.stringify(transferForm.value)

const loadTransferPreview = async () => {
  const lesson = transferringLesson.value

  if (!lesson || !isTransferModalVisible.value) {
    resetTransferPreviewState()
    initialTransferFormSignature.value = ''
    return
  }

  const payload = buildTransferPreviewPayload()

  if (!payload) {
    resetTransferPreviewState()
    return
  }

  const generation = ++transferPreviewGeneration
  isLoadingTransferPreview.value = true
  transferPreviewError.value = null

  try {
    const preview = await previewScheduleItemChanges(lesson.id, payload)

    if (
      generation !== transferPreviewGeneration
      || !isTransferModalVisible.value
      || transferringLesson.value?.id !== lesson.id
    ) {
      return
    }

    transferPreviewConflicts.value = preview.conflicts
    transferPreviewRecommendations.value = preview.recommendations
  } catch {
    if (
      generation === transferPreviewGeneration
      && isTransferModalVisible.value
      && transferringLesson.value?.id === lesson.id
    ) {
      transferPreviewConflicts.value = []
      transferPreviewRecommendations.value = []
      transferPreviewError.value = 'Не удалось проверить конфликты'
    }
  } finally {
    if (
      generation === transferPreviewGeneration
      && isTransferModalVisible.value
      && transferringLesson.value?.id === lesson.id
    ) {
      isLoadingTransferPreview.value = false
    }
  }
}

const scheduleTransferPreviewSoon = () => {
  if (transferPreviewTimer) {
    clearTimeout(transferPreviewTimer)
  }

  transferPreviewTimer = setTimeout(() => {
    transferPreviewTimer = null
    void loadTransferPreview()
  }, 350)
}

const resetTransferDragState = () => {
  transferDragPreviewGeneration += 1
  draggedTransferLesson.value = null
  transferDragTarget.value = null
  isLoadingTransferDragPreview.value = false
  transferDragPreviewError.value = null
  transferDragPreviewConflicts.value = []
  transferDragPreviewStatus.value = 'idle'

  if (transferDragPreviewTimer) {
    clearTimeout(transferDragPreviewTimer)
    transferDragPreviewTimer = null
  }
}

const loadTransferDragPreview = async () => {
  const lesson = draggedTransferLesson.value
  const target = transferDragTarget.value

  if (!lesson || !target) {
    resetTransferDragState()
    return
  }

  const payload = buildTransferPreviewPayloadForTarget(lesson, target, lesson.room?.trim() || null)

  if (!payload) {
    transferDragPreviewStatus.value = 'invalid'
    transferDragPreviewConflicts.value = []
    transferDragPreviewError.value = null
    isLoadingTransferDragPreview.value = false
    return
  }

  if (isTransferDragSourceSlot(lesson, target)) {
    transferDragPreviewConflicts.value = []
    transferDragPreviewError.value = null
    transferDragPreviewStatus.value = 'valid'
    isLoadingTransferDragPreview.value = false
    return
  }

  const generation = ++transferDragPreviewGeneration
  isLoadingTransferDragPreview.value = true
  transferDragPreviewError.value = null
  transferDragPreviewStatus.value = 'loading'

  try {
    const preview = await previewScheduleItemChanges(lesson.id, payload)

    if (
      generation !== transferDragPreviewGeneration
      || draggedTransferLesson.value?.id !== lesson.id
      || !isSameTransferTarget(transferDragTarget.value, target)
    ) {
      return
    }

    transferDragPreviewConflicts.value = preview.conflicts
    transferDragPreviewStatus.value = preview.conflicts.length > 0 ? 'invalid' : 'valid'
  } catch {
    if (
      generation === transferDragPreviewGeneration
      && draggedTransferLesson.value?.id === lesson.id
      && isSameTransferTarget(transferDragTarget.value, target)
    ) {
      transferDragPreviewConflicts.value = []
      transferDragPreviewError.value = 'Не удалось проверить перенос'
      transferDragPreviewStatus.value = 'error'
    }
  } finally {
    if (
      generation === transferDragPreviewGeneration
      && draggedTransferLesson.value?.id === lesson.id
      && isSameTransferTarget(transferDragTarget.value, target)
    ) {
      isLoadingTransferDragPreview.value = false
    }
  }
}

const scheduleTransferDragPreviewSoon = () => {
  if (transferDragPreviewTimer) {
    clearTimeout(transferDragPreviewTimer)
  }

  transferDragPreviewTimer = setTimeout(() => {
    transferDragPreviewTimer = null
    void loadTransferDragPreview()
  }, 120)
}

const loadEditPreview = async () => {
  const lesson = editingLesson.value

  if (
    !lesson
    || !isEditModalVisible.value
    || isCreatingLesson.value
    || isConsultationSchedule.value
    || !canManagePairs.value
  ) {
    resetEditPreviewState()
    return
  }

  const payload = buildEditPreviewPayload()

  if (!payload) {
    resetEditPreviewState()
    return
  }

  const generation = ++editPreviewGeneration
  isLoadingEditPreview.value = true
  editPreviewError.value = null

  try {
    const preview = await previewScheduleItemChanges(lesson.id, payload)

    if (
      generation !== editPreviewGeneration
      || !isEditModalVisible.value
      || editingLesson.value?.id !== lesson.id
    ) {
      return
    }

    editPreviewConflicts.value = preview.conflicts
    editPreviewRecommendations.value = preview.recommendations
  } catch {
    if (
      generation === editPreviewGeneration
      && isEditModalVisible.value
      && editingLesson.value?.id === lesson.id
    ) {
      editPreviewConflicts.value = []
      editPreviewRecommendations.value = []
      editPreviewError.value = 'Не удалось проверить конфликты'
    }
  } finally {
    if (
      generation === editPreviewGeneration
      && isEditModalVisible.value
      && editingLesson.value?.id === lesson.id
    ) {
      isLoadingEditPreview.value = false
    }
  }
}

const scheduleEditPreviewSoon = () => {
  if (editPreviewTimer) {
    clearTimeout(editPreviewTimer)
  }

  editPreviewTimer = setTimeout(() => {
    editPreviewTimer = null
    void loadEditPreview()
  }, 350)
}

const applyEditPreviewRecommendation = (recommendation: ScheduleTransferRecommendation) => {
  editForm.value.day = recommendation.day
  editForm.value.time = `${recommendation.startTime} - ${recommendation.endTime}`
}

const resolveTransferWeekStartForRecommendations = (): string | null => {
  const transferWeekStart = resolveWeekStartDate(transferForm.value.weekKey)

  return transferWeekStart
    ? formatFullDate(transferWeekStart)
    : transferringLesson.value?.weekStart ?? resolveWeekStartForSave()
}

const loadTransferRecommendations = async () => {
  const lesson = transferringLesson.value
  if (!lesson || !isTransferModalVisible.value) {
    transferRecommendations.value = []
    return
  }

  const weekStart = resolveTransferWeekStartForRecommendations()
  isLoadingTransferRecommendations.value = true
  transferRecommendationError.value = null

  try {
    const recommendations = await fetchScheduleTransferRecommendations(lesson.id, weekStart)
    if (transferringLesson.value?.id === lesson.id && isTransferModalVisible.value) {
      transferRecommendations.value = recommendations
    }
  } catch {
    if (transferringLesson.value?.id === lesson.id && isTransferModalVisible.value) {
      transferRecommendations.value = []
      transferRecommendationError.value = 'Не удалось загрузить рекомендации'
    }
  } finally {
    if (transferringLesson.value?.id === lesson.id && isTransferModalVisible.value) {
      isLoadingTransferRecommendations.value = false
    }
  }
}

const applyTransferRecommendation = (recommendation: ScheduleTransferRecommendation) => {
  transferForm.value.day = recommendation.day
  transferForm.value.time = `${recommendation.startTime} - ${recommendation.endTime}`
}

watch(
  () => [transferForm.value.weekKey, transferForm.value.day],
  () => {
    if (!isTransferModalVisible.value) {
      return
    }

    const weekKey = transferForm.value.weekKey || currentWeekKey.value

    if (isHolidayDayInWeek(transferForm.value.day, weekKey)) {
      const firstAvailableDay = days.find((day) => !isHolidayDayInWeek(day, weekKey))
      if (firstAvailableDay) {
        transferForm.value.day = firstAvailableDay
        return
      }
    }

    const isSelectedTimeAvailable = transferTimeSlots.value.some(
      (slot) => formatTimeSlotValue(slot) === transferForm.value.time,
    )

    if (!isSelectedTimeAvailable) {
      const firstSlot = transferTimeSlots.value[0]
      if (firstSlot) {
        transferForm.value.time = formatTimeSlotValue(firstSlot)
      }
    }
  },
)

watch(
  () => [isTransferModalVisible.value, transferringLesson.value?.id, transferForm.value.weekKey],
  () => {
    if (!isTransferModalVisible.value || !transferringLesson.value) {
      transferRecommendations.value = []
      transferRecommendationError.value = null
      return
    }

    void loadTransferRecommendations()
  },
)

watch(
  () => [
    isTransferModalVisible.value,
    transferringLesson.value?.id,
    transferForm.value.weekKey,
    transferForm.value.day,
    transferForm.value.time,
    transferForm.value.building,
    transferForm.value.room,
  ],
  () => {
    if (!isTransferModalVisible.value || !transferringLesson.value) {
      resetTransferPreviewState()
      return
    }

    if (getTransferFormSignature() === initialTransferFormSignature.value) {
      resetTransferPreviewState()
      return
    }

    scheduleTransferPreviewSoon()
  },
)

watch(
  () => [
    isEditModalVisible.value,
    editingLesson.value?.id,
    isCreatingLesson.value,
    editForm.value.day,
    editForm.value.time,
    editForm.value.building,
    editForm.value.room,
    editForm.value.teacher,
    editForm.value.subgroup,
    editForm.value.name,
    editForm.value.type,
  ],
  () => {
    if (!isEditModalVisible.value || isCreatingLesson.value || !editingLesson.value) {
      resetEditPreviewState()
      return
    }

    scheduleEditPreviewSoon()
  },
)

const openTransferModalForLesson = (lesson: CellLesson) => {
  const displaySlot = findDisplaySlotForLesson(lesson)
  const parsedRoom = parseRoomForForm(lesson.room)
  const roomFields = scheduleType.value === 'auditories'
    ? {
      building: firstValue.value || parsedRoom.building,
      room: parsedRoom.room || lesson.room,
    }
    : parsedRoom

  transferringLesson.value = lesson
  const initialWeekKey = isPastWeek(currentWeekKey.value)
    ? getFirstAvailableTransferWeekKey()
    : currentWeekKey.value
  transferForm.value = {
    weekKey: initialWeekKey,
    day: lesson.day,
    time: displaySlot
      ? formatTimeSlotValue(displaySlot)
      : `${lesson.startTime} - ${lesson.endTime}`,
    building: roomFields.building,
    room: roomFields.room,
  }
  initialTransferFormSignature.value = getTransferFormSignature()
  isTransferModalVisible.value = true
}

const closeTransferModal = () => {
  isTransferModalVisible.value = false
  transferringLesson.value = null
  isTransferSaving.value = false
  isLoadingTransferRecommendations.value = false
  transferRecommendationError.value = null
  transferRecommendations.value = []
  resetTransferPreviewState()

  if (transferPreviewTimer) {
    clearTimeout(transferPreviewTimer)
    transferPreviewTimer = null
  }

  resetTransferDragState()
}

const saveTransferToTarget = async (
  lesson: CellLesson,
  target: TransferTarget,
  room: string | null,
): Promise<boolean> => {
  const dayOfWeek = DAY_TO_NUMBER[target.day]
  const weekStart = getTransferWeekStartValue(target.weekKey, lesson.weekStart ?? null)

  if (
    !dayOfWeek
    || !target.startTime
    || !target.endTime
    || !weekStart
    || isHolidayDayInWeek(target.day, target.weekKey)
    || isPastWeek(target.weekKey)
  ) {
    await confirmDialog.alert('Выберите день и время для переноса')
    return false
  }

  if (isHolidayDayInWeek(target.day, target.weekKey)) {
    await confirmDialog.alert('Нельзя перенести пару на праздничный день')
    return false
  }

  if (isPastWeek(target.weekKey)) {
    await confirmDialog.alert('Нельзя перенести пару на прошедшую неделю')
    return false
  }

  isTransferSaving.value = true

  try {
    await updateScheduleItem(lesson.id, {
      dayOfWeek,
      startTime: target.startTime,
      endTime: target.endTime,
      weekStart,
      room: room ?? undefined,
    })
    await refreshSchedulePreservingView(target.weekKey)
    return true
  } catch (error) {
    await showScheduleAdminError(error)
    return false
  } finally {
    isTransferSaving.value = false
  }
}

const saveTransfer = async () => {
  if (!transferringLesson.value) {
    return
  }

  const timeParts = transferForm.value.time.split('-').map((part) => part.trim())
  const target: TransferTarget = {
    weekKey: transferForm.value.weekKey,
    day: transferForm.value.day,
    startTime: timeParts[0] ?? '',
    endTime: timeParts[1] ?? '',
    room: transferForm.value.room.trim() || null,
  }

  if (hasTransferPreviewConflicts.value) {
    await confirmDialog.alert({
      title: 'Конфликт в расписании',
      message: 'Невозможно перенести пару с текущими параметрами.',
      details: transferPreviewConflicts.value,
    })
    return
  }

  const saved = await saveTransferToTarget(
    transferringLesson.value,
    target,
    formatRoomForApi(transferForm.value.building, transferForm.value.room) ?? null,
  )
  if (saved) {
    closeTransferModal()
  }
}

const getTransferDragTargetKey = (day: string, slot: TimeSlot) =>
  `${day}|${slot.startTime}|${slot.endTime}`

const getTransferTargetKey = (target: TransferTarget) =>
  `${target.day}|${target.startTime}|${target.endTime}`

const isSameTransferTarget = (first: TransferTarget | null, second: TransferTarget) =>
  first !== null && getTransferTargetKey(first) === getTransferTargetKey(second)

const getTransferDragTarget = (day: string, slot: TimeSlot): TransferTarget => ({
  weekKey: currentWeekKey.value,
  day,
  startTime: slot.startTime,
  endTime: slot.endTime,
  room: draggedTransferLesson.value?.room?.trim() || null,
})

const isTransferDragSourceSlot = (lesson: CellLesson, target: TransferTarget): boolean => {
  const dayOfWeek = DAY_TO_NUMBER[target.day]
  const weekStart = getTransferWeekStartValue(target.weekKey, lesson.weekStart ?? null)

  return dayOfWeek === DAY_TO_NUMBER[lesson.day]
    && target.startTime === lesson.startTime
    && target.endTime === lesson.endTime
    && weekStart === lesson.weekStart
}

const isTransferDropTarget = (day: string, slot: TimeSlot) =>
  transferDragTarget.value !== null
  && transferDragTarget.value.day === day
  && transferDragTarget.value.startTime === slot.startTime
  && transferDragTarget.value.endTime === slot.endTime

const getTransferDropCellClass = (day: string, slot: TimeSlot) => {
  const active = isTransferDropTarget(day, slot)

  return {
    'cell--transfer-drop-target': active,
    'cell--transfer-drop-valid': active && transferDragPreviewStatus.value === 'valid',
    'cell--transfer-drop-invalid': active && ['invalid', 'error'].includes(transferDragPreviewStatus.value),
    'cell--transfer-drop-loading': active && transferDragPreviewStatus.value === 'loading',
  }
}

const updateTransferDragTarget = (day: string, slot: TimeSlot) => {
  const lesson = draggedTransferLesson.value

  if (!lesson) {
    return
  }

  const target = getTransferDragTarget(day, slot)
  const nextTargetKey = getTransferDragTargetKey(day, slot)
  const currentTargetKey = transferDragTarget.value
    ? getTransferTargetKey(transferDragTarget.value)
    : null

  if (currentTargetKey === nextTargetKey) {
    return
  }

  transferDragTarget.value = target
  transferDragPreviewStatus.value = 'loading'
  transferDragPreviewError.value = null
  transferDragPreviewConflicts.value = []
  scheduleTransferDragPreviewSoon()
}

const handleTransferLessonDragStart = (lesson: CellLesson, event: DragEvent) => {
  if (!canManagePairs.value || !event.dataTransfer) {
    return
  }

  draggedTransferLesson.value = lesson
  transferDragTarget.value = null
  transferDragPreviewStatus.value = 'idle'
  transferDragPreviewError.value = null
  transferDragPreviewConflicts.value = []
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', String(lesson.id))
}

const handleTransferLessonDragEnd = () => {
  if (transferDropInProgress.value) {
    return
  }

  resetTransferDragState()
}

const handleTransferCellDragOver = (day: string, slot: TimeSlot, event: DragEvent) => {
  if (!draggedTransferLesson.value) {
    return
  }

  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = transferDragPreviewStatus.value === 'invalid'
      ? 'none'
      : 'move'
  }

  updateTransferDragTarget(day, slot)
}

const handleTransferCellDragEnter = (day: string, slot: TimeSlot, event: DragEvent) => {
  if (!draggedTransferLesson.value) {
    return
  }

  event.preventDefault()
  updateTransferDragTarget(day, slot)
}

const handleTransferCellDrop = async (day: string, slot: TimeSlot, event: DragEvent) => {
  const lesson = draggedTransferLesson.value

  if (!lesson) {
    return
  }

  transferDropInProgress.value = true
  event.preventDefault()
  event.stopPropagation()
  const dragGeneration = ++transferDragPreviewGeneration
  const target = getTransferDragTarget(day, slot)

  if (isTransferDragSourceSlot(lesson, target)) {
    transferDropInProgress.value = false
    resetTransferDragState()
    return
  }

  transferDragTarget.value = target

  if (transferDragPreviewTimer) {
    clearTimeout(transferDragPreviewTimer)
    transferDragPreviewTimer = null
  }

  const payload = buildTransferPreviewPayloadForTarget(
    lesson,
    target,
    lesson.room?.trim() || null,
  )

  if (!payload) {
    if (
      dragGeneration === transferDragPreviewGeneration
      && draggedTransferLesson.value?.id === lesson.id
    ) {
      await confirmDialog.alert({
        title: 'Конфликт в расписании',
        message: 'Нельзя перенести пару в эту ячейку.',
      })
    }
    transferDropInProgress.value = false
    resetTransferDragState()
    return
  }

  try {
    const preview = await previewScheduleItemChanges(lesson.id, payload)

    if (
      dragGeneration !== transferDragPreviewGeneration
      || draggedTransferLesson.value?.id !== lesson.id
      || !isSameTransferTarget(transferDragTarget.value, target)
    ) {
      transferDropInProgress.value = false
      resetTransferDragState()
      return
    }

    if (preview.conflicts.length > 0) {
      transferDragPreviewConflicts.value = preview.conflicts
      transferDragPreviewStatus.value = 'invalid'
      await confirmDialog.alert({
        title: 'Конфликт в расписании',
        message: 'Нельзя перенести пару в эту ячейку.',
        details: preview.conflicts,
      })
      transferDropInProgress.value = false
      resetTransferDragState()
      return
    }
  } catch {
    if (
      dragGeneration !== transferDragPreviewGeneration
      || draggedTransferLesson.value?.id !== lesson.id
      || !isSameTransferTarget(transferDragTarget.value, target)
    ) {
      transferDropInProgress.value = false
      resetTransferDragState()
      return
    }

    transferDragPreviewStatus.value = 'error'
    transferDragPreviewError.value = 'Не удалось проверить перенос'
    await confirmDialog.alert({
      title: 'Ошибка',
      message: 'Не удалось проверить перенос',
    })
    transferDropInProgress.value = false
    resetTransferDragState()
    return
  }

  if (
    dragGeneration !== transferDragPreviewGeneration
    || draggedTransferLesson.value?.id !== lesson.id
    || !isSameTransferTarget(transferDragTarget.value, target)
  ) {
    transferDropInProgress.value = false
    resetTransferDragState()
    return
  }

  const isConfirmed = await confirmDialog.confirm({
    title: 'Подтверждение переноса',
    message: `Перенести пару «${lesson.subject}» на ${target.day}, ${target.startTime}–${target.endTime}?`,
    confirmText: 'Перенести',
    cancelText: 'Отмена',
  })

  if (!isConfirmed) {
    transferDropInProgress.value = false
    resetTransferDragState()
    return
  }

  if (
    dragGeneration !== transferDragPreviewGeneration
    || draggedTransferLesson.value?.id !== lesson.id
    || !isSameTransferTarget(transferDragTarget.value, target)
  ) {
    transferDropInProgress.value = false
    resetTransferDragState()
    return
  }

  await saveTransferToTarget(
    lesson,
    target,
    lesson.room?.trim() || null,
  )
  transferDropInProgress.value = false
  resetTransferDragState()
}

const resolveScheduleGroupNames = (): string[] => {
  if (editForm.value.group.trim()) {
    const parsedGroups = parseGroupNames(editForm.value.group)

    if (scheduleType.value === 'students') {
      if (isMultiGroupLessonType(editForm.value.type)) {
        return parsedGroups
      }

      return secondValue.value ? [secondValue.value] : []
    }

    return parsedGroups
  }

  if (scheduleType.value === 'students') {
    return secondValue.value ? [secondValue.value] : []
  }

  if (editingLesson.value?.groups.length) {
    return [...editingLesson.value.groups]
  }

  const singleGroup = editingLesson.value?.group?.trim()

  return singleGroup ? [singleGroup] : []
}

const groupFieldPlaceholder = computed(() => {
  if (isMultiGroupLessonType(editForm.value.type)) {
    return '381, 382'
  }

  return '381'
})

const resolveWeekStartForSave = (): string | null => {
  if (editSlotContext.value?.weekStart) {
    return editSlotContext.value.weekStart
  }

  if (editingLesson.value?.weekStart) {
    return editingLesson.value.weekStart
  }

  if (currentWeekStartDate.value) {
    return formatFullDate(currentWeekStartDate.value)
  }

  const lessons = weeklySchedules.value[currentWeekKey.value] ?? []
  const lessonWithWeek = lessons.find((lesson) => lesson.weekStart)

  if (lessonWithWeek?.weekStart) {
    return lessonWithWeek.weekStart
  }

  return getWeekStartFromLabel(currentWeekKey.value)
}

const saveEdit = async () => {
  if (scheduleType.value !== 'consults') {
    const groupNames = resolveScheduleGroupNames()
    const timeParts = editForm.value.time.split('-').map((part) => part.trim())
    const startTime = timeParts[0] ?? ''
    const endTime = timeParts[1] ?? ''
    const weekStart = resolveWeekStartForSave()
    const dayOfWeek = DAY_TO_NUMBER[
      editForm.value.day
      || emptyCellData.value?.day
      || editingLesson.value?.day
      || ''
    ]

    if (
        groupNames.length === 0
        || !weekStart
        || !dayOfWeek
        || !startTime
        || !endTime
        || !editForm.value.name.trim()
        || !editForm.value.type.trim()
    ) {
      await confirmDialog.alert('Заполните все обязательные поля: название, тип, день, время, группа')
      return
    }

    if (groupNames.length > 1 && !isMultiGroupLessonType(editForm.value.type)) {
      await confirmDialog.alert('Несколько групп можно указать только для лекций и занятий типа «Особое»')
      return
    }

    if (isCreatingLesson.value && isHolidayDay(editForm.value.day)) {
      await confirmDialog.alert('В праздничный день нельзя добавить пару')
      return
    }

    const room = formatRoomForApi(editForm.value.building, editForm.value.room)
    const subgroupValue = showSubgroupField.value && editForm.value.subgroup
      ? Number(editForm.value.subgroup)
      : undefined

    const payload = {
      subject: editForm.value.name.trim(),
      lessonType: editForm.value.type.trim(),
      teacherName: editForm.value.teacher.trim() || undefined,
      room,
      dayOfWeek,
      startTime,
      endTime,
      weekStart,
      subgroup: subgroupValue,
      comment: editForm.value.additional.trim() || undefined,
    }

    isSaving.value = true

    try {
      if (isCreatingLesson.value) {
        await createScheduleItem({
          groupName: groupNames.join(', '),
          ...payload,
        })
      } else if (editingLesson.value) {
        await updateScheduleItem(editingLesson.value.id, {
          ...payload,
          subgroup: showSubgroupField.value && editForm.value.subgroup
              ? Number(editForm.value.subgroup)
              : null,
        })

        if (isMultiGroupLessonType(editForm.value.type)) {
          const previousGroups = new Set(
            editingLesson.value.groups.map((group) => group.trim().toUpperCase()),
          )
          const addedGroups = groupNames.filter(
            (group) => !previousGroups.has(group.trim().toUpperCase()),
          )

          for (const groupName of addedGroups) {
            await createScheduleItem({
              groupName,
              ...payload,
            })
          }
        }
      }

      await refreshSchedulePreservingView()
      closeEditModal()
    } catch (error) {
      await showScheduleAdminError(error)
    } finally {
      isSaving.value = false
    }

    return
  }

  const departmentId = Number(firstValue.value)
  if (!departmentId) {
    await confirmDialog.alert('Не удалось определить кафедру')
    return
  }

  const timeParts = editForm.value.time.split('-').map((part) => part.trim())
  const startTime = timeParts[0] ?? ''
  const endTime = timeParts[1] ?? ''
  const weekStart = getWeekStartFromLabel(currentWeekKey.value)
  const dayOfWeek = emptyCellData.value
    ? DAY_TO_NUMBER[emptyCellData.value.day]
    : editingLesson.value
      ? DAY_TO_NUMBER[editingLesson.value.day]
      : undefined

  if (!weekStart || !dayOfWeek || !startTime || !endTime) {
    await confirmDialog.alert('Заполните все обязательные поля')
    return
  }

  if (!editForm.value.teacher.trim()) {
    await confirmDialog.alert('Выберите преподавателя')
    return
  }

  const consultationType = editForm.value.type.includes('Онлайн')
    ? 'Онлайн-консультация'
    : 'Консультация'
  const room = editForm.value.type.includes('Онлайн')
    ? DISTANCE_ROOM_LABEL
    : formatRoomForApi(editForm.value.building, editForm.value.room)
  const comment = editForm.value.additional.trim() || undefined

  try {
    if (isCreatingLesson.value) {
      await createConsultation({
        departmentId,
        subject: editForm.value.name.trim(),
        teacherName: editForm.value.teacher.trim(),
        consultationType,
        dayOfWeek,
        startTime,
        endTime,
        weekStart,
        room,
        comment,
      })
    } else if (editingLesson.value) {
      await updateConsultation(editingLesson.value.id, {
        subject: editForm.value.name.trim(),
        teacherName: editForm.value.teacher.trim(),
        consultationType,
        dayOfWeek,
        startTime,
        endTime,
        weekStart,
        room,
        comment,
      })
    }

    await refreshSchedulePreservingView()
    closeEditModal()
  } catch {
    await confirmDialog.alert('Не удалось сохранить консультацию')
  }
}

const showContextMenu = (event: MouseEvent, lesson: CellLesson) => {
  if (!canEdit.value) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  emptyCellData.value = null

  menuX.value = event.clientX
  menuY.value = event.clientY

  contextLesson.value = lesson
  isMenuVisible.value = true
}

const closeMenu = (event?: MouseEvent) => {
  const target = event?.target as HTMLElement

  if (target?.closest('.context-menu')) {
    return
  }

  isMenuVisible.value = false
}

const openLessonMenu = (lesson: CellLesson) => {
  if (!canEdit.value) {
    return
  }

  contextLesson.value = lesson
  emptyCellData.value = null
  isMenuVisible.value = true
}

const handleLessonTap = (lesson: CellLesson, event: MouseEvent) => {
  if (draggedTransferLesson.value) {
    event.stopPropagation()
    return
  }

  if (isMobileLayout.value && canEdit.value) {
    event.stopPropagation()
    openLessonMenu(lesson)
    return
  }

  openModal(lesson)
}

const handleCellTap = async (
    day: string,
    time: string,
    lessons: CellLesson[],
    event: MouseEvent,
    endTime?: string,
) => {
  if (!isMobileLayout.value || lessons.length > 0) {
    return
  }

  if (!canEdit.value) {
    return
  }

  if (isHolidayDay(day)) {
    await confirmDialog.alert('В праздничный день нельзя добавить пару')
    return
  }

  event.stopPropagation()
  showEmptyContextMenu(event, day, time, endTime)
}


const viewLesson = () => {
  if (!contextLesson.value) return

  selectedLesson.value = contextLesson.value

  closeMenu()
}

const EditLesson = () => {
  if (!contextLesson.value) return

  const lesson = contextLesson.value
  closeMenu()
  openEditModalForLesson(lesson)
}

const transferLesson = () => {
  if (!contextLesson.value) return

  const lesson = contextLesson.value
  closeMenu()
  openTransferModalForLesson(lesson)
}

const cancelLesson = async () => {
  if (!contextLesson.value) return

  const lesson = contextLesson.value
  const linkedGroupsLabel = lesson.groups.length > 1
    ? lesson.groups.join(', ')
    : null
  const confirmMessage = scheduleType.value === 'consults'
    ? `Удалить консультацию «${lesson.subject}»?`
    : isLectureLessonType(lesson.type)
      ? linkedGroupsLabel
        ? `Удалить лекцию «${lesson.subject}» для групп ${linkedGroupsLabel}?`
        : `Удалить лекцию «${lesson.subject}» для всех параллельных групп?`
      : `Удалить пару «${lesson.subject}»?`

  const isConfirmed = await confirmDialog.confirm({
    message: confirmMessage,
    confirmText: 'Удалить',
    variant: 'danger',
  })

  if (!isConfirmed) {
    return
  }

  if (scheduleType.value === 'consults') {
    try {
      await deleteConsultation(contextLesson.value.id)
      await refreshSchedulePreservingView()
    } catch {
      await confirmDialog.alert('Не удалось удалить консультацию')
    }
  } else {
    try {
      await deleteScheduleItem(contextLesson.value.id)
      await refreshSchedulePreservingView()
    } catch (error) {
      await showScheduleAdminError(error)
    }
  }

  closeMenu()
}

const emptyCellData = ref<{
  day: string
  time: string
  endTime?: string
} | null>(null)

const showEmptyContextMenu = async (
    event: MouseEvent,
    day: string,
    time: string,
    endTime?: string,
) => {
  if (!canEdit.value) {
    return
  }

  event.preventDefault()

  if (isHolidayDay(day)) {
    await confirmDialog.alert('В праздничный день нельзя добавить пару')
    return
  }

  menuX.value = event.clientX
  menuY.value = event.clientY

  // Сбрасываем выбранную пару
  contextLesson.value = null

  // Сохраняем данные пустого слота
  emptyCellData.value = {
    day,
    time,
    endTime,
  }

  isMenuVisible.value = true
}

const commandAddLesson = () => {
  if (!emptyCellData.value) return

  isCreatingLesson.value = true
  editingLesson.value = null

  editSlotContext.value = {
    weekLabel: currentWeekKey.value,
    weekStart: resolveWeekStartForSave(),
    day: emptyCellData.value.day,
  }

  editForm.value = buildEmptyEditForm()

  isEditModalVisible.value = true

  closeMenu()
}

const editModalTitle = computed(() => {
  if (isConsultationSchedule.value) {
    return isCreatingLesson.value ? 'Добавить консультацию' : 'Редактирование консультации'
  }

  return isCreatingLesson.value ? 'Добавить пару' : 'Редактирование занятия'
})

const isGroupFieldReadonly = computed(() => {
  if (scheduleType.value !== 'students') {
    return false
  }

  return !isMultiGroupLessonType(editForm.value.type)
})
const isTeacherFieldReadonly = computed(() => scheduleType.value === 'teachers')
const isRoomFieldsReadonly = computed(() => scheduleType.value === 'auditories')
const showSubgroupField = computed(() =>
  isSubgroupApplicableLessonType(editForm.value.type),
)

watch(
  () => editForm.value.type,
  (type) => {
    if (!isSubgroupApplicableLessonType(type)) {
      editForm.value.subgroup = ''
    }

    if (isEditModalVisible.value && scheduleType.value === 'students') {
      if (isMultiGroupLessonType(type)) {
        if (!editForm.value.group.trim()) {
          editForm.value.group = secondValue.value
        }
      } else {
        editForm.value.group = secondValue.value
      }
    }

    if (!isEditModalVisible.value || !isConsultationSchedule.value) {
      return
    }

    if (type.toLowerCase().includes('онлайн')) {
      editForm.value.building = CONSULTATION_DISTANCE_BUILDING
      editForm.value.room = DISTANCE_ROOM_LABEL
      return
    }

    if (isConsultationDistanceBuilding(editForm.value.building)) {
      editForm.value.building = ''
    }

    if (editForm.value.room === DISTANCE_ROOM_LABEL || editForm.value.room === SPORTS_HALL_ROOM_LABEL) {
      editForm.value.room = ''
    }
  },
)

watch(
  () => editForm.value.day,
  () => {
    if (!isEditModalVisible.value) {
      return
    }

    const isSelectedTimeAvailable = editTimeSlots.value.some(
      (slot) => formatTimeSlotValue(slot) === editForm.value.time,
    )

    if (!isSelectedTimeAvailable) {
      const firstSlot = editTimeSlots.value[0]
      editForm.value.time = firstSlot ? formatTimeSlotValue(firstSlot) : ''
    }
  },
)

watch(
  () => editForm.value.building,
  (building) => {
    if (!isEditModalVisible.value || isRoomFieldsReadonly.value) {
      return
    }

    if (isConsultationSchedule.value && isConsultationDistanceBuilding(building)) {
      editForm.value.type = 'Онлайн-консультация'
      editForm.value.building = CONSULTATION_DISTANCE_BUILDING
      editForm.value.room = DISTANCE_ROOM_LABEL
      return
    }

    if (isOnlineConsultationType.value) {
      return
    }

    const autoFilledRoom = getAutoFilledRoomLabel(building)

    if (autoFilledRoom) {
      editForm.value.room = autoFilledRoom
      return
    }

    if (editForm.value.room === DISTANCE_ROOM_LABEL || editForm.value.room === SPORTS_HALL_ROOM_LABEL) {
      editForm.value.room = ''
    }
  },
)

watch(
  () => transferForm.value.building,
  (building) => {
    if (!isTransferModalVisible.value) {
      return
    }

    const autoFilledRoom = getAutoFilledRoomLabel(building)

    if (autoFilledRoom) {
      transferForm.value.room = autoFilledRoom
      return
    }

    if (transferForm.value.room === DISTANCE_ROOM_LABEL || transferForm.value.room === SPORTS_HALL_ROOM_LABEL) {
      transferForm.value.room = ''
    }
  },
)

const contextMenuStyle = computed(() =>
    isMobileLayout.value
        ? {}
        : {
          top: `${menuY.value}px`,
          left: `${menuX.value}px`,
        }
)

const backToSelection = async () => {
  await router.push({
    name: 'schedule-selection',
    params: { type: scheduleType.value },
  })
}

const prevWeek = () => {
  if (currentWeekIndex.value > 0) {
    currentWeekIndex.value--
  }
}

const nextWeek = () => {
  if (currentWeekIndex.value < weekKeys.value.length - 1) {
    currentWeekIndex.value++
  }
}

const getSaturdaySlot = (rowIndex: number) =>
  isPreholidayDay(saturdayDay)
    ? preholidayTimeSlots[rowIndex] ?? null
    : saturdayTimeSlots[rowIndex] ?? null

const getSlotStartTimes = (slot: TimeSlot): string[] =>
  slot.matchingStartTimes ?? [slot.startTime]

const sortCellLessons = (lessons: CellLesson[]): CellLesson[] =>
  [...lessons].sort((left, right) => {
    const leftSubgroup = left.subgroup ?? 99
    const rightSubgroup = right.subgroup ?? 99

    if (leftSubgroup !== rightSubgroup) {
      return leftSubgroup - rightSubgroup
    }

    return left.subject.localeCompare(right.subject, 'ru', { sensitivity: 'base' })
  })

const mapCellLessons = (lessons: DisplayScheduleItem[]): CellLesson[] => {
  if (scheduleType.value === 'consults') {
    return sortCellLessons(lessons.map((lesson) => ({
      ...lesson,
      groups: lesson.teacher ? [lesson.teacher] : [],
    })))
  }

  const groupedLessons = new Map<string, CellLesson>()

  lessons.forEach((lesson) => {
    const key = [
      lesson.day,
      lesson.startTime,
      lesson.endTime,
      lesson.subject,
      lesson.teacher,
      lesson.type,
      lesson.room,
      lesson.subgroup ?? '',
    ].join('|')

    const existingLesson = groupedLessons.get(key)

    if (existingLesson) {
      const mergedGroups = [...new Set([
        ...existingLesson.groups,
        ...resolveLessonGroups(lesson),
      ])]

      existingLesson.groups = mergedGroups
      existingLesson.group = mergedGroups.join(', ')
      existingLesson.linkedGroups = mergedGroups

      return
    }

    groupedLessons.set(key, {
      ...lesson,
      groups: resolveLessonGroups(lesson),
    })
  })

  return sortCellLessons(Array.from(groupedLessons.values()))
}

const getLessons = (day: string, time: string) => {
  const weekData = weeklySchedules.value[currentWeekKey.value]

  if (!weekData) {
    return []
  }

  const lessons = weekData.filter((item) => item.day === day && item.startTime === time)

  return mapCellLessons(lessons)
}

const getLessonsForSlot = (day: string, slot: TimeSlot) => {
  const weekData = weeklySchedules.value[currentWeekKey.value]

  if (!weekData) {
    return []
  }

  const startTimes = getSlotStartTimes(slot)
  const lessons = weekData.filter((item) =>
    item.day === day && startTimes.includes(item.startTime),
  )

  return mapCellLessons(lessons)
}

const getLessonClass = (type: string) => {
  if (isConsultationSchedule.value) {
    return getLessonGridClass(type) || (
      type.toLowerCase().includes('онлайн') ? 'consult-online' : 'consultation'
    )
  }

  return getLessonGridClass(type)
}

const getTypeName = (type: string) =>
  getLessonTypeLabel(type, isConsultationSchedule.value)

const getLessonMeta = (lesson: CellLesson) => {
  const subgroupLabel = lesson.subgroup ? `п/гр ${lesson.subgroup} • ` : ''

  if (scheduleType.value === 'consults') {
    return `${lesson.teacher} • ${lesson.room}`
  }

  if (scheduleType.value === 'students') {
    return `${subgroupLabel}${lesson.teacher} • ${lesson.room}`
  }

  if (scheduleType.value === 'auditories') {
    return `${subgroupLabel}${lesson.groups.join(', ')} • ${lesson.teacher}`
  }

  return `${subgroupLabel}${lesson.groups.join(', ')} • ${lesson.room}`
}

const currentWeekLessons = computed(() => weeklySchedules.value[currentWeekKey.value] ?? [])

const parallelPairWarnings = computed(() => {
  const slots = new Map<string, { day: string; time: string; subjects: string[] }>()

  for (const lesson of currentWeekLessons.value) {
    if (!lesson.isSameCellParallel) {
      continue
    }

    const key = `${lesson.day}|${lesson.startTime}`
    const existing = slots.get(key)

    if (existing) {
      if (!existing.subjects.includes(lesson.subject)) {
        existing.subjects.push(lesson.subject)
      }
      continue
    }

    slots.set(key, {
      day: lesson.day,
      time: lesson.startTime,
      subjects: [lesson.subject],
    })
  }

  return Array.from(slots.values()).filter((slot) => slot.subjects.length > 1)
})

const hasParallelPairsInWeek = computed(() => parallelPairWarnings.value.length > 0)

const isParallelCell = (day: string, time: string) => {
  const lessons = getLessons(day, time)

  return lessons.some((lesson) => lesson.isSameCellParallel) && lessons.length > 1
}

const isParallelSlot = (day: string, slot: TimeSlot) => {
  const lessons = getLessonsForSlot(day, slot)

  return lessons.some((lesson) => lesson.isSameCellParallel) && lessons.length > 1
}

const isConsultationSchedule = computed(() => scheduleType.value === 'consults')

const isOnlineConsultationType = computed(() =>
  isConsultationSchedule.value && editForm.value.type.toLowerCase().includes('онлайн'),
)

// Проверка, может ли текущий пользователь редактировать
const canEdit = computed(() => {
  if (scheduleType.value === 'consults') {
    return canManageConsultations(authStore.currentUser, firstValue.value)
  }

  return hasScheduleManageAccess(authStore.currentUser)
})

const canManagePairs = computed(() => canEdit.value && scheduleType.value !== 'consults')

const syncMobileLayout = (queryList: MediaQueryList | MediaQueryListEvent) => {
  isMobileLayout.value = queryList.matches
}

onMounted(() => {
  void loadPreholidayDays()
  connectScheduleLiveUpdates()
  document.addEventListener('click', closeMenu as EventListener)

  mobileMediaQuery = window.matchMedia('(max-width: 640px)')
  syncMobileLayout(mobileMediaQuery)
  mobileMediaQuery.addEventListener('change', syncMobileLayout)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
  mobileMediaQuery?.removeEventListener('change', syncMobileLayout)

  if (scheduleReloadTimer) {
    clearTimeout(scheduleReloadTimer)
  }

  if (editPreviewTimer) {
    clearTimeout(editPreviewTimer)
  }

  if (transferPreviewTimer) {
    clearTimeout(transferPreviewTimer)
  }

  if (transferDragPreviewTimer) {
    clearTimeout(transferDragPreviewTimer)
  }

  scheduleSocket?.removeAllListeners()
  scheduleSocket?.disconnect()
  scheduleSocket = null
  resetTransferDragState()
})
</script>

<template>
  <PageFrame>
    <section class="schedule-page">
      <div class="page-head">
        <h1 class="title">{{ pageTitle }}</h1>
      </div>

      <div v-if="isLoadingSchedule && !hasLoadedScheduleOnce && !isConsultationSchedule" class="empty-state">
        <h2>Загрузка расписания...</h2>
      </div>

      <div v-else-if="scheduleLoadError" class="empty-state">
        <h2>{{ scheduleLoadError }}</h2>
        <p>Попробуйте обновить страницу или вернуться назад и выбрать группу снова.</p>
      </div>

      <template v-else-if="!isEmptySchedule">
        <div v-if="offlineScheduleNotice" class="offline-notice" role="status">
          {{ offlineScheduleNotice }}
        </div>

        <div class="week-nav">
          <select v-model.number="currentWeekIndex" class="week-label week-select" aria-label="Выбрать неделю">
            <option
                v-for="(key, index) in weekKeys"
                :key="key"
                :value="index"
            >
              Неделя: {{ key }}
            </option>
          </select>

          <div class="week-buttons">
            <button type="button" @click="prevWeek" :disabled="currentWeekIndex === 0">
              {{ isMobileLayout ? '← Назад' : '← Предыдущая неделя' }}
            </button>

            <button
                type="button"
                @click="nextWeek"
                :disabled="currentWeekIndex >= weekKeys.length - 1"
            >
              {{ isMobileLayout ? 'Вперёд →' : 'Следующая неделя →' }}
            </button>
          </div>
        </div>

        <div v-if="hasParallelPairsInWeek" class="parallel-warning">
          <strong>Внимание:</strong> в эту неделю в одно время стоят две разные дисциплины (параллельные пары).
          <ul>
            <li v-for="(slot, index) in parallelPairWarnings" :key="index">
              {{ slot.day }}, {{ slot.time }} — {{ slot.subjects.join(' / ') }}
            </li>
          </ul>
        </div>

        <div class="legend">
          <template v-if="isConsultationSchedule">
            <div class="legend-item">
              <span class="box consultation"></span>
              Консультация
            </div>

            <div class="legend-item">
              <span class="box consult-online"></span>
              Онлайн-консультация
            </div>
          </template>

          <template v-else>
            <div class="legend-item">
              <span class="box lecture"></span>
              Лекция
            </div>

            <div class="legend-item">
              <span class="box practice"></span>
              Практика
            </div>

            <div class="legend-item">
              <span class="box lab"></span>
              Лабораторная
            </div>

            <div class="legend-item">
              <span class="box exam"></span>
              Зачёт/защита КР
            </div>

            <div class="legend-item">
              <span class="box special"></span>
              Особое
            </div>
          </template>
        </div>

        <div class="table">
          <div class="header">
            <div class="weekday-time-header">
              <span class="time-header-label">Время</span>
            </div>

            <div
                v-for="day in weekdayDays"
                :key="day"
                class="header-day"
                :class="{
                  'header-day--holiday': isHolidayDay(day),
                  'header-day--preholiday': isPreholidayDay(day),
                }"
            >
              <span class="header-day__name">{{ day }}</span>
              <span v-if="getDayDateLabel(day)" class="header-day__date">
                {{ getDayDateLabel(day) }}
              </span>
              <span v-if="getHolidayNameForDay(day)" class="header-day__holiday">
                {{ getHolidayNameForDay(day) }}
              </span>
              <span v-if="isPreholidayDay(day)" class="header-day__holiday">
                Предпраздничный
              </span>
              <button
                  v-if="canManagePairs"
                  type="button"
                  class="preholiday-toggle"
                  :disabled="isSavingPreholidayDay"
                  @click.stop="togglePreholidayDay(day)"
              >
                {{ isPreholidayDay(day) ? 'Обычный' : 'Предпраздн.' }}
              </button>
            </div>

            <div class="saturday-time-header">
              <span class="time-header-label">Время</span>
            </div>
            <div
                class="header-day"
                :class="{
                  'header-day--holiday': isHolidayDay(saturdayDay),
                  'header-day--preholiday': isPreholidayDay(saturdayDay),
                }"
            >
              <span class="header-day__name">{{ saturdayDay }}</span>
              <span v-if="getDayDateLabel(saturdayDay)" class="header-day__date">
                {{ getDayDateLabel(saturdayDay) }}
              </span>
              <span v-if="getHolidayNameForDay(saturdayDay)" class="header-day__holiday">
                {{ getHolidayNameForDay(saturdayDay) }}
              </span>
              <span v-if="isPreholidayDay(saturdayDay)" class="header-day__holiday">
                Предпраздничный
              </span>
              <button
                  v-if="canManagePairs"
                  type="button"
                  class="preholiday-toggle"
                  :disabled="isSavingPreholidayDay"
                  @click.stop="togglePreholidayDay(saturdayDay)"
              >
                {{ isPreholidayDay(saturdayDay) ? 'Обычный' : 'Предпраздн.' }}
              </button>
            </div>
          </div>

          <div v-for="(time, rowIndex) in times" :key="time" class="row">
            <div class="time time--weekday">{{ time }} - {{ PAIR_END_TIMES[time] }}</div>

            <template v-for="day in weekdayDays" :key="day">
              <template v-for="daySlot in [getDaySlot(day, rowIndex)]" :key="`${day}-${time}`">
                <div
                    v-if="daySlot"
                    class="cell"
                    :class="{
                      'cell--parallel': isParallelSlot(day, daySlot),
                      'cell--holiday': isHolidayDay(day),
                      'cell--preholiday': isPreholidayDay(day),
                      ...getTransferDropCellClass(day, daySlot),
                    }"
                    @click.stop="
                      handleCellTap(
                        day,
                        daySlot.startTime,
                        getLessonsForSlot(day, daySlot),
                        $event,
                        daySlot.endTime,
                      )
                    "
                    @contextmenu.prevent="
                      showEmptyContextMenu($event, day, daySlot.startTime, daySlot.endTime)
                    "
                    @dragenter.prevent="handleTransferCellDragEnter(day, daySlot, $event)"
                    @dragover.prevent="handleTransferCellDragOver(day, daySlot, $event)"
                    @drop.prevent="handleTransferCellDrop(day, daySlot, $event)"
                >
                  <div v-if="isPreholidayDay(day)" class="cell-slot-time">
                    {{ daySlot.startTime }} - {{ daySlot.endTime }}
                  </div>

                  <div
                      v-for="lesson in getLessonsForSlot(day, daySlot)"
                      :key="`${lesson.group}-${lesson.id}`"
                      class="lesson"
                      :class="getLessonClass(lesson.type)"
                      :draggable="canManagePairs && !isMobileLayout"
                      @dragstart="handleTransferLessonDragStart(lesson, $event)"
                      @dragend="handleTransferLessonDragEnd"
                      @click.stop="handleLessonTap(lesson, $event)"
                      @contextmenu.prevent.stop="showContextMenu($event, lesson)"
                  >
                    <div class="subject">{{ lesson.subject }}</div>
                    <div class="meta">{{ getLessonMeta(lesson) }}</div>
                  </div>
                </div>

                <div v-else class="cell cell--removed"></div>
              </template>
            </template>

            <template v-for="saturdaySlot in [getSaturdaySlot(rowIndex)]" :key="`saturday-${time}`">
              <template v-if="saturdaySlot">
                <div class="time time--saturday">{{ saturdaySlot.startTime }} - {{ saturdaySlot.endTime }}</div>

                <div
                    class="cell"
                    :class="{
                      'cell--parallel': isParallelSlot(saturdayDay, saturdaySlot),
                      'cell--holiday': isHolidayDay(saturdayDay),
                      'cell--preholiday': isPreholidayDay(saturdayDay),
                      ...getTransferDropCellClass(saturdayDay, saturdaySlot),
                    }"
                    @click.stop="
                      handleCellTap(
                        saturdayDay,
                        saturdaySlot.startTime,
                        getLessonsForSlot(saturdayDay, saturdaySlot),
                        $event,
                        saturdaySlot.endTime,
                      )
                    "
                    @contextmenu.prevent="
                      showEmptyContextMenu(
                        $event,
                        saturdayDay,
                        saturdaySlot.startTime,
                        saturdaySlot.endTime,
                      )
                    "
                    @dragenter.prevent="handleTransferCellDragEnter(saturdayDay, saturdaySlot, $event)"
                    @dragover.prevent="handleTransferCellDragOver(saturdayDay, saturdaySlot, $event)"
                    @drop.prevent="handleTransferCellDrop(saturdayDay, saturdaySlot, $event)"
                >
                  <div v-if="isPreholidayDay(saturdayDay)" class="cell-slot-time">
                    {{ saturdaySlot.startTime }} - {{ saturdaySlot.endTime }}
                  </div>

                  <div
                      v-for="lesson in getLessonsForSlot(saturdayDay, saturdaySlot)"
                      :key="`${lesson.group}-${lesson.id}`"
                      class="lesson"
                      :class="getLessonClass(lesson.type)"
                      :draggable="canManagePairs && !isMobileLayout"
                      @dragstart="handleTransferLessonDragStart(lesson, $event)"
                      @dragend="handleTransferLessonDragEnd"
                      @click.stop="handleLessonTap(lesson, $event)"
                      @contextmenu.prevent.stop="showContextMenu($event, lesson)"
                  >
                    <div class="subject">{{ lesson.subject }}</div>
                    <div class="meta">{{ getLessonMeta(lesson) }}</div>
                  </div>
                </div>
              </template>
            </template>
          </div>
        </div>
      </template>

      <div v-else class="empty-state">
        <h2>По выбранным параметрам расписание пока не найдено</h2>
        <p v-if="scheduleType === 'students'">
          Для группы {{ secondValue }} расписание ещё не загружено учебным отделом.
        </p>
        <p v-else-if="scheduleType === 'teachers'">
          Для преподавателя {{ secondValue }} расписание ещё не найдено в загруженных файлах.
        </p>
        <p v-else-if="scheduleType === 'auditories'">
          Для аудитории {{ secondValue }} расписание ещё не найдено в загруженных файлах.
        </p>
        <p v-else>
          Попробуйте вернуться назад и выбрать другие параметры.
        </p>
      </div>
    </section>
  </PageFrame>

  <Teleport to="body">
    <template v-if="isMenuVisible">
      <div
          v-if="isMobileLayout"
          class="context-menu-overlay"
          @click.self="closeMenu()"
      />

      <ul
          class="context-menu"
          :style="contextMenuStyle"
      >
        <!-- Если слот пустой -->
        <template v-if="!contextLesson">

          <li v-if="canManagePairs || (canEdit && isConsultationSchedule)" @click="commandAddLesson">
            {{ isConsultationSchedule ? 'Добавить консультацию' : 'Добавить пару' }}
          </li>

        </template>

        <!-- Если есть пара -->
        <template v-else>

          <li @click="viewLesson">
            Просмотр
          </li>

          <li v-if="canManagePairs || canEdit" @click="EditLesson">
            Внести изменения
          </li>

          <li v-if="canManagePairs" @click="transferLesson">
            Перенести пару
          </li>

          <li v-if="canManagePairs || canEdit" @click="cancelLesson">
            {{ isConsultationSchedule ? 'Удалить консультацию' : 'Удалить пару' }}
          </li>

        </template>

        <li @click="closeMenu()">
          Отмена
        </li>
      </ul>
    </template>
  </Teleport>

  <Teleport to="body">
    <div
        v-if="selectedLesson || (isTransferModalVisible && transferringLesson) || isEditModalVisible"
        class="schedule-page schedule-modal-host"
    >
      <div v-if="selectedLesson" class="modal-overlay" @click="closeModal">
        <div class="modal" @click.stop>
          <div class="modal-header-actions">
            <button
                v-if="canManagePairs || canEdit"
                class="edit-btn"
                type="button"
                @click="openEditModal"
                title="Редактировать"
            >
              <img :src="editIcon" alt="Редактировать" />
            </button>

            <button class="close-btn-main" type="button" @click="closeModal">✕</button>
          </div>

          <h2 class="modal-title">{{ selectedLesson.subject }}</h2>

          <div v-if="selectedLesson.isSameCellParallel" class="parallel-notice">
            В это время идёт параллельная пара — в ячейке расписания показаны две разные дисциплины.
          </div>

          <div class="modal-body">
            <div class="type-badge" :class="getLessonClass(selectedLesson.type)">
              {{ getTypeName(selectedLesson.type) }}
            </div>

            <div class="modal-info">
              <p v-if="!isConsultationSchedule">
                <strong>{{ selectedLesson.groups.length > 1 ? 'Группы:' : 'Группа:' }}</strong>
                {{ selectedLesson.groups.join(', ') }}
              </p>

              <p>
                <strong>Преподаватель:</strong>
                {{ selectedLesson.teacher }}
              </p>

              <p v-if="selectedLesson.subgroup && !isConsultationSchedule">
                <strong>Подгруппа:</strong>
                {{ selectedLesson.subgroup }}
              </p>

              <p>
                <strong>Аудитория:</strong>
                <span class="modal-info-room-line">
                  {{ selectedLesson.room }}
                  <button
                      v-if="selectedRomanRoomHint"
                      type="button"
                      class="roman-room-hint-btn"
                      :aria-expanded="isRomanRoomHintOpen"
                      aria-label="Где находится аудитория"
                      @click="isRomanRoomHintOpen = !isRomanRoomHintOpen"
                  >
                    <svg
                        class="roman-room-hint-icon"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                    >
                      <path
                          d="M12 17V16.9929M9.13721 9C9.51949 7.84083 10.6566 7 11.9999 7C12.3506 7 12.6872 7.05731 13 7.16262M11.9998 14.8571C11.9998 11.6429 14.9998 12.3571 14.9998 9.85714C14.9998 9.55851 14.9516 9.27058 14.8624 9M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </span>
                <span
                    v-if="selectedRomanRoomHint && isRomanRoomHintOpen"
                    class="roman-room-hint"
                >
                  <template v-if="selectedRomanRoomHint.location">
                    {{ selectedRomanRoomHint.location }}
                  </template>
                  <template v-else>
                    Корпус: {{ selectedRomanRoomHint.building }}
                  </template>
                </span>
              </p>

              <p>
                <strong>Время:</strong>
                {{ selectedLesson.startTime }} - {{ selectedLesson.endTime }}
              </p>
              <p v-if="selectedLesson.comment">
                <strong>{{ isConsultationSchedule ? 'Ссылка / комментарий:' : 'Комментарий:' }}</strong>
                <a
                  v-if="isConsultationSchedule && /^https?:\/\//i.test(selectedLesson.comment)"
                  :href="selectedLesson.comment"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ selectedLesson.comment }}
                </a>
                <template v-else>
                  {{ selectedLesson.comment }}
                </template>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isTransferModalVisible && transferringLesson" class="modal-overlay" @click="closeTransferModal">
        <div class="modal transfer-modal" @click.stop>
          <button class="close-btn" type="button" @click="closeTransferModal">✕</button>

          <h2 class="modal-title">Перенос пары</h2>

          <div class="modal-body">
            <div class="transfer-summary">
              <strong>{{ transferringLesson.subject }}</strong>
              <span>
                Сейчас: {{ transferringLesson.day }},
                {{ transferringLesson.startTime }} - {{ transferringLesson.endTime }}
              </span>
              <p
                  v-if="isLectureLessonType(transferringLesson.type)"
                  class="form-hint"
              >
                Лекция будет перенесена во всех параллельных группах
                <template v-if="transferringLesson.groups.length > 1">
                  ({{ transferringLesson.groups.join(', ') }})
                </template>.
              </p>
            </div>

            <div class="edit-form">
              <div class="form-group">
                <label for="transfer-week" class="form-label">Неделя</label>
                <select id="transfer-week" v-model="transferForm.weekKey" class="form-select">
                  <option
                      v-for="key in weekKeys"
                      :key="key"
                      :value="key"
                      :disabled="isPastWeek(key)"
                  >
                    {{ key }}{{ isPastWeek(key) ? ' · прошла' : '' }}
                  </option>
                </select>
                <span
                    v-if="isPastWeek(transferForm.weekKey)"
                    class="form-hint form-hint--danger"
                >
                  На прошедшую неделю переносить нельзя.
                </span>
              </div>

              <div class="form-group">
                <label for="transfer-day" class="form-label">Новый день</label>
                <select id="transfer-day" v-model="transferForm.day" class="form-select">
                  <option
                      v-for="day in days"
                      :key="day"
                      :value="day"
                      :disabled="isHolidayDayInWeek(day, transferForm.weekKey)"
                  >
                    {{ day }} · {{ getDayDateLabelForWeek(day, transferForm.weekKey) }}
                    {{ isHolidayDayInWeek(day, transferForm.weekKey) ? ' · праздник' : '' }}
                  </option>
                </select>
                <span
                    v-if="isHolidayDayInWeek(transferForm.day, transferForm.weekKey)"
                    class="form-hint form-hint--danger"
                >
                  На праздничный день переносить нельзя.
                </span>
              </div>

              <div class="form-group">
                <label for="transfer-time" class="form-label">Новое время</label>
                <select id="transfer-time" v-model="transferForm.time" class="form-select">
                  <option
                      v-for="slot in transferTimeSlots"
                      :key="`${slot.startTime}-${slot.endTime}`"
                      :value="formatTimeSlotValue(slot)"
                  >
                    {{ formatTimeSlotValue(slot) }}
                  </option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="transfer-building" class="form-label">Корпус</label>
                  <select
                      id="transfer-building"
                      v-model="transferForm.building"
                      class="form-select"
                  >
                    <option value="">Не выбран</option>
                    <option v-for="building in BUILDING_OPTIONS" :key="building" :value="building">
                      {{ building }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="transfer-room" class="form-label">Аудитория</label>
                  <input
                      id="transfer-room"
                      v-model="transferForm.room"
                      type="text"
                      class="form-input"
                      placeholder="312 или дист. форм. об."
                      :readonly="isAutoFilledRoomBuilding(transferForm.building)"
                  />
                </div>
              </div>
            </div>

            <div class="transfer-recommendations edit-preview">
              <div class="transfer-recommendations__head">
                <h3>Проверка конфликтов</h3>
                <span v-if="isLoadingTransferPreview">Проверяем...</span>
              </div>

              <p v-if="transferPreviewError" class="form-hint form-hint--danger">
                {{ transferPreviewError }}
              </p>

              <div v-else-if="hasTransferPreviewConflicts" class="edit-preview__conflicts">
                <p class="form-hint form-hint--danger">
                  С текущими параметрами перенести пару нельзя:
                </p>
                <ul class="edit-preview__conflicts-list">
                  <li
                      v-for="(conflict, index) in transferPreviewConflicts"
                      :key="`${index}-${conflict}`"
                  >
                    {{ conflict }}
                  </li>
                </ul>
              </div>

              <p
                  v-else-if="!isLoadingTransferPreview && buildTransferPreviewPayload()"
                  class="form-hint"
              >
                Конфликтов не обнаружено.
              </p>

              <div
                  v-if="hasTransferPreviewConflicts && visibleTransferPreviewRecommendations.length > 0"
                  class="transfer-recommendations__list"
              >
                <p class="form-hint">Можно перенести пару:</p>
                <button
                    v-for="(recommendation, index) in visibleTransferPreviewRecommendations"
                    :key="`transfer-preview-${recommendation.day}-${recommendation.startTime}-${recommendation.endTime}`"
                    type="button"
                    class="transfer-recommendation"
                    :class="{
                      'transfer-recommendation--selected':
                        transferForm.day === recommendation.day
                        && transferForm.time === `${recommendation.startTime} - ${recommendation.endTime}`,
                    }"
                    @click="applyTransferRecommendation(recommendation)"
                >
                  <span class="transfer-recommendation__title">
                    {{ index === 0 ? 'Лучший вариант: ' : '' }}{{ recommendation.label }}
                  </span>
                  <span class="transfer-recommendation__reasons">
                    {{ recommendation.reasons.join(', ') }}
                  </span>
                </button>
              </div>

              <p
                  v-else-if="hasTransferPreviewConflicts && !isLoadingTransferPreview"
                  class="form-hint"
              >
                Для выбранных параметров нет свободных вариантов переноса без конфликтов.
              </p>
            </div>

            <div class="transfer-recommendations">
              <div class="transfer-recommendations__head">
                <h3>Рекомендуемые варианты</h3>
                <span v-if="isLoadingTransferRecommendations">Подбираем...</span>
              </div>

              <p v-if="transferRecommendationError" class="form-hint form-hint--danger">
                {{ transferRecommendationError }}
              </p>

              <div
                  v-else-if="visibleTransferRecommendations.length > 0"
                  class="transfer-recommendations__list"
              >
                <button
                    v-for="(recommendation, index) in visibleTransferRecommendations"
                    :key="`${recommendation.day}-${recommendation.startTime}-${recommendation.endTime}`"
                    type="button"
                    class="transfer-recommendation"
                    :class="{
                      'transfer-recommendation--selected':
                        transferForm.day === recommendation.day
                        && transferForm.time === `${recommendation.startTime} - ${recommendation.endTime}`,
                    }"
                    @click="applyTransferRecommendation(recommendation)"
                >
                  <span class="transfer-recommendation__title">
                    {{ index === 0 ? 'Лучший вариант: ' : '' }}{{ recommendation.label }}
                  </span>
                  <span class="transfer-recommendation__reasons">
                    {{ recommendation.reasons.join(', ') }}
                  </span>
                </button>
              </div>

              <p
                  v-else-if="!isLoadingTransferRecommendations"
                  class="form-hint"
              >
                Для выбранной недели нет свободных вариантов без конфликтов.
              </p>
            </div>

            <div class="edit-actions">
              <button type="button" class="btn btn-secondary" @click="closeTransferModal">
                Отмена
              </button>
              <button
                  type="button"
                  class="btn btn-primary"
                  :disabled="isTransferSaving || isLoadingTransferPreview || hasTransferPreviewConflicts || isHolidayDayInWeek(transferForm.day, transferForm.weekKey) || isPastWeek(transferForm.weekKey)"
                  @click="saveTransfer"
              >
                {{ isTransferSaving ? 'Перенос...' : 'Перенести' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isEditModalVisible" class="modal-overlay" @click="closeEditModal">
        <div class="modal edit-modal" @click.stop>
          <button class="close-btn" type="button" @click="closeEditModal">✕</button>

          <h2 class="modal-title">{{ editModalTitle }}</h2>

          <div class="modal-body">
            <div class="edit-form">
              <div class="form-group">
                <label for="edit-name" class="form-label">Название</label>
                <input
                    id="edit-name"
                    v-model="editForm.name"
                    type="text"
                    class="form-input"
                    placeholder="Название"
                />
              </div>

              <div class="form-group">
                <label for="edit-type" class="form-label">Тип занятия</label>
                <select id="edit-type" v-model="editForm.type" class="form-select">
                  <option value="" disabled>Выберите</option>
                  <template v-if="isConsultationSchedule">
                    <option value="Консультация">Консультация</option>
                    <option value="Онлайн-консультация">Онлайн-консультация</option>
                  </template>
                  <template v-else>
                    <option
                        v-for="option in LESSON_TYPE_OPTIONS"
                        :key="option"
                        :value="option"
                    >
                      {{ option }}
                    </option>
                  </template>
                </select>
              </div>

              <div v-if="!isConsultationSchedule" class="form-group">
                <label for="edit-group" class="form-label">Группа</label>
                <input
                    id="edit-group"
                    v-model="editForm.group"
                    type="text"
                    class="form-input"
                    :placeholder="groupFieldPlaceholder"
                    :readonly="isGroupFieldReadonly"
                />
                <p
                    v-if="isGroupFieldReadonly && scheduleType === 'students'"
                    class="form-hint"
                >
                  Для нескольких групп выберите тип «Лекция» или «Особое».
                </p>
                <p
                    v-else-if="isMultiGroupLessonType(editForm.type)"
                    class="form-hint"
                >
                  Можно указать несколько групп через запятую. Для лекций группы должны быть параллельными.
                </p>
              </div>

              <div v-if="isConsultationSchedule" class="form-group">
                <label for="edit-teacher-consult" class="form-label">
                  Преподаватель <span class="required">*</span>
                </label>
                <select
                    id="edit-teacher-consult"
                    v-model="editForm.teacher"
                    class="form-select"
                >
                  <option value="" disabled>Выберите преподавателя</option>
                  <option
                      v-for="teacher in consultationTeachers"
                      :key="teacher"
                      :value="teacher"
                  >
                    {{ teacher }}
                  </option>
                </select>
              </div>

              <div v-if="!isConsultationSchedule" class="form-group">
                <label for="edit-teacher" class="form-label">Преподаватель</label>
                <input
                    id="edit-teacher"
                    v-model="editForm.teacher"
                    type="text"
                    class="form-input"
                    placeholder="Иванов И.И."
                    :readonly="isTeacherFieldReadonly"
                />
              </div>

              <div class="form-group">
                <label for="edit-day" class="form-label">День недели</label>
                <select id="edit-day" v-model="editForm.day" class="form-select">
                  <option v-for="day in days" :key="day" :value="day">
                    {{ day }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="edit-time" class="form-label">Время</label>
                <select id="edit-time" v-model="editForm.time" class="form-select">
                  <option value="" disabled>Выберите</option>
                  <option
                      v-for="slot in editTimeSlots"
                      :key="`${slot.startTime}-${slot.endTime}`"
                      :value="formatTimeSlotValue(slot)"
                  >
                    {{ formatTimeSlotValue(slot) }}
                  </option>
                </select>
              </div>

              <div v-if="isOnlineConsultationType" class="form-group">
                <label for="edit-room-online" class="form-label">Аудитория</label>
                <input
                    id="edit-room-online"
                    :value="DISTANCE_ROOM_LABEL"
                    type="text"
                    class="form-input"
                    readonly
                />
              </div>

              <div v-else class="form-row">
                <div class="form-group">
                  <label for="edit-building" class="form-label">Корпус</label>
                  <select
                      id="edit-building"
                      v-model="editForm.building"
                      class="form-select"
                      :disabled="isRoomFieldsReadonly"
                  >
                    <option value="">Не выбран</option>
                    <option
                      v-for="building in (isConsultationSchedule ? CONSULTATION_BUILDING_OPTIONS : BUILDING_OPTIONS)"
                      :key="building"
                      :value="building"
                    >
                      {{ building }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="edit-room" class="form-label">Аудитория</label>
                  <input
                      id="edit-room"
                      v-model="editForm.room"
                      type="text"
                      class="form-input"
                      placeholder="312 или дист. форм. об."
                      :readonly="isRoomFieldsReadonly || isAutoFilledRoomBuilding(editForm.building)"
                  />
                </div>
              </div>

              <div v-if="!isConsultationSchedule && showSubgroupField" class="form-group">
                <label for="edit-subgroup" class="form-label">Подгруппа</label>
                <select id="edit-subgroup" v-model="editForm.subgroup" class="form-select">
                  <option value="">Вся группа</option>
                  <option value="1">Подгруппа 1</option>
                  <option value="2">Подгруппа 2</option>
                </select>
              </div>

              <div class="form-group">
                <label for="edit-additional" class="form-label">
                  {{ isConsultationSchedule ? 'Ссылка / комментарий' : 'Комментарий' }}
                </label>
                <input
                    id="edit-additional"
                    v-model="editForm.additional"
                    type="text"
                    class="form-input"
                    :placeholder="isConsultationSchedule ? 'https://meet.example.com/...' : 'Дополнительная информация'"
                />
              </div>
            </div>

            <div
                v-if="canManagePairs && !isCreatingLesson && !isConsultationSchedule"
                class="transfer-recommendations edit-preview"
            >
              <div class="transfer-recommendations__head">
                <h3>Проверка конфликтов</h3>
                <span v-if="isLoadingEditPreview">Проверяем...</span>
              </div>

              <p v-if="editPreviewError" class="form-hint form-hint--danger">
                {{ editPreviewError }}
              </p>

              <div v-else-if="hasEditPreviewConflicts" class="edit-preview__conflicts">
                <p class="form-hint form-hint--danger">
                  С текущими параметрами сохранить пару нельзя:
                </p>
                <ul class="edit-preview__conflicts-list">
                  <li
                      v-for="(conflict, index) in editPreviewConflicts"
                      :key="`${index}-${conflict}`"
                  >
                    {{ conflict }}
                  </li>
                </ul>
              </div>

              <p
                  v-else-if="!isLoadingEditPreview && buildEditPreviewPayload()"
                  class="form-hint"
              >
                Конфликтов не обнаружено.
              </p>

              <div
                  v-if="hasEditPreviewConflicts && visibleEditPreviewRecommendations.length > 0"
                  class="transfer-recommendations__list"
              >
                <p class="form-hint">Можно перенести пару:</p>
                <button
                    v-for="(recommendation, index) in visibleEditPreviewRecommendations"
                    :key="`edit-${recommendation.day}-${recommendation.startTime}-${recommendation.endTime}`"
                    type="button"
                    class="transfer-recommendation"
                    :class="{
                      'transfer-recommendation--selected':
                        editForm.day === recommendation.day
                        && editForm.time === `${recommendation.startTime} - ${recommendation.endTime}`,
                    }"
                    @click="applyEditPreviewRecommendation(recommendation)"
                >
                  <span class="transfer-recommendation__title">
                    {{ index === 0 ? 'Лучший вариант: ' : '' }}{{ recommendation.label }}
                  </span>
                  <span class="transfer-recommendation__reasons">
                    {{ recommendation.reasons.join(', ') }}
                  </span>
                </button>
              </div>

              <p
                  v-else-if="hasEditPreviewConflicts && !isLoadingEditPreview"
                  class="form-hint"
              >
                Для выбранных параметров нет свободных вариантов переноса без конфликтов.
              </p>
            </div>

            <div class="edit-actions">
              <button type="button" class="btn btn-secondary" @click="closeEditModal">
                Отмена
              </button>
              <button
                  type="button"
                  class="btn btn-primary"
                  :disabled="isSaving || hasEditPreviewConflicts"
                  @click="saveEdit"
              >
                {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
