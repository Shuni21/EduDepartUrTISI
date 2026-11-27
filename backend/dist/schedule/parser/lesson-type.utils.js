"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compactLessonType = compactLessonType;
exports.isKpDefenseLessonType = isKpDefenseLessonType;
exports.isKrDefenseLessonType = isKrDefenseLessonType;
exports.isCreditLessonType = isCreditLessonType;
exports.normalizeLessonTypeLabel = normalizeLessonTypeLabel;
function compactLessonType(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/[^a-zа-я0-9]+/gi, '');
}
function isKpDefenseLessonType(value) {
    const compact = compactLessonType(value);
    if (!compact) {
        return false;
    }
    return compact.includes('курсовойпроект')
        || compact.includes('курспроект')
        || compact === 'кп'
        || compact === 'зкп'
        || (compact.includes('защ') && compact.includes('кп'));
}
function isKrDefenseLessonType(value) {
    const compact = compactLessonType(value);
    if (!compact || isKpDefenseLessonType(value)) {
        return false;
    }
    return compact.includes('курсоваяработа')
        || compact.includes('курсработа')
        || compact === 'кр'
        || compact === 'зкр'
        || (compact.includes('защ') && compact.includes('кр'));
}
function isCreditLessonType(value) {
    if (isKpDefenseLessonType(value) || isKrDefenseLessonType(value)) {
        return false;
    }
    const compact = compactLessonType(value);
    return compact === 'зач' || compact.startsWith('зачет');
}
function normalizeLessonTypeLabel(raw) {
    const value = raw.trim().replace(/;$/, '');
    const compact = compactLessonType(value);
    if (compact.startsWith('лек'))
        return 'Лекция';
    if (compact.startsWith('практ'))
        return 'Практика';
    if (compact.startsWith('лаб'))
        return 'Лаб. раб.';
    if (isKpDefenseLessonType(value))
        return 'Защита КП';
    if (isKrDefenseLessonType(value))
        return 'Защита КР';
    if (isCreditLessonType(value))
        return 'Зачет';
    return value;
}
//# sourceMappingURL=lesson-type.utils.js.map