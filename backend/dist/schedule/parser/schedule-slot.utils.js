"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeWeekStart = normalizeWeekStart;
exports.normalizeTime = normalizeTime;
exports.normalizeRoomValue = normalizeRoomValue;
exports.normalizeRoomListKey = normalizeRoomListKey;
exports.pickPreferredRoomLabel = pickPreferredRoomLabel;
const roman_room_utils_1 = require("./roman-room.utils");
function normalizeWeekStart(value) {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        const [year, month, day] = trimmed.slice(0, 10).split('-');
        return `${day}.${month}.${year}`;
    }
    return trimmed;
}
function normalizeTime(value) {
    return value.trim().slice(0, 5);
}
function normalizeRoomValue(room) {
    const value = room?.trim().toUpperCase();
    return value ? value : null;
}
function normalizeRoomListKey(label) {
    const normalized = label
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\.+$/g, '')
        .toUpperCase();
    return (0, roman_room_utils_1.normalizeRomanRoomKey)(normalized) ?? normalized;
}
function pickPreferredRoomLabel(current, next) {
    const trimmedCurrent = current.trim();
    const trimmedNext = next.trim();
    if (trimmedCurrent.endsWith('.') && !trimmedNext.endsWith('.')) {
        return trimmedNext;
    }
    if (!trimmedCurrent.endsWith('.') && trimmedNext.endsWith('.')) {
        return trimmedCurrent;
    }
    return trimmedCurrent.length >= trimmedNext.length
        ? trimmedCurrent
        : trimmedNext;
}
//# sourceMappingURL=schedule-slot.utils.js.map