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
exports.TeacherProfile = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const department_entity_1 = require("../../academic/entities/department.entity");
let TeacherProfile = class TeacherProfile {
    id;
    userId;
    user;
    departmentId;
    department;
    position;
    cabinet;
};
exports.TeacherProfile = TeacherProfile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TeacherProfile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TeacherProfile.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (user) => user.teacherProfile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], TeacherProfile.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TeacherProfile.prototype, "departmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => department_entity_1.Department, (department) => department.teacherProfiles, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'departmentId' }),
    __metadata("design:type", department_entity_1.Department)
], TeacherProfile.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TeacherProfile.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "cabinet", void 0);
exports.TeacherProfile = TeacherProfile = __decorate([
    (0, typeorm_1.Entity)('teacher_profiles'),
    (0, typeorm_1.Unique)(['userId'])
], TeacherProfile);
//# sourceMappingURL=teacher-profile.entity.js.map