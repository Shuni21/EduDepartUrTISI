"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEACHER_DEPARTMENTS = void 0;
exports.formatTeacherDepartmentLabel = formatTeacherDepartmentLabel;
exports.TEACHER_DEPARTMENTS = [
    {
        shortName: 'ИТиМС',
        name: 'Кафедра «Инфокоммуникационных технологий и мобильной связи»',
    },
    {
        shortName: 'ИСТ',
        name: 'Кафедра «Информационных систем и технологий»',
    },
    {
        shortName: 'МЭС',
        name: 'Кафедра «Многоканальная электросвязь»',
    },
    {
        shortName: 'ВМиФ',
        name: 'Кафедра «Высшей математики и физики»',
    },
    {
        shortName: 'ГиСЭД',
        name: 'Кафедра гуманитарных и социально-экономических дисциплин',
    },
];
function formatTeacherDepartmentLabel(department) {
    return `Кафедра ${department.shortName} — ${department.name}`;
}
//# sourceMappingURL=teacher-departments.constants.js.map