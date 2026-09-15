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
var AdminAcademicService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAcademicService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const department_entity_1 = require("../academic/entities/department.entity");
const direction_entity_1 = require("../academic/entities/direction.entity");
const group_entity_1 = require("../academic/entities/group.entity");
const subgroup_entity_1 = require("../academic/entities/subgroup.entity");
const direction_utils_1 = require("../academic/direction.utils");
const student_profile_entity_1 = require("../users/entities/student-profile.entity");
const schedule_entity_1 = require("../schedule/entities/schedule.entity");
const user_entity_1 = require("../users/entities/user.entity");
const teacher_profile_entity_1 = require("../users/entities/teacher-profile.entity");
const staff_profile_entity_1 = require("../users/entities/staff-profile.entity");
let AdminAcademicService = class AdminAcademicService {
    static { AdminAcademicService_1 = this; }
    departmentRepository;
    directionRepository;
    groupRepository;
    subgroupRepository;
    studentProfileRepository;
    scheduleRepository;
    usersRepository;
    teacherProfileRepository;
    staffProfileRepository;
    static STAFF_DEPARTMENT_MARKERS = ['учебный отдел'];
    static IMPORT_DIRECTION_CODE = 'SCHEDULE_IMPORT';
    constructor(departmentRepository, directionRepository, groupRepository, subgroupRepository, studentProfileRepository, scheduleRepository, usersRepository, teacherProfileRepository, staffProfileRepository) {
        this.departmentRepository = departmentRepository;
        this.directionRepository = directionRepository;
        this.groupRepository = groupRepository;
        this.subgroupRepository = subgroupRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.scheduleRepository = scheduleRepository;
        this.usersRepository = usersRepository;
        this.teacherProfileRepository = teacherProfileRepository;
        this.staffProfileRepository = staffProfileRepository;
    }
    async getOverview() {
        const departments = await this.departmentRepository.find({
            relations: {
                headUser: true,
                teacherProfiles: {
                    user: {
                        role: true,
                    },
                },
                staffProfiles: {
                    user: {
                        role: true,
                    },
                },
            },
            order: { name: 'ASC' },
        });
        const teacherDepartments = [];
        const staffDepartments = [];
        for (const department of departments) {
            const isTeacherDepartment = this.isTeacherDepartment(department);
            const mapped = this.mapDepartment(department, isTeacherDepartment);
            mapped.members.sort((left, right) => left.fullName.localeCompare(right.fullName, 'ru', {
                sensitivity: 'base',
            }));
            if (isTeacherDepartment) {
                teacherDepartments.push(mapped);
            }
            else {
                staffDepartments.push(mapped);
            }
        }
        teacherDepartments.sort((left, right) => (left.shortName ?? left.name).localeCompare(right.shortName ?? right.name, 'ru', { sensitivity: 'base' }));
        const directions = await this.directionRepository.find({
            relations: {
                groups: {
                    studentProfiles: {
                        user: {
                            role: true,
                        },
                    },
                },
            },
            order: { name: 'ASC' },
        });
        return {
            teacherDepartments,
            staffDepartments,
            directions: directions
                .filter((direction) => direction.code !== AdminAcademicService_1.IMPORT_DIRECTION_CODE)
                .map((direction) => ({
                id: direction.id,
                code: direction.code,
                name: direction.name,
                groups: direction.groups
                    .map((group) => ({
                    id: group.id,
                    name: group.name,
                    educationForm: group.educationForm,
                    directionId: direction.id,
                    directionName: direction.name,
                    students: group.studentProfiles
                        .map((profile) => this.mapStudentMember(profile))
                        .sort((left, right) => left.fullName.localeCompare(right.fullName, 'ru', {
                        sensitivity: 'base',
                    })),
                }))
                    .sort((left, right) => left.name.localeCompare(right.name, 'ru', {
                    sensitivity: 'base',
                })),
            })),
        };
    }
    async setDepartmentHead(departmentId, headUserId) {
        const department = await this.departmentRepository.findOne({
            where: { id: departmentId },
            relations: {
                headUser: true,
                teacherProfiles: {
                    user: {
                        role: true,
                    },
                },
                staffProfiles: {
                    user: {
                        role: true,
                    },
                },
            },
        });
        if (!department) {
            throw new common_1.NotFoundException('Подразделение не найдено');
        }
        const isTeacherDepartment = this.isTeacherDepartment(department);
        if (headUserId === null) {
            department.headUserId = null;
            await this.departmentRepository.save(department);
            return this.mapDepartment(department, isTeacherDepartment);
        }
        const user = await this.usersRepository.findOne({
            where: { id: headUserId },
            relations: { role: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        if (isTeacherDepartment) {
            const teacherProfile = await this.teacherProfileRepository.findOne({
                where: {
                    userId: headUserId,
                    departmentId,
                },
            });
            if (!teacherProfile) {
                throw new common_1.BadRequestException('Руководителем кафедры может быть только преподаватель этой кафедры');
            }
        }
        else {
            const staffProfile = await this.staffProfileRepository.findOne({
                where: {
                    userId: headUserId,
                    departmentId,
                },
            });
            if (!staffProfile) {
                throw new common_1.BadRequestException('Руководителем отдела может быть только сотрудник этого отдела');
            }
        }
        department.headUserId = headUserId;
        department.headUser = user;
        await this.departmentRepository.save(department);
        return this.mapDepartment(department, isTeacherDepartment);
    }
    async createTeacherDepartment(dto) {
        const name = dto.name.trim();
        const shortName = dto.shortName.trim();
        if (AdminAcademicService_1.STAFF_DEPARTMENT_MARKERS.some((marker) => name.toLowerCase().includes(marker))) {
            throw new common_1.BadRequestException('Кафедра не может называться как отдел');
        }
        const existingByShortName = await this.departmentRepository.findOne({
            where: { shortName },
        });
        if (existingByShortName) {
            throw new common_1.ConflictException('Кафедра с таким сокращением уже существует');
        }
        const existingByName = await this.departmentRepository.findOne({
            where: { name },
        });
        if (existingByName) {
            throw new common_1.ConflictException('Кафедра с таким названием уже существует');
        }
        const department = await this.departmentRepository.save({
            name,
            shortName,
            headUserId: null,
        });
        department.teacherProfiles = [];
        department.staffProfiles = [];
        return this.mapDepartment(department, true);
    }
    async createStaffDepartment(dto) {
        const name = dto.name.trim();
        const existingByName = await this.departmentRepository.findOne({
            where: { name },
        });
        if (existingByName) {
            throw new common_1.ConflictException('Отдел с таким названием уже существует');
        }
        const department = await this.departmentRepository.save({
            name,
            shortName: null,
            headUserId: null,
        });
        department.teacherProfiles = [];
        department.staffProfiles = [];
        return this.mapDepartment(department, false);
    }
    async createDirection(dto) {
        const trimmed = dto.name.trim();
        const validation = (0, direction_utils_1.validateDirectionInput)(trimmed);
        if (!validation.valid) {
            throw new common_1.BadRequestException(validation.message);
        }
        const displayName = (0, direction_utils_1.buildDirectionDisplayName)(trimmed);
        const storageCode = (0, direction_utils_1.buildDirectionStorageCode)(trimmed);
        if (storageCode === AdminAcademicService_1.IMPORT_DIRECTION_CODE) {
            throw new common_1.BadRequestException('Недопустимое название направления');
        }
        const existingByCode = await this.directionRepository.findOne({
            where: { code: storageCode },
        });
        if (existingByCode) {
            throw new common_1.ConflictException('Направление с таким кодом уже существует');
        }
        const direction = await this.directionRepository.save({
            name: displayName,
            code: storageCode,
        });
        return this.mapDirection(direction, []);
    }
    async createGroup(directionId, dto) {
        const direction = await this.directionRepository.findOne({
            where: { id: directionId },
        });
        if (!direction) {
            throw new common_1.NotFoundException('Направление не найдено');
        }
        if (direction.code === AdminAcademicService_1.IMPORT_DIRECTION_CODE) {
            throw new common_1.BadRequestException('Нельзя добавлять группы в служебное направление');
        }
        const groupName = dto.name.trim();
        const existing = await this.groupRepository.findOne({
            where: {
                name: groupName,
                directionId,
                educationForm: dto.educationForm,
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Такая группа уже существует в этом направлении');
        }
        const group = await this.groupRepository.save({
            name: groupName,
            directionId,
            course: 1,
            educationForm: dto.educationForm,
        });
        return {
            id: group.id,
            name: group.name,
            educationForm: group.educationForm,
            directionId: direction.id,
            directionName: direction.name,
            students: [],
        };
    }
    async deleteGroup(groupId) {
        const group = await this.groupRepository.findOne({
            where: { id: groupId },
            relations: { studentProfiles: true },
        });
        if (!group) {
            throw new common_1.NotFoundException('Группа не найдена');
        }
        if (group.studentProfiles.length > 0) {
            throw new common_1.BadRequestException('Нельзя удалить группу: в ней есть студенты');
        }
        const schedulesCount = await this.scheduleRepository.count({
            where: { groupId },
        });
        if (schedulesCount > 0) {
            throw new common_1.BadRequestException('Нельзя удалить группу: к ней привязано расписание');
        }
        await this.subgroupRepository.delete({ groupId });
        await this.groupRepository.delete(groupId);
        return { success: true };
    }
    async deleteDirection(directionId) {
        const direction = await this.directionRepository.findOne({
            where: { id: directionId },
            relations: { groups: { studentProfiles: true } },
        });
        if (!direction) {
            throw new common_1.NotFoundException('Направление не найдено');
        }
        if (direction.code === AdminAcademicService_1.IMPORT_DIRECTION_CODE) {
            throw new common_1.BadRequestException('Это служебное направление удалить нельзя');
        }
        for (const group of direction.groups) {
            if (group.studentProfiles.length > 0) {
                throw new common_1.BadRequestException('Нельзя удалить направление: в его группах есть студенты');
            }
            const schedulesCount = await this.scheduleRepository.count({
                where: { groupId: group.id },
            });
            if (schedulesCount > 0) {
                throw new common_1.BadRequestException('Нельзя удалить направление: к его группам привязано расписание');
            }
        }
        for (const group of direction.groups) {
            await this.subgroupRepository.delete({ groupId: group.id });
        }
        await this.groupRepository.delete({ directionId });
        await this.directionRepository.delete(directionId);
        return { success: true };
    }
    async deleteDepartment(departmentId) {
        const department = await this.departmentRepository.findOne({
            where: { id: departmentId },
            relations: {
                teacherProfiles: true,
                staffProfiles: true,
            },
        });
        if (!department) {
            throw new common_1.NotFoundException('Подразделение не найдено');
        }
        const isTeacherDepartment = this.isTeacherDepartment(department);
        if (department.teacherProfiles.length > 0) {
            throw new common_1.BadRequestException('Нельзя удалить кафедру: на ней есть преподаватели');
        }
        if (department.staffProfiles.length > 0) {
            throw new common_1.BadRequestException('Нельзя удалить отдел: в нём есть сотрудники');
        }
        await this.departmentRepository.delete(departmentId);
        return { success: true };
    }
    async mergeDirections(sourceDirectionId, targetDirectionId) {
        if (sourceDirectionId === targetDirectionId) {
            throw new common_1.BadRequestException('Нельзя объединить направление с самим собой');
        }
        const source = await this.directionRepository.findOne({
            where: { id: sourceDirectionId },
            relations: { groups: true },
        });
        const target = await this.directionRepository.findOne({
            where: { id: targetDirectionId },
            relations: { groups: true },
        });
        if (!source || !target) {
            throw new common_1.NotFoundException('Направление не найдено');
        }
        if (source.code === AdminAcademicService_1.IMPORT_DIRECTION_CODE) {
            throw new common_1.BadRequestException('Служебное направление объединить нельзя');
        }
        for (const sourceGroup of source.groups) {
            const targetGroup = target.groups.find((group) => group.name === sourceGroup.name
                && group.educationForm === sourceGroup.educationForm);
            if (targetGroup) {
                await this.studentProfileRepository.update({ groupId: sourceGroup.id }, { groupId: targetGroup.id });
                await this.scheduleRepository.update({ groupId: sourceGroup.id }, { groupId: targetGroup.id });
                await this.subgroupRepository.delete({ groupId: sourceGroup.id });
                await this.groupRepository.delete(sourceGroup.id);
            }
            else {
                await this.groupRepository.update(sourceGroup.id, {
                    directionId: targetDirectionId,
                });
            }
        }
        await this.directionRepository.delete(sourceDirectionId);
        return { success: true };
    }
    isTeacherDepartment(department) {
        const normalizedName = department.name.trim().toLowerCase();
        if (AdminAcademicService_1.STAFF_DEPARTMENT_MARKERS.some((marker) => normalizedName.includes(marker))) {
            return false;
        }
        if (!department.shortName?.trim()) {
            return false;
        }
        return true;
    }
    mapDepartment(department, isTeacherDepartment) {
        const members = isTeacherDepartment
            ? [
                ...department.teacherProfiles.map((profile) => this.mapTeacherMember(profile)),
                ...department.staffProfiles.map((profile) => this.mapStaffMember(profile)),
            ]
            : department.staffProfiles.map((profile) => this.mapStaffMember(profile));
        return {
            id: department.id,
            name: department.name,
            shortName: department.shortName,
            type: isTeacherDepartment ? 'teacher' : 'staff',
            headUserId: department.headUserId,
            headFullName: department.headUser
                ? this.formatFullName(department.headUser)
                : null,
            members,
        };
    }
    mapTeacherMember(profile) {
        return {
            id: profile.user.id,
            login: profile.user.login,
            fullName: this.formatFullName(profile.user),
            role: profile.user.role.code,
            position: profile.position,
            cabinet: profile.cabinet,
            isActive: profile.user.isActive,
        };
    }
    mapStaffMember(profile) {
        return {
            id: profile.user.id,
            login: profile.user.login,
            fullName: this.formatFullName(profile.user),
            role: profile.user.role.code,
            position: profile.position,
            cabinet: profile.cabinet,
            isActive: profile.user.isActive,
        };
    }
    mapStudentMember(profile) {
        return {
            id: profile.user.id,
            login: profile.user.login,
            fullName: this.formatFullName(profile.user),
            role: profile.user.role.code,
            position: `Курс ${profile.course}`,
            cabinet: null,
            isActive: profile.user.isActive,
        };
    }
    mapDirection(direction, groups) {
        return {
            id: direction.id,
            code: direction.code,
            name: direction.name,
            groups,
        };
    }
    formatFullName(user) {
        return [user.surname, user.name, user.patronymic]
            .filter(Boolean)
            .join(' ');
    }
};
exports.AdminAcademicService = AdminAcademicService;
exports.AdminAcademicService = AdminAcademicService = AdminAcademicService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __param(1, (0, typeorm_1.InjectRepository)(direction_entity_1.Direction)),
    __param(2, (0, typeorm_1.InjectRepository)(group_entity_1.Group)),
    __param(3, (0, typeorm_1.InjectRepository)(subgroup_entity_1.Subgroup)),
    __param(4, (0, typeorm_1.InjectRepository)(student_profile_entity_1.StudentProfile)),
    __param(5, (0, typeorm_1.InjectRepository)(schedule_entity_1.Schedule)),
    __param(6, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(7, (0, typeorm_1.InjectRepository)(teacher_profile_entity_1.TeacherProfile)),
    __param(8, (0, typeorm_1.InjectRepository)(staff_profile_entity_1.StaffProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminAcademicService);
//# sourceMappingURL=admin-academic.service.js.map