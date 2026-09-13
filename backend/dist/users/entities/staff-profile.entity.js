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
exports.StaffProfile = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const department_entity_1 = require("../../academic/entities/department.entity");
let StaffProfile = class StaffProfile {
    id;
    userId;
    user;
    departmentId;
    department;
    position;
    cabinet;
};
exports.StaffProfile = StaffProfile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], StaffProfile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], StaffProfile.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (user) => user.staffProfile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], StaffProfile.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], StaffProfile.prototype, "departmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => department_entity_1.Department, (department) => department.staffProfiles, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'departmentId' }),
    __metadata("design:type", department_entity_1.Department)
], StaffProfile.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StaffProfile.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], StaffProfile.prototype, "cabinet", void 0);
exports.StaffProfile = StaffProfile = __decorate([
    (0, typeorm_1.Entity)('staff_profiles'),
    (0, typeorm_1.Unique)(['userId'])
], StaffProfile);
//# sourceMappingURL=staff-profile.entity.js.map