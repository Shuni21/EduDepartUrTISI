export type ScheduleKind = 'students' | 'teachers' | 'auditories' | 'consults'

export interface DisplayScheduleItem {
  id: number
  day: string
  startTime: string
  endTime: string
  subject: string
  teacher: string
  type: string
  room: string
  group: string
  linkedGroups?: string[]
  subgroup?: number | null
  isSameCellParallel?: boolean
  comment?: string | null
  weekStart?: string
}

export interface SchedulePeriodMeta {
  academicYearLabel: string | null
  periodStart: string | null
  periodEnd: string | null
  periodLabel: string | null
}

export function formatSchedulePeriodSuffix(meta: SchedulePeriodMeta | null | undefined): string {
  if (!meta?.academicYearLabel) {
    return ''
  }

  if (meta.periodLabel) {
    return ` · ${meta.academicYearLabel} (${meta.periodLabel})`
  }

  return ` · ${meta.academicYearLabel}`
}

export interface ScheduleTypeMeta {
  title: string
  caption: string
  actionLabel: string
}

export const scheduleTypeMeta: Record<ScheduleKind, ScheduleTypeMeta> = {
  students: {
    title: 'Расписание студентов',
    caption: 'Выберите факультет и группу из загруженных расписаний.',
    actionLabel: 'Показать расписание',
  },
  teachers: {
    title: 'Расписание преподавателей',
    caption: 'Выберите кафедру (необязательно) и преподавателя из загруженных расписаний.',
    actionLabel: 'Показать расписание',
  },
  auditories: {
    title: 'Расписание аудиторий',
    caption: 'Выберите учебный корпус и аудиторию.',
    actionLabel: 'Показать расписание',
  },
  consults: {
    title: 'Расписание консультаций',
    caption: 'Выберите кафедру преподавателей, чтобы посмотреть консультации.',
    actionLabel: 'Показать консультации',
  },
}

export const facultyOptions = ['СПО', 'ФИИиУ', 'ФНО', 'Магистратура', 'Аспирантура']

const groupFacultyMap: Record<string, string> = {
  '381': 'СПО',
  '382': 'СПО',
  '487': 'СПО',
  'ПЕ-31б': 'ФИИиУ',
  'ПЕ-32б': 'ФИИиУ',
  'ТЕ-32б': 'ФНО',
}

export const studentFacultySelectOptions = [
  { value: 'СПО', label: 'СПО' },
  { value: 'ФИИиУ', label: 'ФИИиУ' },
  { value: 'ФНО', label: 'ФНО' },
  { value: 'Магистратура', label: 'Магистратура' },
  { value: 'Аспирантура', label: 'Аспирантура' },
] as const

const compareText = (left: string, right: string) =>
  left.localeCompare(right, 'ru', { sensitivity: 'base', numeric: true })

const collectUnique = (items: string[]) => Array.from(new Set(items)).sort(compareText)

export const getGroupFaculty = (group: string) => {
  const normalized = group.trim()

  if (groupFacultyMap[normalized]) {
    return groupFacultyMap[normalized]
  }

  if (/^\d{3}$/.test(normalized)) {
    return 'СПО'
  }

  if (/^ТЕ-/i.test(normalized)) {
    return 'ФНО'
  }

  if (/^ПЕ-/i.test(normalized)) {
    return 'ФИИиУ'
  }

  return 'ФИИиУ'
}

export function getGroupsByFaculty(
  faculty: string | null,
  additionalGroups: string[] = [],
  groupFacultyOverrides: Record<string, string | null> = {},
) {
  if (!faculty) {
    return []
  }

  return collectUnique(additionalGroups).filter((group) => {
    const assignedFaculty = groupFacultyOverrides[group] ?? getGroupFaculty(group)
    return assignedFaculty === faculty
  })
}

export function getBuildingFromRoom(room: string) {
  const normalized = room.trim().toUpperCase()

  if (normalized.includes('УК1')) {
    return 'УК1'
  }

  if (normalized.includes('УК2') || normalized.includes('УК№2')) {
    return 'УК2'
  }

  if (normalized.includes('УК3') || normalized.includes('УК№3')) {
    return 'УК3'
  }

  if (normalized.includes('УК4') || normalized.includes('УК№4')) {
    return 'УК4'
  }

  if (normalized.includes('УК5') || normalized.includes('УК№5')) {
    return 'УК5'
  }

  if (isRomanRoomUk5(normalized)) {
    return 'УК5'
  }

  if (isRomanRoomUk3(normalized)) {
    return 'УК3'
  }

  return null
}

export interface AcademicWeek {
  label: string
  start: Date
  end: Date
}

