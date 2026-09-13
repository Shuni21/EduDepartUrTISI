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
exports.Group = exports.EducationForm = void 0;
const typeorm_1 = require("typeorm");
const direction_entity_1 = require("./direction.entity");
const subgroup_entity_1 = require("./subgroup.entity");
const student_profile_entity_1 = require("../../users/entities/student-profile.entity");
const schedule_entity_1 = require("../../schedule/entities/schedule.entity");
var EducationForm;
(function (EducationForm) {
    EducationForm["FULL_TIME"] = "full_time";
    EducationForm["PART_TIME"] = "part_time";
    EducationForm["DISTANCE"] = "distance";
})(EducationForm || (exports.EducationForm = EducationForm = {}));
let Group = class Group {
    id;
    name;
    directionId;
    direction;
    course;
    educationForm;
    subgroups;
    studentProfiles;
    schedules;
};
exports.Group = Group;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Group.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Group.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Group.prototype, "directionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => direction_entity_1.Direction, (direction) => direction.groups, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'directionId' }),
    __metadata("design:type", direction_entity_1.Direction)
], Group.prototype, "direction", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint' }),
    __metadata("design:type", Number)
], Group.prototype, "course", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: EducationForm }),
    __metadata("design:type", String)
], Group.prototype, "educationForm", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => subgroup_entity_1.Subgroup, (subgroup) => subgroup.group),
    __metadata("design:type", Array)
], Group.prototype, "subgroups", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => student_profile_entity_1.StudentProfile, (profile) => profile.group),
    __metadata("design:type", Array)
], Group.prototype, "studentProfiles", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => schedule_entity_1.Schedule, (schedule) => schedule.group),
    __metadata("design:type", Array)
], Group.prototype, "schedules", void 0);
exports.Group = Group = __decorate([
    (0, typeorm_1.Entity)('groups')
], Group);
//# sourceMappingURL=group.entity.js.map