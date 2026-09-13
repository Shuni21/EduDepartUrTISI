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
exports.DepartmentsSeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const staff_departments_constants_1 = require("../database/seeds/staff-departments.constants");
const department_entity_1 = require("./entities/department.entity");
const teacher_departments_constants_1 = require("./teacher-departments.constants");
let DepartmentsSeedService = class DepartmentsSeedService {
    departmentRepository;
    constructor(departmentRepository) {
        this.departmentRepository = departmentRepository;
    }
    async onModuleInit() {
        await this.seedTeacherDepartments();
        await this.seedStaffDepartments();
    }
    async seedTeacherDepartments() {
        for (const item of teacher_departments_constants_1.TEACHER_DEPARTMENTS) {
            const existing = await this.departmentRepository.findOne({
                where: { shortName: item.shortName },
            });
            if (existing) {
                if (existing.name !== item.name) {
                    existing.name = item.name;
                    await this.departmentRepository.save(existing);
                }
                continue;
            }
            await this.departmentRepository.save({
                shortName: item.shortName,
                name: item.name,
            });
        }
    }
    async seedStaffDepartments() {
        for (const item of staff_departments_constants_1.STAFF_DEPARTMENTS) {
            const existing = await this.departmentRepository.findOne({
                where: { name: item.name },
            });
            if (existing) {
                continue;
            }
            await this.departmentRepository.save({
                name: item.name,
                shortName: null,
            });
        }
    }
};
exports.DepartmentsSeedService = DepartmentsSeedService;
exports.DepartmentsSeedService = DepartmentsSeedService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DepartmentsSeedService);
//# sourceMappingURL=departments-seed.service.js.map