"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isIgnorableLessonCell = isIgnorableLessonCell;
exports.parseLessonCell = parseLessonCell;
exports.isDistanceRoom = isDistanceRoom;
exports.isAuditoriumRoomLabel = isAuditoriumRoomLabel;
exports.isSharedMultiHallRoom = isSharedMultiHallRoom;
exports.splitRoomForSubgroups = splitRoomForSubgroups;
const TEACHER_POSITIONS = [
    'ст. преподаватель',
    'доцент',
    'профессор',
    'преподаватель',
];
const TEACHER_NAME_PATTERN = /([А-ЯЁ][а-яё-]+)([А-ЯЁ]\.[А-ЯЁ]\.?)$/u;
const SUBGROUP_VALUE_PATTERN = '(?:1|2|I{1,2}|Ⅰ|Ⅱ)';
const SUBGROUP_MARKER_PATTERN = '(?:п\\s*[\\\\/]\\s*гр\\.?|подг(?:р(?:упп[аы]?)?)?\\.?|групп[аы]?|гр\\.?)';
function parseSubgroupNumber(value) {
    const normalized = value.trim().toUpperCase();
    if (normalized === '1' || normalized === 'I' || normalized === 'Ⅰ') {
        return 1;
    }
    if (normalized === '2' || normalized === 'II' || normalized === 'Ⅱ') {
        return 2;
    }
    return null;
}
function isKrDefenseLessonType(value) {
    return value.includes('защ') && value.includes('кр');
}
function isSelfStudySpecialDay(value) {
    return /самоподготов/i.test(value);
}
function isIgnorableLessonCell(rawText) {
    if (!rawText) {
        return false;
    }
    const normalized = rawText.replace(/\s+/g, ' ').trim();
    return isSelfStudySpecialDay(normalized);
}
function normalizeLessonType(raw) {
    const value = raw.trim().replace(/;$/, '').toLowerCase();
    if (value.startsWith('лек'))
        return 'Лекция';
    if (value.startsWith('практ'))
        return 'Практика';
    if (value.startsWith('лаб'))
        return 'Лаб. раб.';
    if (isKrDefenseLessonType(value))
        return 'Защита КР';
    if (value.includes('зач'))
        return 'Зачет';
    return raw.trim().replace(/;$/, '');
}
function formatTeacherName(raw) {
    const match = raw.trim().match(TEACHER_NAME_PATTERN);
    if (!match) {
        return raw.trim();
    }
    return `${match[1]} ${match[2]}`;
}
function isFullLessonSegment(segment) {
    if (/^\d{1,2}:\d{2}(?:\s|$)/u.test(segment)) {
        return false;
    }
    return segment.includes(';') || segment.includes(':');
}
function extractSubgroupFromText(text) {
    const patterns = [
        new RegExp(`(?:^|[\\s(])(${SUBGROUP_VALUE_PATTERN})\\s*${SUBGROUP_MARKER_PATTERN}(?=$|[\\s).,;:])`, 'i'),
        new RegExp(`(?:^|[\\s(])${SUBGROUP_MARKER_PATTERN}\\s*[:№#-]?\\s*(${SUBGROUP_VALUE_PATTERN})(?=$|[\\s).,;:])`, 'i'),
    ];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        const subgroup = match?.[1] ? parseSubgroupNumber(match[1]) : null;
        if (match && subgroup) {
            return {
                subgroup,
                cleaned: text.replace(match[0], ' ').replace(/\s+/g, ' ').trim(),
            };
        }
    }
    return {
        cleaned: text,
        subgroup: null,
    };
}
function extractPositionAndTeacher(part) {
    let text = part.trim().replace(/\s+/g, ' ');
    const subgroupResult = extractSubgroupFromText(text);
    const subgroup = subgroupResult.subgroup;
    text = subgroupResult.cleaned;
    let teacherPosition = '';
    for (const position of TEACHER_POSITIONS) {
        if (text.toLowerCase().startsWith(position)) {
            teacherPosition = position;
            text = text.slice(position.length).trim();
            break;
        }
    }
    return {
        teacherPosition,
        teacherName: formatTeacherName(text),
        subgroup,
    };
}
function parseLessonBlock(block) {
    const text = block
        .replace(/\s+/g, ' ')
        .replace(/\s*\/\s*$/g, '')
        .trim();
    const match = text.match(/^(.+?)[;:]\s*(.+?)(?::\s*(.+))?$/u);
    if (!match) {
        return [];
    }
    const subject = match[1].trim();
    const typePart = match[2].trim();
    const teachersPart = match[3]?.trim() ?? '';
    if (!teachersPart) {
        return [];
    }
    const { cleaned: cleanedType, subgroup: typeSubgroup } = extractSubgroupFromText(typePart);
    const lessonType = normalizeLessonType(cleanedType);
    const teacherParts = teachersPart
        .replace(/\s*\/\s*$/g, '')
        .split(/\s*\/\s*/)
        .map((part) => part.trim())
        .filter(Boolean);
    if (teacherParts.length === 0) {
        return [];
    }
    return teacherParts.map((part, index) => {
        const extracted = extractPositionAndTeacher(part);
        return {
            subject,
            lessonType,
            subgroup: extracted.subgroup ?? typeSubgroup ?? (teacherParts.length === 2 ? index + 1 : null),
            teacherPosition: extracted.teacherPosition,
            teacherName: extracted.teacherName,
            isSameCellParallel: false,
        };
    });
}
const SUBGROUP_SLASH_PLACEHOLDER = '§';
function protectSubgroupSlash(text) {
    return text.replace(/п\s*[\\\/]\s*гр/gi, `п${SUBGROUP_SLASH_PLACEHOLDER}гр`);
}
function restoreSubgroupSlash(text) {
    return text.replace(new RegExp(`п${SUBGROUP_SLASH_PLACEHOLDER}гр`, 'gi'), 'п/гр');
}
function splitLessonBlocks(rawText) {
    const text = protectSubgroupSlash(rawText)
        .replace(/\s+/g, ' ')
        .replace(/\s*\/\s*$/g, '')
        .trim();
    const segments = text.split(/\s*\/\s*/).map((part) => part.trim()).filter(Boolean);
    const blocks = [];
    let currentBlock = '';
    for (const segment of segments) {
        const restoredSegment = restoreSubgroupSlash(segment);
        if (isFullLessonSegment(restoredSegment)) {
            if (currentBlock) {
                blocks.push(restoreSubgroupSlash(currentBlock));
            }
            currentBlock = restoredSegment;
            continue;
        }
        if (!currentBlock) {
            continue;
        }
        currentBlock = `${currentBlock} / ${restoredSegment}`;
    }
    if (currentBlock) {
        blocks.push(restoreSubgroupSlash(currentBlock));
    }
    return blocks;
}
function parseLessonCell(rawText) {
    const text = rawText.replace(/\s+/g, ' ').trim();
    if (/час\s+куратора/i.test(text)) {
        const normalized = text.replace(/^\d{1,2}:\d{2}\s*/u, '').trim();
        const teacherPart = normalized.includes(':')
            ? normalized.slice(normalized.indexOf(':') + 1).trim()
            : '';
        return [{
                subject: 'Час куратора',
                lessonType: 'Кураторский час',
                subgroup: null,
                teacherPosition: '',
                teacherName: formatTeacherName(teacherPart),
                isSameCellParallel: false,
            }];
    }
    if (isIgnorableLessonCell(text)) {
        return [{
                subject: text,
                lessonType: 'Особое',
                subgroup: null,
                teacherPosition: '',
                teacherName: '',
                isSameCellParallel: false,
            }];
    }
    const blocks = splitLessonBlocks(rawText);
    if (blocks.length === 0) {
        return [{
                subject: text,
                lessonType: 'Особое',
                subgroup: null,
                teacherPosition: '',
                teacherName: '',
                isSameCellParallel: false,
            }];
    }
    const hasParallelDisciplines = blocks.length > 1;
    const subjects = new Set(blocks
        .map((block) => block.slice(0, block.indexOf(';')).trim())
        .filter(Boolean));
    const isParallelPair = hasParallelDisciplines && subjects.size > 1;
    const parsedBlocks = blocks.map((block) => parseLessonBlock(block));
    const shouldAssignSubgroupsByBlock = parsedBlocks.length === 2
        && parsedBlocks.every((blockParts) => blockParts.length === 1);
    const parts = parsedBlocks.flatMap((blockParts, blockIndex) => blockParts.map((part) => ({
        ...part,
        subgroup: part.subgroup ?? (shouldAssignSubgroupsByBlock ? blockIndex + 1 : null),
        isSameCellParallel: isParallelPair,
    })));
    if (parts.length === 0) {
        return [{
                subject: text,
                lessonType: 'Особое',
                subgroup: null,
                teacherPosition: '',
                teacherName: '',
                isSameCellParallel: false,
            }];
    }
    const subgroups = parts
        .map((part) => part.subgroup)
        .filter((subgroup) => subgroup !== null);
    const hasDistinctSubgroups = subgroups.length === parts.length
        && new Set(subgroups).size === parts.length;
    if (isParallelPair && hasDistinctSubgroups) {
        return parts.map((part) => ({
            ...part,
            isSameCellParallel: false,
        }));
    }
    return parts;
}
function isDistanceRoom(room) {
    if (!room) {
        return false;
    }
    return /дист/i.test(room);
}
function isAuditoriumRoomLabel(room) {
    if (!room?.trim()) {
        return false;
    }
    const normalized = room
        .trim()
        .toUpperCase()
        .replace(/\s+/g, ' ')
        .replace(/,/g, ' ');
    const collapsed = normalized.replace(/\s*\/\s*/g, '/');
    if (/^С\.?$/.test(normalized)) {
        return true;
    }
    if (collapsed.includes('С/З')) {
        return true;
    }
    if (collapsed.includes('Т/З')) {
        return true;
    }
    if (collapsed.includes('День здоровья')) {
        return true;
    }
    if (normalized.includes('СПОРТИВНЫЙ ЗАЛ') || normalized.includes('СПОРТЗАЛ')) {
        return true;
    }
    if (/^V\s*Р\.?$/.test(normalized)) {
        return true;
    }
    return false;
}
function isSharedMultiHallRoom(room) {
    return isAuditoriumRoomLabel(room);
}
function splitRoomForSubgroups(room, partsCount) {
    const count = Math.max(partsCount, 1);
    if (!room?.trim()) {
        return Array.from({ length: count }, () => null);
    }
    const trimmed = room.trim();
    if (isAuditoriumRoomLabel(trimmed)) {
        return Array.from({ length: count }, () => trimmed);
    }
    if (count <= 1) {
        return [trimmed];
    }
    const slashParts = trimmed
        .split(/\s*\/\s*/)
        .map((part) => part.trim())
        .filter(Boolean);
    if (slashParts.length === count && !slashParts.some((part) => isAuditoriumRoomLabel(part))) {
        return slashParts;
    }
    return Array.from({ length: count }, () => trimmed);
}
//# sourceMappingURL=lesson-cell.parser.js.map