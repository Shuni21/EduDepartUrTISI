<script setup lang="ts">
import { computed, ref, watch } from 'vue'

export interface PreviewLesson {
  index: number
  dayOfWeek: number
  dayLabel: string
  startTime: string
  endTime: string
  subject: string
  teacherName?: string
  room?: string
  subgroup?: number | null
  hasConflict?: boolean
  conflictReason?: string
}

const props = defineProps<{
  open: boolean
  lessons: PreviewLesson[]
  groupName: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm', selectedIndexes: number[]): void
  (e: 'cancel'): void
}>()

/** Только пары с конфликтом — их показываем в списке */
const conflictLessons = computed(() =>
    props.lessons.filter((l) => l.hasConflict),
)

/** Остальные уйдут в загрузку автоматически */
const nonConflictIndexes = computed(() =>
    props.lessons.filter((l) => !l.hasConflict).map((l) => l.index),
)

const selected = ref<Set<number>>(new Set())

watch(
    () => props.open,
    (open) => {
      if (open) {
        // по умолчанию все конфликтующие выбраны
        selected.value = new Set(conflictLessons.value.map((l) => l.index))
      } else {
        selected.value = new Set()
      }
    },
)

const allSelected = computed(
    () =>
        conflictLessons.value.length > 0
        && selected.value.size === conflictLessons.value.length,
)

function toggleAll() {
  if (allSelected.value) {
    selected.value = new Set()
  } else {
    selected.value = new Set(conflictLessons.value.map((l) => l.index))
  }
}

function toggleOne(index: number) {
  const next = new Set(selected.value)
  if (next.has(index)) {
    next.delete(index)
  } else {
    next.add(index)
  }
  selected.value = next
}

function splitConflictReasons(reason: string): string[] {
  return [...new Set(
    reason
      .split(/;\s*/)
      .map((item) => item.trim())
      .filter(Boolean),
  )]
}

function onConfirm() {
  // безконфликтные + выбранные конфликтные
  const indexes = [
    ...nonConflictIndexes.value,
    ...Array.from(selected.value),
  ]
  emit('confirm', indexes)
  emit('update:open', false)
}

function onCancel() {
  emit('cancel')
  emit('update:open', false)
}
</script>

<template>
  <div v-if="open" class="dialog-overlay" @click.self="onCancel">
    <div class="dialog">
      <h3 class="dialog-title">
        Конфликтующие пары
        <span class="group-name">({{ groupName }})</span>
      </h3>

      <p class="hint">
        Остальные пары без конфликтов загрузятся автоматически.
        Здесь можно снять лишние.
      </p>

      <div class="toolbar">
        <button type="button" class="btn-link" @click="toggleAll">
          {{ allSelected ? 'Снять все' : 'Выбрать все' }}
        </button>
        <span class="count">
          Конфликтов выбрано: {{ selected.size }} из {{ conflictLessons.length }}
        </span>
      </div>

      <div class="lessons-list">
        <label
            v-for="lesson in conflictLessons"
            :key="lesson.index"
            class="lesson-row conflict"
        >
          <input
              type="checkbox"
              :checked="selected.has(lesson.index)"
              @change="toggleOne(lesson.index)"
          />
          <div class="lesson-info">
            <div class="main">
              <strong>{{ lesson.dayLabel }}</strong>
              {{ lesson.startTime }}–{{ lesson.endTime }}
              · {{ lesson.subject }}
            </div>
            <div class="meta">
              <span v-if="lesson.teacherName">{{ lesson.teacherName }}</span>
              <span v-if="lesson.room"> · {{ lesson.room }}</span>
              <span v-if="lesson.subgroup"> · подгр. {{ lesson.subgroup }}</span>
            </div>
            <div v-if="lesson.conflictReason" class="conflict-reason">
              <div
                v-for="reason in splitConflictReasons(lesson.conflictReason)"
                :key="reason"
                class="conflict-reason-item"
              >
                ⚠ {{ reason }}
              </div>
            </div>
          </div>
        </label>
      </div>

      <div class="actions">
        <button type="button" class="btn secondary" @click="onCancel">
          Отмена
        </button>
        <button
            type="button"
            class="btn primary"
            @click="onConfirm"
        >
          Загрузить
          ({{ nonConflictIndexes.length + selected.size }})
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.dialog {
  background: var(--color-background, #fff);
  border-radius: 12px;
  width: min(720px, 100%);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.dialog-title {
  margin: 0;
  padding: 16px 20px 4px;
  font-size: 1.15rem;
}

.group-name {
  font-weight: 400;
  opacity: 0.7;
  font-size: 0.95em;
}

.hint {
  margin: 0;
  padding: 0 20px 8px;
  font-size: 0.85rem;
  opacity: 0.75;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px 8px;
}

.btn-link {
  background: none;
  border: none;
  color: var(--color-primary, #2563eb);
  cursor: pointer;
  font-size: 0.9rem;
}

.count {
  font-size: 0.9rem;
  opacity: 0.75;
}

.lessons-list {
  overflow-y: auto;
  padding: 0 12px 12px;
  flex: 1;
}

.lesson-row {
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
}

.lesson-row:hover {
  background: rgba(0, 0, 0, 0.04);
}

.lesson-row.conflict {
  background: #fff7ed;
  border-color: #fdba74;
}

.lesson-info {
  flex: 1;
  min-width: 0;
}

.main {
  font-size: 0.95rem;
}

.meta {
  font-size: 0.85rem;
  opacity: 0.75;
  margin-top: 2px;
}

.conflict-reason {
  font-size: 0.8rem;
  color: #c2410c;
  margin-top: 4px;
}

.conflict-reason-item + .conflict-reason-item {
  margin-top: 4px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
}

.btn.secondary {
  background: #c43636;
  color: #fff;
}

.btn.secondary:hover {
  background: #a82e2e;
}

.btn.primary {
  background: var(--color-primary, #2563eb);
  color: #fff;
}

:global(.dark) .dialog {
  color: #f0f4f7;
}

:global(.dark) .meta,
:global(.dark) .count,
:global(.dark) .group-name {
  color: #c3ccd6;
  opacity: 1;
}

:global(.dark) .hint {
  color: #c3ccd6;
  opacity: 1;
}

:global(.dark) .actions {
  border-top-color: rgba(255, 255, 255, 0.12);
}
</style>