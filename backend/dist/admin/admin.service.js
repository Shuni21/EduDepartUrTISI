"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const users_service_1 = require("../users/users.service");
const auth_user_mapper_1 = require("../auth/auth-user.mapper");
const refresh_token_entity_1 = require("../auth/entities/refresh-token.entity");
const role_entity_1 = require("../users/entities/role.entity");
const student_profile_entity_1 = require("../users/entities/student-profile.entity");
const teacher_profile_entity_1 = require("../users/entities/teacher-profile.entity");
const staff_profile_entity_1 = require("../users/entities/staff-profile.entity");
const departments_service_1 = require("../academic/departments.service");
const department_entity_1 = require("../academic/entities/department.entity");
const direction_entity_1 = require("../academic/entities/direction.entity");
const group_entity_1 = require("../academic/entities/group.entity");
const direction_utils_1 = require("../academic/direction.utils");
const sessions_service_1 = require("../sessions/sessions.service");
const sessions_notifier_service_1 = require("../sessions/sessions-notifier.service");
const avatar_service_1 = require("../uploads/avatar.service");
const consultation_notification_preference_entity_1 = require("../notifications/consultation-notification-preference.entity");
const consultation_entity_1 = require("../schedule/entities/consultation.entity");
const schedule_entity_1 = require("../schedule/entities/schedule.entity");
const schedule_item_entity_1 = require("../schedule/entities/schedule-item.entity");
const schedule_upload_entity_1 = require("../schedule/entities/schedule-upload.entity");
let AdminService = class AdminService {
    static { AdminService_1 = this; }
    usersService;
    sessionsService;
    sessionsNotifier;
    avatarService;
    departmentsService;
    roleRepository;
    refreshTokenRepository;
    studentProfileRepository;
    teacherProfileRepository;
    staffProfileRepository;
    departmentRepository;
    directionRepository;
    groupRepository;
    consultationsRepository;
    scheduleItemsRepository;
    schedulesRepository;
    scheduleUploadsRepository;
    consultationPreferencesRepository;
    constructor(usersService, sessionsService, sessionsNotifier, avatarService, departmentsService, roleRepository, refreshTokenRepository, studentProfileRepository, teacherProfileRepository, staffProfileRepository, departmentRepository, directionRepository, groupRepository, consultationsRepository, scheduleItemsRepository, schedulesRepository, scheduleUploadsRepository, consultationPreferencesRepository) {
        this.usersService = usersService;
        this.sessionsService = sessionsService;
        this.sessionsNotifier = sessionsNotifier;
        this.avatarService = avatarService;
        this.departmentsService = departmentsService;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.teacherProfileRepository = teacherProfileRepository;
        this.staffProfileRepository = staffProfileRepository;
        this.departmentRepository = departmentRepository;
        this.directionRepository = directionRepository;
        this.groupRepository = groupRepository;
        this.consultationsRepository = consultationsRepository;
        this.scheduleItemsRepository = scheduleItemsRepository;
        this.schedulesRepository = schedulesRepository;
        this.scheduleUploadsRepository = scheduleUploadsRepository;
        this.consultationPreferencesRepository = consultationPreferencesRepository;
    }
    async listUsers() {
        const users = await this.usersService.findAllWithDetails();
        return users.map((user) => ({
            ...(0, auth_user_mapper_1.mapUserToAuthResponse)(user),
            isActive: user.isActive,
        }));
    }
    listStaffDepartments() {
        return this.departmentsService.listStaffDepartments();
    }
    async getUser(id) {
        const user = await this.usersService.findByIdWithDetails(id);
        return {
            ...(0, auth_user_mapper_1.mapUserToAuthResponse)(user),
            isActive: user.isActive,
        };
    }
    async updateUser(id, dto, currentUserId, photo) {
        const user = await this.usersService.findByIdWithDetails(id);
        const trimmedLogin = dto.login.trim();
        if (id === currentUserId) {
            if (dto.role !== role_entity_1.RoleCode.ADMIN) {
                throw new common_1.BadRequestException('Нельзя изменить собственную роль');
            }
            if (dto.isActive === false) {
                throw new common_1.BadRequestException('Нельзя деактивировать собственную учётную запись');
            }
        }
        if (trimmedLogin !== user.login) {
            const existingUser = await this.usersService.findByLogin(trimmedLogin);
            if (existingUser && existingUser.id !== id) {
                throw new common_1.ConflictException('Пользователь с таким логином уже существует');
            }
        }
        const role = await this.roleRepository.findOne({
            where: { code: dto.role },
        });
        if (!role) {
            throw new common_1.BadRequestException(`Роль ${dto.role} не найдена в системе`);
        }
        this.validateProfileFields(dto);
        const updateData = {
            login: trimmedLogin,
            roleId: role.id,
            surname: dto.surname.trim(),
            name: dto.name.trim(),
            patronymic: dto.patronymic?.trim() || '',
            photoUrl: user.photoUrl,
            isActive: dto.isActive ?? user.isActive,
        };
        if (dto.password?.trim()) {
            updateData.passwordHash = await bcrypt.hash(dto.password.trim(), 10);
        }
        if (photo) {
            updateData.photoUrl = await this.avatarService.saveAvatar(id, photo, user.photoUrl);
        }
        else if (dto.removePhoto) {
            await this.avatarService.deleteAvatar(id, user.photoUrl);
            updateData.photoUrl = null;
        }
        await this.usersService.update(id, updateData);
        const willBeActive = updateData.isActive;
        if (user.isActive && !willBeActive) {
            await this.revokeUserSessions(id);
        }
        if (user.role.code !== dto.role) {
            await this.removeAllProfiles(id);
            await this.createProfile(id, dto);
        }
        else {
            await this.updateProfile(id, dto);
        }
        const updatedUser = await this.usersService.findByIdWithDetails(id);
        return {
            ...(0, auth_user_mapper_1.mapUserToAuthResponse)(updatedUser),
            isActive: updatedUser.isActive,
        };
    }
    async createUser(dto, photo) {
        const existingUser = await this.usersService.findByLogin(dto.login);
        if (existingUser) {
            throw new common_1.ConflictException('Пользователь с таким логином уже существует');
        }
        const role = await this.roleRepository.findOne({
            where: { code: dto.role },
        });
        if (!role) {
            throw new common_1.BadRequestException(`Роль ${dto.role} не найдена в системе`);
        }
        this.validateProfileFields(dto);
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.usersService.create({
            login: dto.login.trim(),
            passwordHash,
            roleId: role.id,
            surname: dto.surname.trim(),
            name: dto.name.trim(),
            patronymic: dto.patronymic?.trim() || '',
            photoUrl: null,
            isActive: true,
        });
        await this.createProfile(user.id, dto);
        if (photo) {
            const photoUrl = await this.avatarService.saveAvatar(user.id, photo);
            await this.usersService.update(user.id, { photoUrl });
        }
        const createdUser = await this.usersService.findByIdWithDetails(user.id);
        return {
            ...(0, auth_user_mapper_1.mapUserToAuthResponse)(createdUser),
            isActive: createdUser.isActive,
        };
    }
    async deleteUser(id, currentUserId) {
        if (id === currentUserId) {
            throw new common_1.BadRequestException('Нельзя удалить собственную учётную запись');
        }
        const user = await this.usersService.findByIdWithDetails(id);
        await this.cleanupUserReferences(id);
        await this.avatarService.deleteAvatar(id, user.photoUrl);
        try {
            await this.usersService.remove(id);
        }
        catch (error) {
            this.rethrowUserDeleteError(error);
        }
        return { success: true };
    }
    async cleanupUserReferences(userId) {
        const uploadsCount = await this.scheduleUploadsRepository.count({
            where: { uploadedById: userId },
        });
        if (uploadsCount > 0) {
            throw new common_1.BadRequestException('Нельзя удалить пользователя: у него есть загруженные файлы расписания');
        }
        await this.consultationsRepository.delete({ teacherId: userId });
        await this.scheduleItemsRepository.update({ teacherId: userId }, { teacherId: null });
        await this.schedulesRepository.update({ teacherId: userId }, { teacherId: null });
        const preferences = await this.consultationPreferencesRepository
            .createQueryBuilder('preference')
            .where('preference.teacherIds @> :teacherIds::jsonb', {
            teacherIds: JSON.stringify([userId]),
        })
            .getMany();
        for (const preference of preferences) {
            preference.teacherIds = preference.teacherIds.filter((teacherId) => teacherId !== userId);
            await this.consultationPreferencesRepository.save(preference);
        }
    }
    rethrowUserDeleteError(error) {
        if (error instanceof typeorm_2.QueryFailedError
            && error.driverError.code === '23503') {
            throw new common_1.BadRequestException('Нельзя удалить пользователя: на него есть ссылки в других данных системы');
        }
        throw error;
    }
    async listActiveSessions() {
        return this.sessionsService.listActiveSessions();
    }
    async revokeSession(id) {
        const session = await this.refreshTokenRepository.findOne({
            where: { id, isActive: true },
        });
        if (!session) {
            throw new common_1.NotFoundException('Активная сессия не найдена');
        }
        await this.refreshTokenRepository.update({ id }, { isActive: false });
        this.sessionsNotifier.notifySessionRemoved(id);
        return { success: true };
    }
    async revokeUserSessions(userId) {
        await this.sessionsNotifier.notifyUserSessionsRemoved(userId);
        await this.refreshTokenRepository.update({ userId, isActive: true }, { isActive: false });
    }
    validateProfileFields(dto) {
        if (dto.role === role_entity_1.RoleCode.STUDENT) {
            if (!dto.group?.trim() || !dto.direction?.trim() || !dto.course) {
                throw new common_1.BadRequestException('Для студента нужны группа, направление и курс');
            }
            const directionValidation = (0, direction_utils_1.validateDirectionInput)(dto.direction);
            if (!directionValidation.valid) {
                throw new common_1.BadRequestException(directionValidation.message);
            }
        }
        if (dto.role === role_entity_1.RoleCode.TEACHER) {
            if (!dto.position?.trim() || !dto.departmentId) {
                throw new common_1.BadRequestException('Для преподавателя нужны должность и кафедра');
            }
        }
        if (dto.role === role_entity_1.RoleCode.EMPLOYEE ||
            dto.role === role_entity_1.RoleCode.ADMIN) {
            if (!dto.departmentId && !dto.department?.trim()) {
                throw new common_1.BadRequestException('Укажите структурное подразделение');
            }
            if (dto.role === role_entity_1.RoleCode.EMPLOYEE &&
                !dto.position?.trim()) {
                throw new common_1.BadRequestException('Для сотрудника нужна должность');
            }
        }
    }
    async createProfile(userId, dto) {
        switch (dto.role) {
            case role_entity_1.RoleCode.STUDENT:
                await this.createStudentProfile(userId, dto);
                return;
            case role_entity_1.RoleCode.TEACHER:
                await this.createTeacherProfile(userId, dto);
                return;
            case role_entity_1.RoleCode.ADMIN:
            case role_entity_1.RoleCode.EMPLOYEE:
                await this.createStaffProfile(userId, dto);
                return;
        }
    }
    async createStudentProfile(userId, dto) {
        const direction = await this.findOrCreateDirection(dto.direction.trim());
        const educationForm = this.mapEducationForm(dto.educationForm);
        const group = await this.findOrCreateGroup(dto.group.trim(), direction.id, educationForm);
        await this.studentProfileRepository.save({
            userId,
            groupId: group.id,
            subgroupId: null,
            course: dto.course,
            educationForm,
        });
    }
    async createTeacherProfile(userId, dto) {
        const department = await this.departmentsService.resolveTeacherDepartmentId(dto.departmentId);
        await this.teacherProfileRepository.save({
            userId,
            departmentId: department.id,
            position: dto.position.trim(),
            cabinet: dto.cabinet?.trim() || null,
        });
    }
    async resolveStaffDepartment(dto) {
        if (dto.departmentId) {
            const department = await this.departmentRepository.findOne({
                where: { id: dto.departmentId },
            });
            if (department) {
                return department;
            }
        }
        return this.departmentsService.resolveDepartmentByInput(dto.department.trim());
    }
    async createStaffProfile(userId, dto) {
        const department = await this.resolveStaffDepartment(dto);
        await this.staffProfileRepository.save({
            userId,
            departmentId: department.id,
            position: dto.position?.trim() || 'Администратор',
            cabinet: dto.cabinet?.trim() || null,
        });
    }
    async updateProfile(userId, dto) {
        switch (dto.role) {
            case role_entity_1.RoleCode.STUDENT: {
                const profile = await this.studentProfileRepository.findOne({
                    where: { userId },
                });
                if (!profile) {
                    await this.createStudentProfile(userId, dto);
                    return;
                }
                const direction = await this.findOrCreateDirection(dto.direction.trim());
                const educationForm = this.mapEducationForm(dto.educationForm);
                const group = await this.findOrCreateGroup(dto.group.trim(), direction.id, educationForm);
                await this.studentProfileRepository.update(profile.id, {
                    groupId: group.id,
                    course: dto.course,
                    educationForm,
                });
                return;
            }
            case role_entity_1.RoleCode.TEACHER: {
                const profile = await this.teacherProfileRepository.findOne({
                    where: { userId },
                });
                if (!profile) {
                    await this.createTeacherProfile(userId, dto);
                    return;
                }
                const department = await this.departmentsService.resolveTeacherDepartmentId(dto.departmentId);
                await this.teacherProfileRepository.update(profile.id, {
                    departmentId: department.id,
                    position: dto.position.trim(),
                    cabinet: dto.cabinet?.trim() || null,
                });
                return;
            }
            case role_entity_1.RoleCode.ADMIN:
            case role_entity_1.RoleCode.EMPLOYEE: {
                const profile = await this.staffProfileRepository.findOne({
                    where: { userId },
                });
                if (!profile) {
                    await this.createStaffProfile(userId, dto);
                    return;
                }
                const department = await this.resolveStaffDepartment(dto);
                await this.staffProfileRepository.update(profile.id, {
                    departmentId: department.id,
                    position: dto.position?.trim() || 'Администратор',
                    cabinet: dto.cabinet?.trim() || null,
                });
                return;
            }
        }
    }
    async removeAllProfiles(userId) {
        await this.studentProfileRepository.delete({ userId });
        await this.teacherProfileRepository.delete({ userId });
        await this.staffProfileRepository.delete({ userId });
    }
    async findOrCreateDepartment(name) {
        const existing = await this.departmentRepository.findOne({
            where: { name },
        });
        if (existing) {
            return existing;
        }
        return this.departmentRepository.save({
            name,
            shortName: null,
        });
    }
    async findOrCreateDirection(name) {
        const trimmed = name.trim();
        const validation = (0, direction_utils_1.validateDirectionInput)(trimmed);
        if (!validation.valid) {
            throw new common_1.BadRequestException(validation.message);
        }
        const displayName = (0, direction_utils_1.buildDirectionDisplayName)(trimmed);
        const storageCode = (0, direction_utils_1.buildDirectionStorageCode)(trimmed);
        const existingByCode = await this.directionRepository.findOne({
            where: { code: storageCode },
        });
        if (existingByCode) {
            if (existingByCode.name !== displayName) {
                existingByCode.name = displayName;
                await this.directionRepository.save(existingByCode);
            }
            return existingByCode;
        }
        return this.directionRepository.save({
            name: displayName,
            code: storageCode,
        });
    }
    static GROUP_LEGACY_COURSE = 1;
    async findOrCreateGroup(name, directionId, educationForm) {
        const existing = await this.groupRepository.findOne({
            where: {
                name,
                directionId,
                educationForm,
            },
        });
        if (existing) {
            return existing;
        }
        return this.groupRepository.save({
            name,
            directionId,
            course: AdminService_1.GROUP_LEGACY_COURSE,
            educationForm,
        });
    }
    mapEducationForm(label) {
        switch (label?.trim()) {
            case 'Заочная':
                return group_entity_1.EducationForm.PART_TIME;
            case 'Дистанционная':
                return group_entity_1.EducationForm.DISTANCE;
            case 'Очно-заочная':
                return group_entity_1.EducationForm.PART_TIME;
            default:
                return group_entity_1.EducationForm.FULL_TIME;
        }
    }
    formatFullName(user) {
        const patronymicInitial = user.patronymic
            ? ` ${user.patronymic.charAt(0)}.`
            : '';
        return `${user.surname} ${user.name.charAt(0)}.${patronymicInitial}`.trim();
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(5, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(6, (0, typeorm_1.InjectRepository)(refresh_token_entity_1.RefreshToken)),
    __param(7, (0, typeorm_1.InjectRepository)(student_profile_entity_1.StudentProfile)),
    __param(8, (0, typeorm_1.InjectRepository)(teacher_profile_entity_1.TeacherProfile)),
    __param(9, (0, typeorm_1.InjectRepository)(staff_profile_entity_1.StaffProfile)),
    __param(10, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __param(11, (0, typeorm_1.InjectRepository)(direction_entity_1.Direction)),
    __param(12, (0, typeorm_1.InjectRepository)(group_entity_1.Group)),
    __param(13, (0, typeorm_1.InjectRepository)(consultation_entity_1.Consultation)),
    __param(14, (0, typeorm_1.InjectRepository)(schedule_item_entity_1.ScheduleItem)),
    __param(15, (0, typeorm_1.InjectRepository)(schedule_entity_1.Schedule)),
    __param(16, (0, typeorm_1.InjectRepository)(schedule_upload_entity_1.ScheduleUpload)),
    __param(17, (0, typeorm_1.InjectRepository)(consultation_notification_preference_entity_1.ConsultationNotificationPreference)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        sessions_service_1.SessionsService,
        sessions_notifier_service_1.SessionsNotifierService,
        avatar_service_1.AvatarService,
        departments_service_1.DepartmentsService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map