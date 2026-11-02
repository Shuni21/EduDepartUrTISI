import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUser,
  fetchAdminUsers,
  updateAdminUser,
  type AdminUser,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '@/api/admin'

export const useUsersStore = defineStore('users', () => {
  const users = ref<AdminUser[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function loadUsers() {
    isLoading.value = true
    error.value = null

    try {
      users.value = await fetchAdminUsers()
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Не удалось загрузить пользователей'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function addUser(payload: CreateUserPayload): Promise<AdminUser> {
    const createdUser = await createAdminUser(payload)
    users.value = [...users.value, createdUser]
    return createdUser
  }

  async function removeUser(id: number): Promise<void> {
    await deleteAdminUser(id)
    users.value = users.value.filter((user) => user.id !== id)
  }

  async function getUser(id: number): Promise<AdminUser> {
    return fetchAdminUser(id)
  }

  async function editUser(
      id: number,
      payload: UpdateUserPayload,
  ): Promise<AdminUser> {
    const updatedUser = await updateAdminUser(id, payload)
    users.value = users.value.map((user) =>
        user.id === id ? updatedUser : user,
    )
    return updatedUser
  }

  return {
    users,
    isLoading,
    error,
    loadUsers,
    addUser,
    removeUser,
    getUser,
    editUser,
  }
})
