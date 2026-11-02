import api from '@/api/client'
import type { AuthUser, UserRole } from '@/stores/auth'

export type AdminUser = AuthUser & {
  isActive: boolean
}

export type AdminSession = {
  id: number
  userId: number
  login: string
  fullName: string
  role: UserRole
  createdAt: string
}

export type CreateUserPayload = {
  login: string
  password: string
  role: UserRole
  surname: string
  name: string
  patronymic?: string
  group?: string
  educationForm?: string
  course?: number
  department?: string
  departmentId?: number
  position?: string
  cabinet?: string
}

export type UpdateUserPayload = {
  login: string
  password?: string
  role: UserRole
  surname: string
  name: string
  patronymic?: string
  isActive?: boolean
  group?: string
  educationForm?: string
  course?: number
  department?: string
  departmentId?: number
  position?: string
  cabinet?: string
}

export async function fetchAdminUser(id: number): Promise<AdminUser> {
  const response = await api.get<AdminUser>(`/admin/users/${id}`)
  return response.data
}

export async function updateAdminUser(
    id: number,
    payload: UpdateUserPayload,
): Promise<AdminUser> {
  const response = await api.patch<AdminUser>(`/admin/users/${id}`, payload)
  return response.data
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const response = await api.get<AdminUser[]>('/admin/users')
  return response.data
}

export async function createAdminUser(
    payload: CreateUserPayload,
): Promise<AdminUser> {
  const response = await api.post<AdminUser>('/admin/users', payload)
  return response.data
}

export async function deleteAdminUser(id: number): Promise<void> {
  await api.delete(`/admin/users/${id}`)
}

export async function fetchAdminSessions(): Promise<AdminSession[]> {
  const response = await api.get<AdminSession[]>('/admin/sessions')
  return response.data
}

export async function revokeAdminSession(id: number): Promise<void> {
  await api.delete(`/admin/sessions/${id}`)
}