function getMondayWeekStart(date: Date): Date {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  result.setHours(0, 0, 0, 0)
  return result
}

function formatAcademicWeekLabel(start: Date, end: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${pad(start.getDate())}.${pad(start.getMonth() + 1)} - ${pad(end.getDate())}.${pad(end.getMonth() + 1)}`
}

export function getConsultationAcademicYearStart(referenceDate = new Date()): number {
  const month = referenceDate.getMonth()
  const year = referenceDate.getFullYear()

  // С августа уже показываем следующий учебный год (сентябрь — июль).
  if (month >= 7) {
    return year
  }

  return year - 1
}

export function buildConsultationAcademicWeeks(referenceDate = new Date()): AcademicWeek[] {
  const academicStartYear = getConsultationAcademicYearStart(referenceDate)
  const firstWeekStart = getMondayWeekStart(new Date(academicStartYear, 8, 1))
  const lastDayOfJuly = new Date(academicStartYear + 1, 6, 31)
  const lastWeekStart = getMondayWeekStart(lastDayOfJuly)

  const weeks: AcademicWeek[] = []
  const current = new Date(firstWeekStart)

  while (current <= lastWeekStart) {
    const end = new Date(current)
    end.setDate(end.getDate() + 6)

    weeks.push({
      label: formatAcademicWeekLabel(current, end),
      start: new Date(current),
      end: new Date(end),
    })

    current.setDate(current.getDate() + 7)
  }

  return weeks
}

export function getWeekStartFromLabel(
  weekLabel: string,
  academicStartYear = getConsultationAcademicYearStart(),
): string | null {
  const startPart = weekLabel.split(' - ')[0]?.trim()
  if (!startPart) {
    return null
  }

  const parts = startPart.split('.')
  const day = parts[0]
  const month = parts[1]

  if (!day || !month) {
    return null
  }

  const monthNumber = Number(month)
  const year = monthNumber >= 9 ? academicStartYear : academicStartYear + 1

  return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`
}

export const SPECIAL_LESSON_TYPE = 'Особое' as const

export const KR_DEFENSE_LESSON_TYPE = 'Защита КР' as const

export const KP_DEFENSE_LESSON_TYPE = 'Защита КП' as const

export const LESSON_TYPE_OPTIONS = [
  'Лекция',
  'Практика',
  'Лабораторная',
  'Зачёт',
  KR_DEFENSE_LESSON_TYPE,
  KP_DEFENSE_LESSON_TYPE,
  SPECIAL_LESSON_TYPE,
] as const

export const ROMAN_BUILDING = 'Римская' as const
export const DISTANCE_BUILDING = 'Дистанционное' as const
export const DISTANCE_ROOM_LABEL = 'дист. форм. об.' as const
export const SPORTS_HALL_BUILDING = 'Спортивный зал' as const
export const SPORTS_HALL_ROOM_LABEL = 'С/З, Т/З' as const

export const BUILDING_OPTIONS = [
  'УК1',
  'УК3',
  'УК5',
  SPORTS_HALL_BUILDING,
  DISTANCE_BUILDING,
] as const

export const CONSULTATION_DISTANCE_BUILDING = 'Дистант' as const

export const CONSULTATION_BUILDING_OPTIONS = [
  'УК1',
  'УК3',
  'УК5',
  SPORTS_HALL_BUILDING,
  CONSULTATION_DISTANCE_BUILDING,
] as const

export function isConsultationDistanceBuilding(building: string): boolean {
  return building === CONSULTATION_DISTANCE_BUILDING || building === DISTANCE_BUILDING
}

export function normalizeConsultationBuilding(building: string): string {
  if (isConsultationDistanceBuilding(building)) {
    return CONSULTATION_DISTANCE_BUILDING
  }

  if (building === 'УК4') {
    return 'УК3'
  }

  return building
}

export function isDistanceRoomLabel(room: string): boolean {
  return /дист/i.test(room.trim())
}

export function isSportsHallRoomLabel(room: string): boolean {
  const normalized = room.trim().toUpperCase()

  return normalized === SPORTS_HALL_ROOM_LABEL.toUpperCase()
    || normalized.includes('С/З')
    || normalized.includes('Т/З')
}

export function isAutoFilledRoomBuilding(building: string): boolean {
  return isConsultationDistanceBuilding(building) || building === SPORTS_HALL_BUILDING
}

export function getAutoFilledRoomLabel(building: string): string | null {
  if (isConsultationDistanceBuilding(building)) {
    return DISTANCE_ROOM_LABEL
  }

  if (building === SPORTS_HALL_BUILDING) {
    return SPORTS_HALL_ROOM_LABEL
  }

  return null
}

