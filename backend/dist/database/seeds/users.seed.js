"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEED_USERS = void 0;
const role_entity_1 = require("../../users/entities/role.entity");
exports.SEED_USERS = [
    {
        envLoginKey: 'SEED_ADMIN_LOGIN',
        envPasswordKey: 'SEED_ADMIN_PASSWORD',
        defaultLogin: 'admin',
        role: role_entity_1.RoleCode.ADMIN,
        surname: 'Админ',
        name: 'Системный',
        patronymic: 'Администратор',
        departmentName: 'Администрация',
        position: 'Администратор',
    },
    {
        envLoginKey: 'SEED_EDU_DEPART_LOGIN',
        envPasswordKey: 'SEED_EDU_DEPART_PASSWORD',
        defaultLogin: 'edu_depart',
        role: role_entity_1.RoleCode.EMPLOYEE,
        surname: 'Сотрудник',
        name: 'Учебного',
        patronymic: 'Отдела',
        departmentName: 'Учебный отдел',
        position: 'Специалист учебного отдела',
    },
];
//# sourceMappingURL=users.seed.js.map