"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.avatarUploadOptions = void 0;
exports.parseCreateUserBody = parseCreateUserBody;
exports.parseUpdateUserBody = parseUpdateUserBody;
const common_1 = require("@nestjs/common");
const role_entity_1 = require("../../users/entities/role.entity");
function readString(body, key) {
    const value = body[key];
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    return String(value).trim();
}
function readRequiredString(body, key) {
    const value = readString(body, key);
    if (!value) {
        throw new common_1.BadRequestException(`Поле ${key} обязательно`);
    }
    return value;
}
function readRole(body) {
    const role = readRequiredString(body, 'role');
    if (!Object.values(role_entity_1.RoleCode).includes(role)) {
        throw new common_1.BadRequestException('Некорректная роль пользователя');
    }
    return role;
}
function readDepartmentId(body) {
    const value = readString(body, 'departmentId');
    if (!value) {
        return undefined;
    }
    const departmentId = Number(value);
    if (!Number.isInteger(departmentId) || departmentId < 1) {
        throw new common_1.BadRequestException('Некорректная кафедра');
    }
    return departmentId;
}
function readCourse(body) {
    const value = readString(body, 'course');
    if (!value) {
        return undefined;
    }
    const course = Number(value);
    if (!Number.isInteger(course) || course < 1 || course > 6) {
        throw new common_1.BadRequestException('Курс должен быть от 1 до 6');
    }
    return course;
}
function readBoolean(body, key) {
    const value = readString(body, key);
    if (value === undefined) {
        return undefined;
    }
    return value === 'true' || value === '1';
}
function parseCreateUserBody(body) {
    return {
        login: readRequiredString(body, 'login'),
        password: readRequiredString(body, 'password'),
        role: readRole(body),
        surname: readRequiredString(body, 'surname'),
        name: readRequiredString(body, 'name'),
        patronymic: readString(body, 'patronymic'),
        group: readString(body, 'group'),
        direction: readString(body, 'direction'),
        educationForm: readString(body, 'educationForm'),
        course: readCourse(body),
        departmentId: readDepartmentId(body),
        department: readString(body, 'department'),
        position: readString(body, 'position'),
        cabinet: readString(body, 'cabinet'),
    };
}
function parseUpdateUserBody(body) {
    return {
        login: readRequiredString(body, 'login'),
        password: readString(body, 'password'),
        role: readRole(body),
        surname: readRequiredString(body, 'surname'),
        name: readRequiredString(body, 'name'),
        patronymic: readString(body, 'patronymic'),
        isActive: readBoolean(body, 'isActive'),
        removePhoto: readBoolean(body, 'removePhoto'),
        group: readString(body, 'group'),
        direction: readString(body, 'direction'),
        educationForm: readString(body, 'educationForm'),
        course: readCourse(body),
        departmentId: readDepartmentId(body),
        department: readString(body, 'department'),
        position: readString(body, 'position'),
        cabinet: readString(body, 'cabinet'),
    };
}
exports.avatarUploadOptions = {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
            callback(new common_1.BadRequestException('Допустимы только изображения JPG, PNG или WebP'), false);
            return;
        }
        callback(null, true);
    },
};
//# sourceMappingURL=multipart.parser.js.map