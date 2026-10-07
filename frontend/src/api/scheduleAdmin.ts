import api from '@/api/client'
import type { DisplayScheduleItem } from '@/views/schedule/scheduleOptions'
import axios from 'axios'
import { useConfirmDialogStore } from '@/stores/confirmDialog'

export interface CreateScheduleItemPayload {
  groupName: string
  weekStart: string
  dayOfWeek: number
  startTime: string
  endTime: string
  subject: string
  lessonType: string
  teacherName?: string
  room?: string
  subgroup?: number
  comment?: string
}

export interface UpdateScheduleItemPayload {
  subject?: string
  lessonType?: string
  teacherName?: string
  room?: string
  dayOfWeek?: number
  startTime?: string
  endTime?: string
  weekStart?: string
  subgroup?: number | null
  comment?: string
}

export interface ScheduleTransferRecommendation {
  weekStart: string
  dayOfWeek: number
  day: string
  startTime: string
  endTime: string
  label: string
  reasons: string[]
}

export interface ScheduleItemPreviewPayload {
  subject?: string
  lessonType?: string
  teacherName?: string
  room?: string
  dayOfWeek?: number
  startTime?: string
  endTime?: string
  weekStart?: string
  subgroup?: number | null
}

export interface ScheduleItemPreviewResult {
  conflicts: string[]
  recommendations: ScheduleTransferRecommendation[]
}

export async function fetchScheduleItemLinkedGroups(id: number): Promise<string[]> {
  const response = await api.get<string[]>(
    `/education-department/schedules/items/${id}/linked-groups`,
  )

  return response.data
}

export async function createScheduleItem(
  payload: CreateScheduleItemPayload,
): Promise<DisplayScheduleItem> {
  const response = await api.post<DisplayScheduleItem>(
    '/education-department/schedules/items',
    payload,
  )
  return response.data
}

export async function updateScheduleItem(
  id: number,
  payload: UpdateScheduleItemPayload,
): Promise<DisplayScheduleItem> {
  const response = await api.patch<DisplayScheduleItem>(
    `/education-department/schedules/items/${id}`,
    payload,
  )
  return response.data
}

export async function fetchScheduleTransferRecommendations(
  id: number,
  weekStart?: string | null,
): Promise<ScheduleTransferRecommendation[]> {
  const response = await api.get<ScheduleTransferRecommendation[]>(
    `/education-department/schedules/items/${id}/recommendations`,
    {
      params: weekStart ? { weekStart } : undefined,
    },
  )
  return response.data
}

export async function previewScheduleItemChanges(
  id: number,
  payload: ScheduleItemPreviewPayload,
): Promise<ScheduleItemPreviewResult> {
  const response = await api.post<ScheduleItemPreviewResult>(
    `/education-department/schedules/items/${id}/preview`,
    payload,
  )

  return response.data
}

export async function disableScheduleItem(id: number): Promise<void> {
  await api.patch(`/education-department/schedules/items/${id}/disable`)
}

export async function cancelScheduleItem(id: number): Promise<void> {
  await api.delete(`/education-department/schedules/items/${id}`)
}

export async function updatePreholidayDay(
  date: string,
  isPreholiday: boolean,
): Promise<string[]> {
  const response = await api.patch<string[]>(
    '/education-department/schedules/preholiday-days',
    { date, isPreholiday },
  )

  return response.data
}

type ScheduleAdminErrorPayload = {
  message?: unknown
  errors?: string[]
}

function readScheduleAdminErrorPayload(error: unknown): {
  message: string
  details?: string[]
} {
  if (!axios.isAxiosError(error)) {
    return { message: 'Не удалось выполнить операцию' }
  }

  const data = error.response?.data

  if (!data || typeof data !== 'object') {
    return { message: 'Не удалось выполнить операцию' }
  }

  const payload = data as ScheduleAdminErrorPayload

  if (
    payload.message
    && typeof payload.message === 'object'
    && !Array.isArray(payload.message)
  ) {
    const nested = payload.message as ScheduleAdminErrorPayload

    if (Array.isArray(nested.errors) && nested.errors.length > 0) {
      return {
        message: typeof nested.message === 'string'
          ? nested.message
          : 'Не удалось выполнить операцию',
        details: nested.errors,
      }
    }

    if (typeof nested.message === 'string') {
      return { message: nested.message }
    }
  }

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    return {
      message: typeof payload.message === 'string'
        ? payload.message
        : 'Не удалось выполнить операцию',
      details: payload.errors,
    }
  }

  if (typeof payload.message === 'string') {
    return { message: payload.message }
  }

  return { message: 'Не удалось выполнить операцию' }
}

export function getScheduleAdminErrorMessage(error: unknown): string {
  const { message, details } = readScheduleAdminErrorPayload(error)

  if (details?.length) {
    return [message, ...details].join('\n')
  }

  return message
}

export async function showScheduleAdminError(error: unknown): Promise<void> {
  const { message, details } = readScheduleAdminErrorPayload(error)

  await useConfirmDialogStore().alert({
    title: details?.length ? 'Конфликт в расписании' : 'Ошибка',
    message,
    details,
  })
}
