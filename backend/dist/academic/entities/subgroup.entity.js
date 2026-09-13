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
exports.Subgroup = void 0;
const typeorm_1 = require("typeorm");
const group_entity_1 = require("./group.entity");
const student_profile_entity_1 = require("../../users/entities/student-profile.entity");
const schedule_item_entity_1 = require("../../schedule/entities/schedule-item.entity");
let Subgroup = class Subgroup {
    id;
    groupId;
    group;
    number;
    studentProfiles;
    scheduleItems;
};
exports.Subgroup = Subgroup;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Subgroup.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Subgroup.prototype, "groupId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => group_entity_1.Group, (group) => group.subgroups, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'groupId' }),
    __metadata("design:type", group_entity_1.Group)
], Subgroup.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint' }),
    __metadata("design:type", Number)
], Subgroup.prototype, "number", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => student_profile_entity_1.StudentProfile, (profile) => profile.subgroup),
    __metadata("design:type", Array)
], Subgroup.prototype, "studentProfiles", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => schedule_item_entity_1.ScheduleItem, (item) => item.subgroup),
    __metadata("design:type", Array)
], Subgroup.prototype, "scheduleItems", void 0);
exports.Subgroup = Subgroup = __decorate([
    (0, typeorm_1.Entity)('subgroups'),
    (0, typeorm_1.Unique)(['groupId', 'number'])
], Subgroup);
//# sourceMappingURL=subgroup.entity.js.map