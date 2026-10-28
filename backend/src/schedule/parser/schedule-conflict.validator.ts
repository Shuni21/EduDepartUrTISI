import { areParallelGroups } from './group-parallel.utils';
import { isSharedMultiHallRoom, splitPhysicalRoomLabels } from './lesson-cell.parser';
import {
    normalizeRoomValue,
    normalizeTime,
    normalizeWeekStart,
} from './schedule-slot.utils';

export interface ScheduleLessonSlot {
    groupName: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    weekStart: string;
    subgroup: number | null;
    isDistance: boolean;
    isSameCellParallel: boolean;
    isSharedMultiHall?: boolean;
    subject: string;
    lessonType: string;
    teacherPosition: string;
    teacherName: string;
    room: string | null;
}

export interface ScheduleConflict {
    message: string;
    lessonA: ScheduleLessonSlot;
    lessonB: ScheduleLessonSlot;
}

const DAY_LABELS: Record<number, string> = {
    1: 'ПН',
    2: 'ВТ',
    3: 'СР',
    4: 'ЧТ',
    5: 'ПТ',
    6: 'СБ',
    7: 'ВС',
};

function slotKey(lesson: ScheduleLessonSlot): string {
    const subgroup = lesson.subgroup ?? 'all';
    return [
        lesson.groupName,
        lesson.dayOfWeek,
        lesson.startTime,
        lesson.weekStart,
        subgroup,
    ].join('|');
}

function overlapsSameSlot(first: ScheduleLessonSlot, second: ScheduleLessonSlot): boolean {
    return first.dayOfWeek === second.dayOfWeek
        && normalizeTime(first.startTime) === normalizeTime(second.startTime)
        && normalizeWeekStart(first.weekStart) === normalizeWeekStart(second.weekStart);
}

function subgroupsConflict(first: ScheduleLessonSlot, second: ScheduleLessonSlot): boolean {
    if (first.subgroup === null || second.subgroup === null) {
        return true;
    }

    return first.subgroup === second.subgroup;
}

function hasSameRoom(first: ScheduleLessonSlot, second: ScheduleLessonSlot): boolean {
    const firstRooms = new Set(
        splitPhysicalRoomLabels(first.room)
            .map(normalizeRoomValue)
            .filter((room): room is string => room !== null),
    );
    return splitPhysicalRoomLabels(second.room)
        .map(normalizeRoomValue)
        .some((room) => room !== null && firstRooms.has(room));
}

function isSharedHall(first: ScheduleLessonSlot, second: ScheduleLessonSlot): boolean {
    return first.isSharedMultiHall === true
        || second.isSharedMultiHall === true
        || isSharedMultiHallRoom(first.room)
        || isSharedMultiHallRoom(second.room);
}

function formatDayLabel(dayOfWeek: number): string {
    return DAY_LABELS[dayOfWeek] ?? String(dayOfWeek);
}

function formatSameGroupConflict(first: ScheduleLessonSlot, second: ScheduleLessonSlot): string {
    return `Конфликт расписания группы ${first.groupName}: `
        + `${formatDayLabel(first.dayOfWeek)}, ${normalizeTime(first.startTime)}, `
        + `неделя ${normalizeWeekStart(first.weekStart)}. `
        + `Нельзя ставить две пары в одно время без разделения по подгруппам: `
        + `"${first.subject}" (${first.lessonType}) и "${second.subject}" (${second.lessonType})`;
}

function formatCrossGroupConflict(first: ScheduleLessonSlot, second: ScheduleLessonSlot): string {
    return `Конфликт аудитории между группами: ${formatDayLabel(first.dayOfWeek)}, `
        + `${normalizeTime(first.startTime)}, неделя ${normalizeWeekStart(first.weekStart)}, ауд. ${first.room}. `
        + `Группа ${first.groupName}: "${first.subject}" (${first.lessonType}) и `
        + `группа ${second.groupName}: "${second.subject}" (${second.lessonType})`;
}

function formatTeacherConflict(first: ScheduleLessonSlot, second: ScheduleLessonSlot): string {
    return `Конфликт преподавателя: ${first.teacherName}, `
        + `${formatDayLabel(first.dayOfWeek)}, ${normalizeTime(first.startTime)}, `
        + `неделя ${normalizeWeekStart(first.weekStart)}. `
        + `Группа ${first.groupName}: "${first.subject}" (${first.lessonType}) и `
        + `группа ${second.groupName}: "${second.subject}" (${second.lessonType})`;
}

function normalizeTeacherName(name: string): string {
    return name.trim().replace(/\s+/g, ' ').toUpperCase();
}

function hasSameTeacher(first: ScheduleLessonSlot, second: ScheduleLessonSlot): boolean {
    const firstTeacher = normalizeTeacherName(first.teacherName);
    const secondTeacher = normalizeTeacherName(second.teacherName);

    return Boolean(firstTeacher && secondTeacher && firstTeacher === secondTeacher);
}

function isTeacherConflictAllowed(first: ScheduleLessonSlot, second: ScheduleLessonSlot): boolean {
    return first.isDistance !== second.isDistance;
}

export function validateScheduleConflicts(
    lessons: ScheduleLessonSlot[],
    existingLessons: ScheduleLessonSlot[] = [],
): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];
    const allLessons = [...existingLessons, ...lessons];

    for (let i = 0; i < allLessons.length; i += 1) {
        for (let j = i + 1; j < allLessons.length; j += 1) {
            const first = allLessons[i];
            const second = allLessons[j];

            if (!overlapsSameSlot(first, second)) {
                continue;
            }

            if (first.groupName !== second.groupName) {
                if (areParallelGroups(first.groupName, second.groupName)) {
                    continue;
                }

                const sharedHall = !first.isDistance
                    && !second.isDistance
                    && isSharedHall(first, second);

                if (sharedHall) {
                    continue;
                }

                if (hasSameRoom(first, second)) {
                    conflicts.push({
                        message: formatCrossGroupConflict(first, second),
                        lessonA: first,
                        lessonB: second,
                    });
                }

                if (hasSameTeacher(first, second) && !isTeacherConflictAllowed(first, second)) {
                    conflicts.push({
                        message: formatTeacherConflict(first, second),
                        lessonA: first,
                        lessonB: second,
                    });
                }

                continue;
            }

            if (!subgroupsConflict(first, second)) {
                continue;
            }

            if (first.isSameCellParallel && second.isSameCellParallel) {
                continue;
            }

            conflicts.push({
                message: formatSameGroupConflict(first, second),
                lessonA: first,
                lessonB: second,
            });
        }
    }

    const unique = new Map<string, ScheduleConflict>();
    for (const conflict of conflicts) {
        const key = [
            slotKey(conflict.lessonA),
            slotKey(conflict.lessonB),
            conflict.lessonA.subject,
            conflict.lessonB.subject,
        ].sort().join('::');

        if (!unique.has(key)) {
            unique.set(key, conflict);
        }
    }

    return [...unique.values()];
}
