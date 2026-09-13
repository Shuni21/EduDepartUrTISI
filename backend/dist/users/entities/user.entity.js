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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const role_entity_1 = require("./role.entity");
const refresh_token_entity_1 = require("../../auth/entities/refresh-token.entity");
const student_profile_entity_1 = require("./student-profile.entity");
const teacher_profile_entity_1 = require("./teacher-profile.entity");
const staff_profile_entity_1 = require("./staff-profile.entity");
let User = class User {
    id;
    login;
    passwordHash;
    roleId;
    role;
    surname;
    name;
    patronymic;
    photoUrl;
    isActive;
    createdAt;
    updatedAt;
    refreshTokens;
    studentProfile;
    teacherProfile;
    staffProfile;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "login", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], User.prototype, "roleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => role_entity_1.Role, (role) => role.users, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'roleId' }),
    __metadata("design:type", role_entity_1.Role)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "surname", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "patronymic", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "photoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => refresh_token_entity_1.RefreshToken, (token) => token.user),
    __metadata("design:type", Array)
], User.prototype, "refreshTokens", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => student_profile_entity_1.StudentProfile, (profile) => profile.user),
    __metadata("design:type", student_profile_entity_1.StudentProfile)
], User.prototype, "studentProfile", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => teacher_profile_entity_1.TeacherProfile, (profile) => profile.user),
    __metadata("design:type", teacher_profile_entity_1.TeacherProfile)
], User.prototype, "teacherProfile", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => staff_profile_entity_1.StaffProfile, (profile) => profile.user),
    __metadata("design:type", staff_profile_entity_1.StaffProfile)
], User.prototype, "staffProfile", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map