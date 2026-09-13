"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDirectionCode = extractDirectionCode;
exports.normalizeDirectionTitle = normalizeDirectionTitle;
exports.buildDirectionDisplayName = buildDirectionDisplayName;
exports.buildDirectionStorageCode = buildDirectionStorageCode;
exports.validateDirectionInput = validateDirectionInput;
exports.directionsMatchByIdentity = directionsMatchByIdentity;
const DIRECTION_CODE_PATTERN = /^(\d{2}\.\d{2}\.\d{2})\s+(.+)$/;
function extractDirectionCode(name) {
    const trimmed = name.trim();
    const match = trimmed.match(/^(\d{2}\.\d{2}\.\d{2})/);
    return match ? match[1] : null;
}
function normalizeDirectionTitle(name) {
    return name
        .replace(/^\d{2}\.\d{2}\.\d{2}\s*/, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}
function buildDirectionDisplayName(rawName) {
    const trimmed = rawName.trim();
    const code = extractDirectionCode(trimmed);
    const title = trimmed.replace(/^\d{2}\.\d{2}\.\d{2}\s*/, '').replace(/\s+/g, ' ').trim();
    if (code && title) {
        return `${code} ${title}`;
    }
    return trimmed;
}
function buildDirectionStorageCode(rawName) {
    const code = extractDirectionCode(rawName.trim());
    if (code) {
        return code.replace(/\./g, '_');
    }
    return rawName
        .toLowerCase()
        .replace(/[^a-zа-я0-9]+/gi, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 50) || `direction_${Date.now()}`;
}
function validateDirectionInput(rawName) {
    const trimmed = rawName.trim();
    if (!trimmed) {
        return { valid: false, message: 'Укажите направление' };
    }
    if (!DIRECTION_CODE_PATTERN.test(trimmed)) {
        return {
            valid: false,
            message: 'Формат: код в начале и название через пробел, например 09.03.01 Информатика и вычислительная техника',
        };
    }
    return { valid: true };
}
function directionsMatchByIdentity(leftName, rightName) {
    const leftCode = extractDirectionCode(leftName);
    const rightCode = extractDirectionCode(rightName);
    return Boolean(leftCode && rightCode && leftCode === rightCode);
}
//# sourceMappingURL=direction.utils.js.map