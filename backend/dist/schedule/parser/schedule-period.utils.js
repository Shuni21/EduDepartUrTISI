"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseScheduleDate = parseScheduleDate;
exports.getAcademicYearStartFromDate = getAcademicYearStartFromDate;
exports.formatAcademicYearLabel = formatAcademicYearLabel;
exports.formatPeriodLabel = formatPeriodLabel;
exports.resolveSchedulePeriodMeta = resolveSchedulePeriodMeta;
function parseScheduleDate(value) {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        const [year, month, day] = trimmed.slice(0, 10).split('-').map(Number);
        return new Date(year, month - 1, day);
    }
    const dottedMatch = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (dottedMatch) {
        return new Date(Number(dottedMatch[3]), Number(dottedMatch[2]) - 1, Number(dottedMatch[1]));
    }
    return new Date(trimmed);
}
function getAcademicYearStartFromDate(referenceDate) {
    const month = referenceDate.getMonth();
    const year = referenceDate.getFullYear();
    if (month >= 7) {
        return year;
    }
    return year - 1;
}
function formatAcademicYearLabel(validFrom) {
    const startYear = getAcademicYearStartFromDate(parseScheduleDate(validFrom));
    return `${startYear}/${String(startYear + 1).slice(-2)}`;
}
function formatScheduleDateLabel(value) {
    const date = parseScheduleDate(value);
    const pad = (part) => String(part).padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}
function formatPeriodLabel(validFrom, validTo) {
    return `${formatScheduleDateLabel(validFrom)} — ${formatScheduleDateLabel(validTo)}`;
}
function resolveSchedulePeriodMeta(items) {
    const empty = {
        academicYearLabel: null,
        periodStart: null,
        periodEnd: null,
        periodLabel: null,
    };
    if (items.length === 0) {
        return empty;
    }
    const schedules = new Map();
    for (const item of items) {
        const schedule = item.schedule;
        if (!schedule?.validFrom || !schedule?.validTo) {
            continue;
        }
        schedules.set(schedule.id, {
            validFrom: String(schedule.validFrom),
            validTo: String(schedule.validTo),
        });
    }
    if (schedules.size === 0) {
        return empty;
    }
    let earliestStart = null;
    let latestEnd = null;
    for (const { validFrom, validTo } of schedules.values()) {
        if (!earliestStart
            || parseScheduleDate(validFrom) < parseScheduleDate(earliestStart)) {
            earliestStart = validFrom;
        }
        if (!latestEnd
            || parseScheduleDate(validTo) > parseScheduleDate(latestEnd)) {
            latestEnd = validTo;
        }
    }
    if (!earliestStart || !latestEnd) {
        return empty;
    }
    return {
        academicYearLabel: formatAcademicYearLabel(earliestStart),
        periodStart: earliestStart,
        periodEnd: latestEnd,
        periodLabel: formatPeriodLabel(earliestStart, latestEnd),
    };
}
//# sourceMappingURL=schedule-period.utils.js.map