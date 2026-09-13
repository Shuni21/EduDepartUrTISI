"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParallelKey = getParallelKey;
exports.areParallelGroups = areParallelGroups;
exports.parseGroupNames = parseGroupNames;
exports.assertParallelGroupSet = assertParallelGroupSet;
exports.extractGroupNameFromTitle = extractGroupNameFromTitle;
function getParallelKey(groupName) {
    const normalized = groupName.trim().toUpperCase();
    const higherMatch = normalized.match(/^([А-ЯA-Z]+)-(\d)/);
    if (higherMatch) {
        return `${higherMatch[1]}-${higherMatch[2]}`;
    }
    const spoMatch = normalized.match(/^(\d{2})\d$/);
    if (spoMatch) {
        return spoMatch[1];
    }
    return null;
}
function areParallelGroups(first, second) {
    const firstKey = getParallelKey(first);
    const secondKey = getParallelKey(second);
    return firstKey !== null && firstKey === secondKey && first !== second;
}
function parseGroupNames(raw) {
    const seen = new Set();
    const groupNames = [];
    for (const part of raw.split(/[,;]/)) {
        const trimmed = part.trim();
        if (!trimmed) {
            continue;
        }
        const normalized = trimmed.toUpperCase();
        if (seen.has(normalized)) {
            continue;
        }
        seen.add(normalized);
        groupNames.push(trimmed);
    }
    return groupNames;
}
function assertParallelGroupSet(groupNames) {
    if (groupNames.length <= 1) {
        return;
    }
    const parallelKeys = groupNames.map((groupName) => getParallelKey(groupName));
    const firstKey = parallelKeys[0];
    if (!firstKey || parallelKeys.some((key) => key !== firstKey)) {
        throw new Error('Группы для лекции должны быть параллельными (например, ИС-21 и ИС-22 или 381 и 382)');
    }
}
function extractGroupNameFromTitle(title) {
    const normalized = title.trim().replace(/\s+/g, ' ');
    const markedNamedGroup = normalized.match(/(?:гр\.?|групп[аы]?)\s*[:№#-]?\s*([А-ЯЁA-Z]{1,8}-\d{1,3}[А-ЯЁA-Zа-яёa-z]?)/i);
    if (markedNamedGroup?.[1]) {
        return markedNamedGroup[1].trim();
    }
    const namedGroup = normalized.match(/(?:^|[^А-ЯЁA-Zа-яёa-z0-9])([А-ЯЁA-Z]{1,8}-\d{1,3}[А-ЯЁA-Zа-яёa-z]?)(?=$|[^А-ЯЁA-Zа-яёa-z0-9])/i);
    if (namedGroup?.[1]) {
        return namedGroup[1].trim();
    }
    const markedNumericGroup = normalized.match(/(?:гр\.?|групп[аы]?)\s*[:№#-]?\s*(\d{3}[А-ЯЁA-Zа-яёa-z]?)(?!\d)/i);
    return markedNumericGroup?.[1]?.trim() ?? null;
}
//# sourceMappingURL=group-parallel.utils.js.map