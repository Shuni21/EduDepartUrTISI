"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROMAN_BUILDING = void 0;
exports.isRomanRoomUk5 = isRomanRoomUk5;
exports.isRomanRoomUk3 = isRomanRoomUk3;
exports.isRomanRoom = isRomanRoom;
exports.getRomanBuilding = getRomanBuilding;
exports.ROMAN_BUILDING = 'Римская';
function isRomanRoomUk5(room) {
    const normalized = room.trim().toUpperCase();
    return normalized.startsWith('III')
        || normalized.startsWith('IV')
        || normalized.startsWith('I ')
        || normalized.startsWith('1 ')
        || normalized.startsWith('3 ')
        || normalized.startsWith('4 ');
}
function isRomanRoomUk3(room) {
    const normalized = room.trim().toUpperCase();
    return normalized.startsWith('VIII')
        || normalized.startsWith('VII')
        || normalized.startsWith('VI ')
        || normalized.startsWith('V ')
        || normalized.startsWith('II ')
        || normalized.startsWith('8 ')
        || normalized.startsWith('7 ')
        || normalized.startsWith('6 ')
        || normalized.startsWith('5 ')
        || normalized.startsWith('2 ');
}
function isRomanRoom(room) {
    const normalized = room.trim().toUpperCase();
    if (!normalized || normalized.includes('УК')) {
        return false;
    }
    return isRomanRoomUk3(normalized) || isRomanRoomUk5(normalized);
}
function getRomanBuilding(room) {
    if (isRomanRoomUk5(room)) {
        return 'УК5';
    }
    if (isRomanRoomUk3(room)) {
        return 'УК3';
    }
    return null;
}
//# sourceMappingURL=roman-room.utils.js.map