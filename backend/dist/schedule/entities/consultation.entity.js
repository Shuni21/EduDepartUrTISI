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
exports.Consultation = void 0;
const typeorm_1 = require("typeorm");
const department_entity_1 = require("../../academic/entities/department.entity");
const user_entity_1 = require("../../users/entities/user.entity");
let Consultation = class Consultation {
    id;
    departmentId;
    department;
    teacherId;
    teacher;
    subject;
    consultationType;
    dayOfWeek;
    startTime;
    endTime;
    weekStart;
    room;
    comment;
    createdAt;
    updatedAt;
};
exports.Consultation = Consultation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Consultation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Consultation.prototype, "departmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => department_entity_1.Department, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'departmentId' }),
    __metadata("design:type", department_entity_1.Department)
], Consultation.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Consultation.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'teacherId' }),
    __metadata("design:type", user_entity_1.User)
], Consultation.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Consultation.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Consultation.prototype, "consultationType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint' }),
    __metadata("design:type", Number)
], Consultation.prototype, "dayOfWeek", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time' }),
    __metadata("design:type", String)
], Consultation.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time' }),
    __metadata("design:type", String)
], Consultation.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], Consultation.prototype, "weekStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Consultation.prototype, "room", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Consultation.prototype, "comment", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Consultation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Consultation.prototype, "updatedAt", void 0);
exports.Consultation = Consultation = __decorate([
    (0, typeorm_1.Entity)('consultations')
], Consultation);
//# sourceMappingURL=consultation.entity.js.map