"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLectureScheduleItem = isLectureScheduleItem;
exports.isSharedMultiGroupLessonItem = isSharedMultiGroupLessonItem;
exports.areLinkedSharedLessonItems = areLinkedSharedLessonItems;
exports.areLinkedLectureItems = areLinkedLectureItems;
exports.findLinkedLectureItemsInList = findLinkedLectureItemsInList;
exports.extractLinkedGroupNames = extractLinkedGroupNames;
exports.buildLinkedGroupsMap = buildLinkedGroupsMap;
const lesson_type_entity_1 = require("./entities/lesson-type.entity");
function isLectureScheduleItem(item) {
    return item.lessonType?.code === lesson_type_entity_1.LessonTypeCode.LECTURE;
}
function isSharedMultiGroupLessonItem(item) {
    return item.lessonType?.code === lesson_type_entity_1.LessonTypeCode.LECTURE
        || item.lessonType?.code === lesson_type_entity_1.LessonTypeCode.SPECIAL;
}
function areLinkedSharedLessonItems(first, second) {
    if (first.id === second.id) {
        return true;
    }
    if (!isSharedMultiGroupLessonItem(first) || !isSharedMultiGroupLessonItem(second)) {
        return false;
    }
    if (first.lessonType?.code !== second.lessonType?.code) {
        return false;
    }
    if (first.isDisabled || second.isDisabled) {
        return false;
    }
    const firstGroupName = first.schedule?.group?.name;
    const secondGroupName = second.schedule?.group?.name;
    if (!firstGroupName || !secondGroupName) {
        return false;
    }
    if (String(first.weekStart) !== String(second.weekStart)) {
        return false;
    }
    if (first.dayOfWeek !== second.dayOfWeek) {
        return false;
    }
    if (String(first.startTime) !== String(second.startTime)) {
        return false;
    }
    if (String(first.endTime) !== String(second.endTime)) {
        return false;
    }
    if (first.subjectId !== second.subjectId) {
        return false;
    }
    if (first.subgroupId !== second.subgroupId) {
        return false;
    }
    if (first.teacherId !== second.teacherId) {
        return false;
    }
    if (first.legacyTeacherName !== second.legacyTeacherName) {
        return false;
    }
    if (first.roomId !== second.roomId) {
        return false;
    }
    return true;
}
function areLinkedLectureItems(first, second) {
    return areLinkedSharedLessonItems(first, second);
}
function findLinkedLectureItemsInList(item, candidates) {
    if (!isSharedMultiGroupLessonItem(item)) {
        return [item];
    }
    const linkedItems = candidates.filter((candidate) => areLinkedSharedLessonItems(item, candidate));
    return linkedItems.length > 0 ? linkedItems : [item];
}
function extractLinkedGroupNames(items) {
    return items
        .map((entry) => entry.schedule?.group?.name ?? '')
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right, 'ru', { sensitivity: 'base', numeric: true }));
}
function buildLinkedGroupsMap(items) {
    const linkedGroupsMap = new Map();
    const activeItems = items.filter((item) => !item.isDisabled);
    for (const item of activeItems) {
        if (!isSharedMultiGroupLessonItem(item) || linkedGroupsMap.has(item.id)) {
            continue;
        }
        const linkedItems = findLinkedLectureItemsInList(item, activeItems);
        const groupNames = extractLinkedGroupNames(linkedItems);
        for (const linkedItem of linkedItems) {
            linkedGroupsMap.set(linkedItem.id, groupNames);
        }
    }
    return linkedGroupsMap;
}
//# sourceMappingURL=linked-lecture.utils.js.map