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
exports.ScheduleItem = exports.WeekType = void 0;
const typeorm_1 = require("typeorm");
const schedule_entity_1 = require("./schedule.entity");
const subject_entity_1 = require("../../academic/entities/subject.entity");
const subgroup_entity_1 = require("../../academic/entities/subgroup.entity");
const lesson_type_entity_1 = require("./lesson-type.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const room_entity_1 = require("./room.entity");
var WeekType;
(function (WeekType) {
    WeekType["EVEN"] = "even";
    WeekType["ODD"] = "odd";
})(WeekType || (exports.WeekType = WeekType = {}));
let ScheduleItem = class ScheduleItem {
    id;
    scheduleId;
    schedule;
    subjectId;
    subject;
    subgroupId;
    subgroup;
    lessonTypeId;
    lessonType;
    teacherId;
    teacher;
    roomId;
    room;
    dayOfWeek;
    startTime;
    endTime;
    weekType;
    comment;
    weekStart;
    isDisabled;
    isSameCellParallel;
    teacherPosition;
    legacyTeacherName;
};
exports.ScheduleItem = ScheduleItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ScheduleItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ScheduleItem.prototype, "scheduleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => schedule_entity_1.Schedule, (schedule) => schedule.items, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'scheduleId' }),
    __metadata("design:type", schedule_entity_1.Schedule)
], ScheduleItem.prototype, "schedule", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ScheduleItem.prototype, "subjectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => subject_entity_1.Subject, (subject) => subject.scheduleItems, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'subjectId' }),
    __metadata("design:type", subject_entity_1.Subject)
], ScheduleItem.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], ScheduleItem.prototype, "subgroupId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => subgroup_entity_1.Subgroup, (subgroup) => subgroup.scheduleItems, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'subgroupId' }),
    __metadata("design:type", Object)
], ScheduleItem.prototype, "subgroup", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ScheduleItem.prototype, "lessonTypeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => lesson_type_entity_1.LessonType, (lessonType) => lessonType.scheduleItems, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'lessonTypeId' }),
    __metadata("design:type", lesson_type_entity_1.LessonType)
], ScheduleItem.prototype, "lessonType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], ScheduleItem.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'teacherId' }),
    __metadata("design:type", Object)
], ScheduleItem.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], ScheduleItem.prototype, "roomId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => room_entity_1.Room, (room) => room.scheduleItems, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'roomId' }),
    __metadata("design:type", Object)
], ScheduleItem.prototype, "room", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint' }),
    __metadata("design:type", Number)
], ScheduleItem.prototype, "dayOfWeek", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time' }),
    __metadata("design:type", String)
], ScheduleItem.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time' }),
    __metadata("design:type", String)
], ScheduleItem.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: WeekType, nullable: true }),
    __metadata("design:type", Object)
], ScheduleItem.prototype, "weekType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ScheduleItem.prototype, "comment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], ScheduleItem.prototype, "weekStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ScheduleItem.prototype, "isDisabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ScheduleItem.prototype, "isSameCellParallel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ScheduleItem.prototype, "teacherPosition", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ScheduleItem.prototype, "legacyTeacherName", void 0);
exports.ScheduleItem = ScheduleItem = __decorate([
    (0, typeorm_1.Entity)('schedule_items')
], ScheduleItem);
//# sourceMappingURL=schedule-item.entity.js.map