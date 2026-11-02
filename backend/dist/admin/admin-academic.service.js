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
const group_entity_1 = require("../academic/entities/group.entity");
const subgroup_entity_1 = require("../academic/entities/subgroup.entity");
const schedule_entity_1 = require("../schedule/entities/schedule.entity");
const user_entity_1 = require("../users/entities/user.entity");
const teacher_profile_entity_1 = require("../users/entities/teacher-profile.entity");
const staff_profile_entity_1 = require("../users/entities/staff-profile.entity");
let AdminAcademicService = class AdminAcademicService {
    static { AdminAcademicService_1 = this; }
    departmentRepository;
    groupRepository;
    subgroupRepository;
    scheduleRepository;
    usersRepository;
    teacherProfileRepository;
    staffProfileRepository;
    static STAFF_DEPARTMENT_MARKERS = ['учебный отдел'];
    constructor(departmentRepository, groupRepository, subgroupRepository, scheduleRepository, usersRepository, teacherProfileRepository, staffProfileRepository) {
        this.departmentRepository = departmentRepository;
        this.groupRepository = groupRepository;
        this.subgroupRepository = subgroupRepository;
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
        const groups = await this.groupRepository.find({
            relations: {
                studentProfiles: {
                    user: {
                        role: true,
                    },
                },
            },
            order: { name: 'ASC', educationForm: 'ASC' },
        });
        return {
            teacherDepartments,
            staffDepartments,
            groups: groups
                .map((group) => ({
                id: group.id,
                name: group.name,
                educationForm: group.educationForm,
                students: group.studentProfiles
                    .map((profile) => this.mapStudentMember(profile))
                    .sort((left, right) => left.fullName.localeCompare(right.fullName, 'ru', {
                    sensitivity: 'base',
                })),
            }))
                .sort((left, right) => left.name.localeCompare(right.name, 'ru', {
                sensitivity: 'base',
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
    async createGroup(dto) {
        const groupName = dto.name.trim();
        const existing = await this.groupRepository.findOne({
            where: {
                name: groupName,
                educationForm: dto.educationForm,
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Такая группа уже существует');
        }
        const group = await this.groupRepository.save({
            name: groupName,
            course: 1,
            educationForm: dto.educationForm,
        });
        return {
            id: group.id,
            name: group.name,
            educationForm: group.educationForm,
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
    __param(1, (0, typeorm_1.InjectRepository)(group_entity_1.Group)),
    __param(2, (0, typeorm_1.InjectRepository)(subgroup_entity_1.Subgroup)),
    __param(3, (0, typeorm_1.InjectRepository)(schedule_entity_1.Schedule)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(5, (0, typeorm_1.InjectRepository)(teacher_profile_entity_1.TeacherProfile)),
    __param(6, (0, typeorm_1.InjectRepository)(staff_profile_entity_1.StaffProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminAcademicService);
//# sourceMappingURL=admin-academic.service.js.map