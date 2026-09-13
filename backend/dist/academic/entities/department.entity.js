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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Department = void 0;
const typeorm_1 = require("typeorm");
const teacher_profile_entity_1 = require("../../users/entities/teacher-profile.entity");
const staff_profile_entity_1 = require("../../users/entities/staff-profile.entity");
const user_entity_1 = require("../../users/entities/user.entity");
let Department = class Department {
    id;
    name;
    shortName;
    headUserId;
    headUser;
    teacherProfiles;
    staffProfiles;
};
exports.Department = Department;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Department.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Department.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Department.prototype, "shortName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Department.prototype, "headUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'headUserId' }),
    __metadata("design:type", Object)
], Department.prototype, "headUser", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => teacher_profile_entity_1.TeacherProfile, (profile) => profile.department),
    __metadata("design:type", Array)
], Department.prototype, "teacherProfiles", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => staff_profile_entity_1.StaffProfile, (profile) => profile.department),
    __metadata("design:type", Array)
], Department.prototype, "staffProfiles", void 0);
exports.Department = Department = __decorate([
    (0, typeorm_1.Entity)('departments')
], Department);
//# sourceMappingURL=department.entity.js.map