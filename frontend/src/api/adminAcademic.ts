import api from '@/api/client'
import type { UserRole } from '@/stores/auth'

export type AcademicMember = {
  id: number
  login: string
  fullName: string
  role: UserRole
  position: string
  cabinet: string | null
  isActive: boolean
}

export type AcademicDepartment = {
  id: number
  name: string
  shortName: string | null
  type: 'teacher' | 'staff'
  headUserId: number | null
  headFullName: string | null
  members: AcademicMember[]
}

export type AcademicGroup = {
  id: number
  name: string
  educationForm: 'full_time' | 'part_time' | 'distance'
  students: AcademicMember[]
}

export type AcademicStructureOverview = {
  teacherDepartments: AcademicDepartment[]
  staffDepartments: AcademicDepartment[]
  groups: AcademicGroup[]
}

export async function fetchAcademicOverview(): Promise<AcademicStructureOverview> {
  const response = await api.get<AcademicStructureOverview>('/admin/academic/overview')
  return response.data
}

export type CreateGroupPayload = {
  name: string
  educationForm: AcademicGroup['educationForm']
}

export async function createAcademicGroup(
    payload: CreateGroupPayload,
): Promise<AcademicGroup> {
  const response = await api.post<AcademicGroup>(
      '/admin/academic/groups',
      payload,
  )
  return response.data
}

export async function createTeacherDepartment(payload: {
  name: string
  shortName: string
}): Promise<AcademicDepartment> {
  const response = await api.post<AcademicDepartment>(
      '/admin/academic/departments/teacher',
      payload,
  )
  return response.data
}

export async function createStaffDepartment(payload: {
  name: string
}): Promise<AcademicDepartment> {
  const response = await api.post<AcademicDepartment>(
      '/admin/academic/departments/staff',
      payload,
  )
  return response.data
}

export async function deleteAcademicGroup(groupId: number): Promise<void> {
  await api.delete(`/admin/academic/groups/${groupId}`)
}

export async function deleteAcademicDepartment(departmentId: number): Promise<void> {
  await api.delete(`/admin/academic/departments/${departmentId}`)
}

export const educationFormLabels: Record<AcademicGroup['educationForm'], string> = {
  full_time: 'Очная',
  part_time: 'Заочная',
  distance: 'Дистанционная',
}

export const selectableEducationForms: AcademicGroup['educationForm'][] = [
  'full_time',
  'part_time',
]

export const selectableEducationFormOptions = selectableEducationForms.map((value) => ({
  value,
  label: educationFormLabels[value],
}))

export const roleLabels: Record<UserRole, string> = {
  admin: 'Администратор',
  student: 'Студент',
  teacher: 'Преподаватель',
  employee: 'Сотрудник',
}
