import { User } from '../users/entities/user.entity';

import { Room } from './entities/room.entity';
import { ScheduleItem } from './entities/schedule-item.entity';
import { ScheduleDisplayLesson } from './schedule-display.service';
import { ScheduleLessonSlot } from './parser/schedule-conflict.validator';
import {
    normalizeTime,
    normalizeWeekStart,
} from './parser/schedule-slot.utils';
import { formatRomanRoomLabel } from './parser/roman-room.utils';

const DAY_LABELS: Record<number, string> = {
    1: 'ПН',
    2: 'ВТ',
    3: 'СР',
    4: 'ЧТ',
    5: 'ПТ',
    6: 'СБ',
    7: 'ВС',
};

export function formatTeacherName(user: User): string {
    const nameInitial = user.name?.charAt(0) ?? '';
    const patronymicInitial = user.patronymic?.charAt(0) ?? '';

    return `${user.surname} ${nameInitial}.${patronymicInitial}.`.trim();
}

export function formatRoomLabel(room: Room | null): string {
    if (!room) {
        return '';
    }

    if (room.isOnline) {
        return 'дист. форм. об.';
    }

    if (room.name?.trim()) {
        return formatRomanRoomLabel(room.name) ?? room.name.trim();
    }

    const rawLabel = room.building
        ? `${room.number} ${room.building}`.trim()
        : room.number;

    return formatRomanRoomLabel(rawLabel) ?? rawLabel;
}

export function resolveTeacherName(item: ScheduleItem): string {
    if (item.teacher) {
        return formatTeacherName(item.teacher);
    }

    return item.legacyTeacherName?.trim() ?? '';
}

export function formatTime(value: string): string {
    return value.slice(0, 5);
}

export function mapItemToDisplayLesson(
    item: ScheduleItem,
    linkedGroups?: string[],
): ScheduleDisplayLesson {
    const groupName = item.schedule?.group?.name ?? '';
    const resolvedLinkedGroups = linkedGroups?.length
        ? linkedGroups
        : (groupName ? [groupName] : []);

    return {
        id: item.id,
        day: DAY_LABELS[item.dayOfWeek] ?? '',
        startTime: formatTime(item.startTime),
        endTime: formatTime(item.endTime),
        subject: item.subject.name,
        teacher: resolveTeacherName(item),
        type: item.lessonType.name,
        room: formatRoomLabel(item.room),
        group: groupName,
        linkedGroups: resolvedLinkedGroups,
        subgroup: item.subgroup?.number ?? null,
        isSameCellParallel: item.isSameCellParallel,
        comment: item.comment,
        weekStart: normalizeWeekStart(String(item.weekStart)),
    };
}

export function mapItemToLessonSlot(item: ScheduleItem): ScheduleLessonSlot {
    const groupName = item.schedule?.group?.name ?? '';

    return {
        groupName,
        dayOfWeek: item.dayOfWeek,
        startTime: normalizeTime(String(item.startTime)),
        endTime: normalizeTime(String(item.endTime)),
        weekStart: normalizeWeekStart(String(item.weekStart)),
        subgroup: item.subgroup?.number ?? null,
        isDistance: item.room?.isOnline ?? false,
        isSameCellParallel: item.isSameCellParallel,
        isSharedMultiHall: item.room?.isSharedMultiHall ?? false,
        subject: item.subject.name,
        lessonType: item.lessonType.name,
        teacherPosition: item.teacherPosition ?? '',
        teacherName: resolveTeacherName(item),
        room: item.room ? formatRoomLabel(item.room) : null,
    };
}
