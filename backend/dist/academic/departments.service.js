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
var DepartmentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const department_entity_1 = require("./entities/department.entity");
const teacher_departments_constants_1 = require("./teacher-departments.constants");
let DepartmentsService = class DepartmentsService {
    static { DepartmentsService_1 = this; }
    departmentRepository;
    static STAFF_DEPARTMENT_MARKERS = ['учебный отдел'];
    constructor(departmentRepository) {
        this.departmentRepository = departmentRepository;
    }
    isStaffDepartment(department) {
        const normalizedName = department.name.trim().toLowerCase();
        if (DepartmentsService_1.STAFF_DEPARTMENT_MARKERS.some((marker) => normalizedName.includes(marker))) {
            return true;
        }
        return !department.shortName?.trim();
    }
    mapDepartment(department) {
        return {
            id: department.id,
            shortName: department.shortName ?? '',
            name: department.name,
            label: (0, teacher_departments_constants_1.formatTeacherDepartmentLabel)({
                shortName: department.shortName ?? '',
                name: department.name,
            }),
        };
    }
    async listStaffDepartments() {
        const departments = await this.departmentRepository.find({
            order: { name: 'ASC' },
        });
        return departments
            .filter((department) => this.isStaffDepartment(department))
            .map((department) => ({
            id: department.id,
            name: department.name,
        }));
    }
    async resolveStaffDepartmentId(departmentId) {
        const department = await this.departmentRepository.findOne({
            where: { id: departmentId },
        });
        if (!department || !this.isStaffDepartment(department)) {
            throw new common_1.BadRequestException('Выберите отдел из списка');
        }
        return department;
    }
    async resolveDepartmentByInput(raw) {
        const trimmed = raw.trim();
        if (!trimmed) {
            throw new common_1.BadRequestException('Укажите структурное подразделение');
        }
        const byExactName = await this.departmentRepository.findOne({
            where: { name: trimmed },
        });
        if (byExactName) {
            return byExactName;
        }
        const departments = await this.departmentRepository.find();
        const normalizedInput = this.normalizeDepartmentInput(trimmed);
        for (const department of departments) {
            if (department.shortName?.trim()) {
                const shortName = department.shortName.trim();
                if (shortName === trimmed || shortName.toLowerCase() === trimmed.toLowerCase()) {
                    return department;
                }
                if (this.normalizeDepartmentInput(shortName) === normalizedInput) {
                    return department;
                }
            }
            if (this.normalizeDepartmentInput(department.name) === normalizedInput) {
                return department;
            }
        }
        return this.departmentRepository.save({
            name: trimmed,
            shortName: null,
        });
    }
    normalizeDepartmentInput(value) {
        return value
            .trim()
            .toLowerCase()
            .replace(/[«»„""]/g, '')
            .replace(/\s+/g, ' ')
            .replace(/^кафедра\s+/u, '');
    }
    async listTeacherDepartments() {
        const departments = await this.departmentRepository.find({
            where: {
                shortName: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()),
            },
            order: {
                shortName: 'ASC',
            },
        });
        return departments
            .filter((department) => department.shortName?.trim())
            .filter((department) => !this.isStaffDepartment(department))
            .map((department) => this.mapDepartment(department));
    }
    async resolveTeacherDepartmentId(departmentId) {
        const department = await this.departmentRepository.findOne({
            where: { id: departmentId },
        });
        if (!department?.shortName?.trim() || this.isStaffDepartment(department)) {
            throw new common_1.BadRequestException('Выберите кафедру из списка');
        }
        return department;
    }
    async getTeacherDepartmentById(departmentId) {
        const department = await this.resolveTeacherDepartmentId(departmentId);
        return this.mapDepartment(department);
    }
    async getTeacherDepartmentByShortName(shortName) {
        const department = await this.departmentRepository.findOne({
            where: { shortName },
        });
        if (!department) {
            throw new common_1.NotFoundException(`Кафедра ${shortName} не найдена`);
        }
        return department;
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = DepartmentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map