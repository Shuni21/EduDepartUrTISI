"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDepartmentName = normalizeDepartmentName;
exports.isEducationDepartmentName = isEducationDepartmentName;
exports.canManageSchedule = canManageSchedule;
const role_entity_1 = require("./entities/role.entity");
const EDUCATION_DEPARTMENT_NAME = 'учебный отдел';
function normalizeDepartmentName(name) {
    return name?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}
function isEducationDepartmentName(name) {
    return normalizeDepartmentName(name).includes(EDUCATION_DEPARTMENT_NAME);
}
function canManageSchedule(user) {
    if (user.role.code !== role_entity_1.RoleCode.EMPLOYEE || !user.staffProfile?.department) {
        return false;
    }
    return isEducationDepartmentName(user.staffProfile.department.name);
}
//# sourceMappingURL=education-department-access.js.map