"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROMAN_BUILDING = void 0;
exports.normalizeRomanRoomKey = normalizeRomanRoomKey;
exports.formatRomanRoomLabel = formatRomanRoomLabel;
exports.isRomanRoomUk5 = isRomanRoomUk5;
exports.isRomanRoomUk3 = isRomanRoomUk3;
exports.isRomanRoom = isRomanRoom;
exports.getRomanBuilding = getRomanBuilding;
exports.ROMAN_BUILDING = 'Римская';
const ROMAN_NUMBER_BY_DECIMAL = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
    5: 'V',
    6: 'VI',
    7: 'VII',
    8: 'VIII',
};
const DECIMAL_BY_ROMAN = Object.fromEntries(Object.entries(ROMAN_NUMBER_BY_DECIMAL).map(([decimal, roman]) => [roman, Number(decimal)]));
function normalizeRomanRoomValue(value) {
    return value
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[.,;]+$/g, '')
        .toUpperCase();
}
function parseRomanRoomNumber(room) {
    const normalized = normalizeRomanRoomValue(room).replace(/^РИМСКАЯ\s+/, '');
    const match = normalized.match(/^(?:I{1,3}|IV|V|VI|VII|VIII|[1-8])(?=\s|$|[.,;]|\s*(?:АУД|АУДИТОРИЯ|КАБ|КАБИНЕТ))/u);
    if (!match) {
        return null;
    }
    const rawNumber = match[0];
    if (/^\d+$/.test(rawNumber)) {
        return ROMAN_NUMBER_BY_DECIMAL[Number(rawNumber)] ?? null;
    }
    return rawNumber;
}
function normalizeRomanRoomKey(room) {
    if (normalizeRomanRoomValue(room).includes('УК')) {
        return null;
    }
    const romanNumber = parseRomanRoomNumber(room);
    if (!romanNumber) {
        return null;
    }
    const normalizedRoom = normalizeRomanRoomValue(room);
    const withoutPrefix = normalizedRoom.replace(/^РИМСКАЯ\s+/, '');
    if (withoutPrefix.startsWith(romanNumber)) {
        return romanNumber;
    }
    return romanNumber;
}
function formatRomanRoomLabel(room) {
    const romanNumber = normalizeRomanRoomKey(room);
    return romanNumber ? `${romanNumber} римск.` : null;
}
function isRomanRoomUk5(room) {
    const normalized = normalizeRomanRoomValue(room);
    const romanNumber = parseRomanRoomNumber(normalized);
    if (!romanNumber) {
        return false;
    }
    const decimal = DECIMAL_BY_ROMAN[romanNumber] ?? Number.parseInt(romanNumber, 10);
    return decimal === 1 || decimal === 3 || decimal === 4;
}
function isRomanRoomUk3(room) {
    const normalized = normalizeRomanRoomValue(room);
    const romanNumber = parseRomanRoomNumber(normalized);
    if (!romanNumber) {
        return false;
    }
    const decimal = DECIMAL_BY_ROMAN[romanNumber] ?? Number.parseInt(romanNumber, 10);
    return decimal === 2 || decimal === 5 || decimal === 6 || decimal === 7 || decimal === 8;
}
function isRomanRoom(room) {
    const normalized = normalizeRomanRoomValue(room);
    if (!normalized || normalized.includes('УК')) {
        return false;
    }
    return !!parseRomanRoomNumber(normalized);
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