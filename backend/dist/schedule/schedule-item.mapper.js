"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTeacherName = formatTeacherName;
exports.formatRoomLabel = formatRoomLabel;
exports.resolveTeacherName = resolveTeacherName;
exports.formatTime = formatTime;
exports.mapItemToDisplayLesson = mapItemToDisplayLesson;
exports.mapItemToLessonSlot = mapItemToLessonSlot;
const schedule_slot_utils_1 = require("./parser/schedule-slot.utils");
const DAY_LABELS = {
    1: 'ПН',
    2: 'ВТ',
    3: 'СР',
    4: 'ЧТ',
    5: 'ПТ',
    6: 'СБ',
    7: 'ВС',
};
function formatTeacherName(user) {
    const nameInitial = user.name?.charAt(0) ?? '';
    const patronymicInitial = user.patronymic?.charAt(0) ?? '';
    return `${user.surname} ${nameInitial}.${patronymicInitial}.`.trim();
}
function formatRoomLabel(room) {
    if (!room) {
        return '';
    }
    if (room.isOnline) {
        return 'дист. форм. об.';
    }
    if (room.name?.trim()) {
        return room.name.trim();
    }
    if (room.building) {
        return `${room.number} ${room.building}`.trim();
    }
    return room.number;
}
function resolveTeacherName(item) {
    if (item.teacher) {
        return formatTeacherName(item.teacher);
    }
    return item.legacyTeacherName?.trim() ?? '';
}
function formatTime(value) {
    return value.slice(0, 5);
}
function mapItemToDisplayLesson(item, linkedGroups) {
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
        weekStart: (0, schedule_slot_utils_1.normalizeWeekStart)(String(item.weekStart)),
    };
}
function mapItemToLessonSlot(item) {
    const groupName = item.schedule?.group?.name ?? '';
    return {
        groupName,
        dayOfWeek: item.dayOfWeek,
        startTime: (0, schedule_slot_utils_1.normalizeTime)(String(item.startTime)),
        endTime: (0, schedule_slot_utils_1.normalizeTime)(String(item.endTime)),
        weekStart: (0, schedule_slot_utils_1.normalizeWeekStart)(String(item.weekStart)),
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
//# sourceMappingURL=schedule-item.mapper.js.map