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
exports.Schedule = exports.ScheduleType = void 0;
const typeorm_1 = require("typeorm");
const group_entity_1 = require("../../academic/entities/group.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const schedule_item_entity_1 = require("./schedule-item.entity");
const schedule_type_enum_1 = require("./schedule-type.enum");
const schedule_upload_entity_1 = require("./schedule-upload.entity");
var schedule_type_enum_2 = require("./schedule-type.enum");
Object.defineProperty(exports, "ScheduleType", { enumerable: true, get: function () { return schedule_type_enum_2.ScheduleType; } });
let Schedule = class Schedule {
    id;
    scheduleType;
    groupId;
    group;
    teacherId;
    uploadId;
    upload;
    teacher;
    validFrom;
    validTo;
    isActive;
    items;
};
exports.Schedule = Schedule;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Schedule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: schedule_type_enum_1.ScheduleType }),
    __metadata("design:type", String)
], Schedule.prototype, "scheduleType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], Schedule.prototype, "groupId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => group_entity_1.Group, (group) => group.schedules, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'groupId' }),
    __metadata("design:type", Object)
], Schedule.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], Schedule.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], Schedule.prototype, "uploadId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => schedule_upload_entity_1.ScheduleUpload, { nullable: true, onDelete: `SET NULL` }),
    (0, typeorm_1.JoinColumn)({ name: 'uploadId' }),
    __metadata("design:type", Object)
], Schedule.prototype, "upload", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'teacherId' }),
    __metadata("design:type", Object)
], Schedule.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], Schedule.prototype, "validFrom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], Schedule.prototype, "validTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Schedule.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => schedule_item_entity_1.ScheduleItem, (item) => item.schedule),
    __metadata("design:type", Array)
], Schedule.prototype, "items", void 0);
exports.Schedule = Schedule = __decorate([
    (0, typeorm_1.Entity)('schedules')
], Schedule);
//# sourceMappingURL=schedule.entity.js.map