"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultationNotificationPreferencesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const teacher_departments_constants_1 = require("../academic/teacher-departments.constants");
const schedule_item_mapper_1 = require("../schedule/schedule-item.mapper");
const role_entity_1 = require("../users/entities/role.entity");
const user_entity_1 = require("../users/entities/user.entity");
const consultation_notification_preference_entity_1 = require("./consultation-notification-preference.entity");
const DEFAULT_PREFERENCES = {
    enabled: false,
    allTeachers: true,
    teacherIds: [],
};
let ConsultationNotificationPreferencesService = class ConsultationNotificationPreferencesService {
    preferencesRepository;
    usersRepository;
    constructor(preferencesRepository, usersRepository) {
        this.preferencesRepository = preferencesRepository;
        this.usersRepository = usersRepository;
    }
    async getForUser(userId) {
        const preference = await this.preferencesRepository.findOne({
            where: { userId },
        });
        if (!preference) {
            return { ...DEFAULT_PREFERENCES };
        }
        return this.mapPreference(preference);
    }
    async updateForUser(userId, dto) {
        if (dto.enabled && !dto.allTeachers) {
            const teacherIds = dto.teacherIds ?? [];
            if (teacherIds.length === 0) {
                throw new common_1.BadRequestException('Выберите хотя бы одного преподавателя');
            }
            await this.assertTeachersExist(teacherIds);
        }
        const teacherIds = dto.allTeachers ? [] : [...new Set(dto.teacherIds ?? [])];
        let preference = await this.preferencesRepository.findOne({
            where: { userId },
        });
        if (!preference) {
            preference = this.preferencesRepository.create({ userId });
        }
        preference.enabled = dto.enabled;
        preference.allTeachers = dto.allTeachers;
        preference.teacherIds = teacherIds;
        const saved = await this.preferencesRepository.save(preference);
        return this.mapPreference(saved);
    }
    async listTeacherOptions() {
        const teachers = await this.usersRepository
            .createQueryBuilder('user')
            .innerJoin('user.role', 'role')
            .innerJoinAndSelect('user.teacherProfile', 'teacherProfile')
            .innerJoinAndSelect('teacherProfile.department', 'department')
            .where('user.isActive = :isActive', { isActive: true })
            .andWhere('role.code = :roleCode', { roleCode: role_entity_1.RoleCode.TEACHER })
            .orderBy('user.surname', 'ASC')
            .addOrderBy('user.name', 'ASC')
            .addOrderBy('user.patronymic', 'ASC')
            .getMany();
        return teachers.map((teacher) => ({
            id: teacher.id,
            name: (0, schedule_item_mapper_1.formatTeacherName)(teacher),
            departmentId: teacher.teacherProfile.departmentId,
            departmentLabel: (0, teacher_departments_constants_1.formatTeacherDepartmentLabel)({
                shortName: teacher.teacherProfile.department.shortName ?? '',
                name: teacher.teacherProfile.department.name,
            }),
        }));
    }
    async findSubscriberUserIds(teacherId) {
        const preferences = await this.preferencesRepository
            .createQueryBuilder('preference')
            .select('preference.userId', 'userId')
            .where('preference.enabled = :enabled', { enabled: true })
            .andWhere('(preference.allTeachers = true OR preference.teacherIds @> :teacherIds::jsonb)', { teacherIds: JSON.stringify([teacherId]) })
            .getRawMany();
        return preferences.map((row) => Number(row.userId));
    }
    async assertTeachersExist(teacherIds) {
        const teachers = await this.usersRepository.find({
            where: {
                id: (0, typeorm_2.In)(teacherIds),
                isActive: true,
            },
            relations: ['teacherProfile'],
        });
        const validIds = new Set(teachers
            .filter((teacher) => Boolean(teacher.teacherProfile))
            .map((teacher) => teacher.id));
        const missingIds = teacherIds.filter((id) => !validIds.has(id));
        if (missingIds.length > 0) {
            throw new common_1.BadRequestException('Некоторые преподаватели не найдены');
        }
    }
    mapPreference(preference) {
        return {
            enabled: preference.enabled,
            allTeachers: preference.allTeachers,
            teacherIds: preference.teacherIds ?? [],
        };
    }
};
exports.ConsultationNotificationPreferencesService = ConsultationNotificationPreferencesService;
exports.ConsultationNotificationPreferencesService = ConsultationNotificationPreferencesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(consultation_notification_preference_entity_1.ConsultationNotificationPreference)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ConsultationNotificationPreferencesService);
//# sourceMappingURL=consultation-notification-preferences.service.js.map