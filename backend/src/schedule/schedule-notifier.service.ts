import { Injectable } from '@nestjs/common'

import { ScheduleGateway } from './schedule.gateway'
import type { ScheduleChangedPayload, ScheduleTarget } from './schedule.gateway'
import { ScheduleItem } from './entities/schedule-item.entity'
import { formatRoomLabel, resolveTeacherName } from './schedule-item.mapper'
import { isSharedMultiGroupLessonItem } from './linked-lecture.utils'
import { LinkedLessonService } from './linked-lesson.service'

@Injectable()
export class ScheduleNotifierService {
    constructor(
        private readonly scheduleGateway: ScheduleGateway,
        private readonly linkedLessonService: LinkedLessonService,
    ) {}

    getTargetsForItems(items: ScheduleItem[]): ScheduleTarget[] {
        const targets: ScheduleTarget[] = []

        for (const item of items) {
            const groupName = item.schedule?.group?.name?.trim()
            const teacherName = resolveTeacherName(item).trim()
            const roomName = formatRoomLabel(item.room).trim()

            if (groupName) {
                targets.push({ type: 'group', identity: groupName })
            }
            if (teacherName) {
                targets.push({ type: 'teacher', identity: teacherName })
            }
            if (roomName) {
                targets.push({ type: 'room', identity: roomName })
            }
        }

        return targets
    }

    async getTargetsForItemsAndLinkedLessons(items: ScheduleItem[]): Promise<ScheduleTarget[]> {
        const itemsById = new Map<number, ScheduleItem>()
        const linkedItemsBySlot = new Map<string, ScheduleItem[]>()

        for (const item of items) {
            if (!isSharedMultiGroupLessonItem(item)) {
                itemsById.set(item.id, item)
                continue
            }

            const slotKey = [
                item.weekStart,
                item.dayOfWeek,
                item.startTime,
                item.endTime,
                item.subjectId,
                item.lessonTypeId,
                item.teacherId ?? '',
                item.legacyTeacherName ?? '',
                item.roomId ?? '',
                item.subgroupId ?? '',
            ].join('|')
            let linkedItems = linkedItemsBySlot.get(slotKey)

            if (!linkedItems) {
                linkedItems = await this.linkedLessonService.findLinkedSharedLessonItems(item)
                linkedItemsBySlot.set(slotKey, linkedItems)
            }

            for (const linkedItem of linkedItems) {
                itemsById.set(linkedItem.id, linkedItem)
            }
        }

        return this.getTargetsForItems(Array.from(itemsById.values()))
    }

    notifyScheduleChanged(
        reason: ScheduleChangedPayload['reason'],
        targets: ScheduleTarget[],
    ): void {
        this.scheduleGateway.broadcastScheduleChanged({ reason }, targets)
    }

    notifyPreholidayDaysUpdated(preholidayDays: string[]): void {
        this.scheduleGateway.broadcastPreholidayDaysUpdated(preholidayDays)
        this.scheduleGateway.broadcastGlobalScheduleChanged({ reason: 'preholiday-updated' })
    }
}