export function isRomanRoomUk5(room: string): boolean {
  const normalized = room.trim().toUpperCase()

  return normalized.startsWith('III')
    || normalized.startsWith('IV')
    || normalized.startsWith('I ')
    || normalized.startsWith('1 ')
    || normalized.startsWith('3 ')
    || normalized.startsWith('4 ')
}

export function isRomanRoomUk3(room: string): boolean {
  const normalized = room.trim().toUpperCase()

  return normalized.startsWith('VIII')
    || normalized.startsWith('VII')
    || normalized.startsWith('VI ')
    || normalized.startsWith('V ')
    || normalized.startsWith('II ')
    || normalized.startsWith('8 ')
    || normalized.startsWith('7 ')
    || normalized.startsWith('6 ')
    || normalized.startsWith('5 ')
    || normalized.startsWith('2 ')
}

export function isRomanRoom(room: string): boolean {
  const normalized = room.trim().toUpperCase()

  if (!normalized || normalized.includes('УК')) {
    return false
  }

  return isRomanRoomUk3(normalized) || isRomanRoomUk5(normalized)
}

export type RomanRoomKey = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII'

export interface RomanRoomInfo {
  building: 'УК3' | 'УК5'
  location: string
}

/** Подсказки по расположению римских аудиторий.*/
export const ROMAN_ROOM_HINTS: Record<RomanRoomKey, RomanRoomInfo> = {
  I: { building: 'УК5', location: 'Она находится после общаги' },
  II: { building: 'УК3', location: 'Она находится в 3-м корпусе (после библиотеки), на первом этаже. ' +
        'Чтобы дойти до неё, вам нужно спуститься по первой лестнице со второго этажа на первый, повернуть налево и идти до конца коридора. ' +
        'Затем поверните направо: там будет дверь, за ней — ещё один коридор, в конце которого и находится аудитория' },
  III: { building: 'УК5', location: 'Она находится в 5-м корпусе (там находится деканат). ' +
        'Чтобы дойти до неё, идите со стороны первого корпуса по коридору. ' +
        'Не доходя до холла, поверните в коридор слева. ' +
        'Войдите в дверь, поверните направо и по левой стороне увидите помещение, в котором и находится аудитория' },
  IV: { building: 'УК5', location: 'Она находится в 5-м корпусе (до библиотеки и там находится приемная комиссия). ' +
        'Чтобы дойти до неё, идите со стороны первого корпуса по коридору. ' +
        'Не доходя до холла, поверните в коридор слева. ' +
        'Войдите в дверь, поверните направо и по левой стороне увидите помещение, в котором и находится аудитория' },
  V: { building: 'УК3', location: 'Она находится в 3-м корпусе (после библиотеки), на четвертом этаже.' },
  VI: { building: 'УК3', location: 'Она находится в 3-м корпусе (после библиотеки), на четвертом этаже.' },
  VII: { building: 'УК3', location: 'Она находится в 3-м корпусе (после библиотеки), на третьем этаже.' },
  VIII: { building: 'УК3', location: 'Она находится в 3-м корпусе (после библиотеки), на третьем этаже.' },
}

const ROMAN_ROOM_KEYS: RomanRoomKey[] = ['VIII', 'VII', 'III', 'IV', 'VI', 'II', 'V', 'I']

const ROMAN_NUMERIC_ALIASES: Record<string, RomanRoomKey> = {
  '1': 'I',
  '2': 'II',
  '3': 'III',
  '4': 'IV',
  '5': 'V',
  '6': 'VI',
  '7': 'VII',
  '8': 'VIII',
}

export function resolveRomanRoomKey(room: string): RomanRoomKey | null {
  const { room: roomPart } = parseRoomForForm(room)
  const normalized = roomPart.trim().toUpperCase()

  if (!normalized) {
    return null
  }

  const isRoman = isRomanRoomUk3(normalized) || isRomanRoomUk5(normalized)

  if (!isRoman) {
    return null
  }

  for (const key of ROMAN_ROOM_KEYS) {
    if (normalized === key || normalized.startsWith(`${key} `)) {
      return key
    }
  }

  const numericMatch = normalized.match(/^(\d+)/)
  const numericKey = numericMatch?.[1]

  if (numericKey) {
    return ROMAN_NUMERIC_ALIASES[numericKey] ?? null
  }

  return null
}

export function getRomanRoomHint(room: string): (RomanRoomInfo & { key: RomanRoomKey }) | null {
  const key = resolveRomanRoomKey(room)

  if (!key) {
    return null
  }

  return { key, ...ROMAN_ROOM_HINTS[key] }
}

function isKrDefenseLessonType(value: string): boolean {
  return value.includes('защ') && value.includes('кр')
}

export function isSubgroupApplicableLessonType(type: string): boolean {
  const value = type.trim().toLowerCase()

  return value.includes('практ')
    || value.includes('лаб')
    || value.includes('зач')
    || isKrDefenseLessonType(value)
}

export function isSpecialLessonType(type: string): boolean {
  const value = type.trim().toLowerCase()

  if (!value) {
    return false
  }

  return value === 'особое'
    || value === 'особенное'
    || value.includes('куратор')
    || value.includes('субботник')
    || value.includes('суббот')
}

export function isLectureLessonType(type: string): boolean {
  return type.trim().toLowerCase().includes('лек')
}

export function isMultiGroupLessonType(type: string): boolean {
  return isLectureLessonType(type) || isSpecialLessonType(type)
}

export function parseGroupNames(raw: string): string[] {
  const seen = new Set<string>()
  const groupNames: string[] = []

  for (const part of raw.split(/[,;]/)) {
    const trimmed = part.trim()

    if (!trimmed) {
      continue
    }

    const normalized = trimmed.toUpperCase()

    if (seen.has(normalized)) {
      continue
    }

    seen.add(normalized)
    groupNames.push(trimmed)
  }

  return groupNames
}

export function resolveLessonGroups(
  lesson: Pick<DisplayScheduleItem, 'group' | 'linkedGroups'>,
): string[] {
  if (lesson.linkedGroups?.length) {
    return [...lesson.linkedGroups]
  }

  return lesson.group ? [lesson.group] : []
}

export function normalizeLessonTypeForForm(type: string): string {
  if (isSpecialLessonType(type)) {
    return SPECIAL_LESSON_TYPE
  }

  const value = type.toLowerCase()

  if (value.includes('лек')) return 'Лекция'
  if (value.includes('практ')) return 'Практика'
  if (value.includes('лаб')) return 'Лабораторная'
  if (isKrDefenseLessonType(value)) return KR_DEFENSE_LESSON_TYPE
  if (value.includes('зач')) return 'Зачёт'

  return type
}

export function getLessonGridClass(type: string): string {
  if (isSpecialLessonType(type)) {
    return 'special'
  }

  const lessonType = type.toLowerCase()

  if (lessonType.includes('лек')) return 'lecture'
  if (lessonType.includes('практ')) return 'practice'
  if (lessonType.includes('лаб')) return 'lab'
  if (lessonType.includes('зач') || lessonType.includes('защ')) return 'exam'

  return ''
}

export function getLessonTypeLabel(type: string, isConsultation = false): string {
  if (isConsultation) {
    const lessonType = type.toLowerCase()

    if (lessonType.includes('онлайн')) return 'Онлайн-консультация'
    return 'Консультация'
  }

  if (isSpecialLessonType(type)) {
    return SPECIAL_LESSON_TYPE
  }

  return normalizeLessonTypeForForm(type)
}

export function parseRoomForForm(
  room: string,
  forConsultation = false,
): { building: string; room: string } {
  const normalized = room.trim()

  if (!normalized) {
    return { building: '', room: '' }
  }

  if (isDistanceRoomLabel(normalized)) {
    return {
      building: forConsultation ? CONSULTATION_DISTANCE_BUILDING : DISTANCE_BUILDING,
      room: DISTANCE_ROOM_LABEL,
    }
  }

  if (isSportsHallRoomLabel(normalized)) {
    return { building: SPORTS_HALL_BUILDING, room: SPORTS_HALL_ROOM_LABEL }
  }

  const building = getBuildingFromRoom(normalized)

  if (!building) {
    return { building: '', room: normalized }
  }

  const normalizedBuilding = forConsultation
    ? normalizeConsultationBuilding(building)
    : building

  const roomNumber = normalized
    .replace(new RegExp(building.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '')
    .trim()

  return {
    building: normalizedBuilding,
    room: roomNumber || normalized,
  }
}

export function formatRoomForApi(building: string, room: string): string | undefined {
  const roomNumber = room.trim()
  const buildingCode = building.trim()

  if (isConsultationDistanceBuilding(buildingCode) || isDistanceRoomLabel(roomNumber)) {
    return DISTANCE_ROOM_LABEL
  }

  if (buildingCode === SPORTS_HALL_BUILDING || isSportsHallRoomLabel(roomNumber)) {
    return SPORTS_HALL_ROOM_LABEL
  }

  if (!roomNumber) {
    return undefined
  }

  if (isRomanRoom(roomNumber)) {
    return roomNumber
  }

  if (buildingCode) {
    return `${roomNumber} ${buildingCode}`
  }

  return roomNumber
}
